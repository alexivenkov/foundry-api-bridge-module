import { UpdateLoop } from '@/core/UpdateLoop';
import { ApiError } from '@/api/ApiClient';
import type { WorldDataCollector } from '@/collectors/WorldDataCollector';
import type { ApiClient } from '@/api/ApiClient';
import type { WorldData } from '@/types/foundry';

describe('UpdateLoop', () => {
  let mockCollector: jest.Mocked<WorldDataCollector>;
  let mockApiClient: jest.Mocked<ApiClient>;
  let updateLoop: UpdateLoop;

  const mockWorldData: WorldData = {
    world: {
      id: 'test',
      title: 'Test',
      system: 'dnd5e',
      systemVersion: '3.0.0',
      foundryVersion: '12'
    },
    counts: { journals: 0, actors: 0, items: 0, scenes: 0 },
    journals: [],
    actors: [],
    scenes: [],
    items: [],
    compendiumMeta: []
  };

  beforeEach(() => {
    jest.useFakeTimers();
    (global as Record<string, unknown>)['console'] = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    mockCollector = {
      collect: jest.fn().mockReturnValue(mockWorldData)
    } as unknown as jest.Mocked<WorldDataCollector>;

    mockApiClient = {
      sendWorldData: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<ApiClient>;

    updateLoop = new UpdateLoop(5000, mockCollector, mockApiClient, '/update');
  });

  afterEach(() => {
    updateLoop.stop();
    jest.useRealTimers();
  });

  it('starts and sends data immediately', async () => {
    updateLoop.start();
    await jest.advanceTimersByTimeAsync(0);

    expect(mockCollector.collect).toHaveBeenCalledTimes(1);
    expect(mockApiClient.sendWorldData).toHaveBeenCalledWith('/update', mockWorldData, expect.any(AbortSignal));
  });

  it('sends data sequentially after interval', async () => {
    updateLoop.start();
    await jest.advanceTimersByTimeAsync(0); // first send
    await jest.advanceTimersByTimeAsync(5000); // wait interval + second send

    expect(mockCollector.collect).toHaveBeenCalledTimes(2);
  });

  it('waits for previous request to complete before next', async () => {
    const resolveHolder: { fn: (() => void) | null } = { fn: null };
    mockApiClient.sendWorldData.mockImplementation(() => {
      return new Promise<void>(resolve => {
        resolveHolder.fn = resolve;
      });
    });

    updateLoop.start();
    await jest.advanceTimersByTimeAsync(0);

    // First request is in flight
    expect(mockCollector.collect).toHaveBeenCalledTimes(1);

    // Advance past interval — should NOT start second request
    await jest.advanceTimersByTimeAsync(10000);
    expect(mockCollector.collect).toHaveBeenCalledTimes(1);

    // Complete first request
    resolveHolder.fn?.();
    await jest.advanceTimersByTimeAsync(0);

    // Now wait for interval
    await jest.advanceTimersByTimeAsync(5000);
    expect(mockCollector.collect).toHaveBeenCalledTimes(2);
  });

  it('does not start multiple times', async () => {
    updateLoop.start();
    updateLoop.start();

    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(5000);

    expect(mockCollector.collect).toHaveBeenCalledTimes(2);
  });

  it('stops the loop', async () => {
    updateLoop.start();
    expect(updateLoop.isRunning()).toBe(true);

    await jest.advanceTimersByTimeAsync(0); // first send
    updateLoop.stop();
    expect(updateLoop.isRunning()).toBe(false);

    await jest.advanceTimersByTimeAsync(10000);
    expect(mockCollector.collect).toHaveBeenCalledTimes(1);
  });

  it('returns running status', () => {
    expect(updateLoop.isRunning()).toBe(false);

    updateLoop.start();
    expect(updateLoop.isRunning()).toBe(true);

    updateLoop.stop();
    expect(updateLoop.isRunning()).toBe(false);
  });

  it('handles send errors gracefully and continues', async () => {
    mockApiClient.sendWorldData
      .mockRejectedValueOnce(new ApiError('Bad Request', 400))
      .mockResolvedValue(undefined);

    updateLoop.start();
    await jest.advanceTimersByTimeAsync(0); // first send (error)
    await jest.advanceTimersByTimeAsync(5000); // normal interval, second send

    expect(mockCollector.collect).toHaveBeenCalledTimes(2);
  });

  it('does nothing when stopping already stopped loop', () => {
    updateLoop.stop();
    expect(updateLoop.isRunning()).toBe(false);
  });

  describe('backoff', () => {
    it('backs off on 429 with interval * 3', async () => {
      mockApiClient.sendWorldData
        .mockRejectedValueOnce(new ApiError('Too Many Requests', 429))
        .mockResolvedValue(undefined);

      updateLoop.start();
      await jest.advanceTimersByTimeAsync(0); // first send → 429

      // Should not send after normal interval
      await jest.advanceTimersByTimeAsync(5000);
      expect(mockCollector.collect).toHaveBeenCalledTimes(1);

      // Should send after interval * 3 = 15000
      await jest.advanceTimersByTimeAsync(10000);
      expect(mockCollector.collect).toHaveBeenCalledTimes(2);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Rate limited (429)')
      );
    });

    it('backs off on 502 with interval * 6', async () => {
      mockApiClient.sendWorldData
        .mockRejectedValueOnce(new ApiError('Bad Gateway', 502))
        .mockResolvedValue(undefined);

      updateLoop.start();
      await jest.advanceTimersByTimeAsync(0); // first send → 502

      // Should not send after normal interval
      await jest.advanceTimersByTimeAsync(5000);
      expect(mockCollector.collect).toHaveBeenCalledTimes(1);

      // Should send after interval * 6 = 30000
      await jest.advanceTimersByTimeAsync(25000);
      expect(mockCollector.collect).toHaveBeenCalledTimes(2);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Server unavailable (502)')
      );
    });

    it('backs off on 503 with interval * 6', async () => {
      mockApiClient.sendWorldData
        .mockRejectedValueOnce(new ApiError('Service Unavailable', 503))
        .mockResolvedValue(undefined);

      updateLoop.start();
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(30000); // interval * 6

      expect(mockCollector.collect).toHaveBeenCalledTimes(2);
    });

    it('backs off on network error with interval * 6', async () => {
      mockApiClient.sendWorldData
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValue(undefined);

      updateLoop.start();
      await jest.advanceTimersByTimeAsync(0);

      await jest.advanceTimersByTimeAsync(5000);
      expect(mockCollector.collect).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(25000); // total 30000 = interval * 6
      expect(mockCollector.collect).toHaveBeenCalledTimes(2);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      );
    });

    it('uses normal interval on 400 error', async () => {
      mockApiClient.sendWorldData
        .mockRejectedValueOnce(new ApiError('Bad Request', 400))
        .mockResolvedValue(undefined);

      updateLoop.start();
      await jest.advanceTimersByTimeAsync(0); // send → 400
      await jest.advanceTimersByTimeAsync(5000); // normal interval

      expect(mockCollector.collect).toHaveBeenCalledTimes(2);
    });

    it('returns to normal interval after backoff', async () => {
      mockApiClient.sendWorldData
        .mockRejectedValueOnce(new ApiError('Too Many Requests', 429))
        .mockResolvedValue(undefined);

      updateLoop.start();
      await jest.advanceTimersByTimeAsync(0); // send → 429
      await jest.advanceTimersByTimeAsync(15000); // backoff interval * 3, second send → 200
      await jest.advanceTimersByTimeAsync(5000); // normal interval, third send

      expect(mockCollector.collect).toHaveBeenCalledTimes(3);
    });
  });

  describe('abort', () => {
    it('passes AbortSignal to sendWorldData', async () => {
      updateLoop.start();
      await jest.advanceTimersByTimeAsync(0);

      expect(mockApiClient.sendWorldData).toHaveBeenCalledWith(
        '/update',
        mockWorldData,
        expect.any(AbortSignal)
      );
    });

    it('aborts inflight request on stop', async () => {
      let capturedSignal: AbortSignal | undefined;
      mockApiClient.sendWorldData.mockImplementation((_endpoint, _data, signal) => {
        capturedSignal = signal;
        return new Promise<void>(() => {}); // never resolves
      });

      updateLoop.start();
      await jest.advanceTimersByTimeAsync(0);

      expect(capturedSignal?.aborted).toBe(false);
      updateLoop.stop();
      expect(capturedSignal?.aborted).toBe(true);
    });

    it('does not log error on abort', async () => {
      const abortError = new DOMException('The operation was aborted.', 'AbortError');
      mockApiClient.sendWorldData.mockRejectedValueOnce(abortError);

      updateLoop.start();
      await jest.advanceTimersByTimeAsync(0);
      updateLoop.stop();

      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('restart', () => {
    it('can be restarted after stop', async () => {
      updateLoop.start();
      await jest.advanceTimersByTimeAsync(0);
      updateLoop.stop();

      mockCollector.collect.mockClear();
      mockApiClient.sendWorldData.mockClear();

      updateLoop.start();
      await jest.advanceTimersByTimeAsync(0);

      expect(mockCollector.collect).toHaveBeenCalledTimes(1);
      expect(mockApiClient.sendWorldData).toHaveBeenCalledTimes(1);
    });
  });
});
