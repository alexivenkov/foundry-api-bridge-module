import { UpdateLoop } from '../UpdateLoop';
import type { WorldDataCollector } from '../../collectors/WorldDataCollector';
import type { ApiClient } from '../../api/ApiClient';
import type { WorldData } from '../../types/foundry';

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
    jest.useRealTimers();
  });

  it('starts and sends data immediately', () => {
    updateLoop.start();

    expect(mockCollector.collect).toHaveBeenCalledTimes(1);
    expect(mockApiClient.sendWorldData).toHaveBeenCalledWith('/update', mockWorldData);
  });

  it('sends data periodically', () => {
    updateLoop.start();

    jest.advanceTimersByTime(5000);
    expect(mockCollector.collect).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(5000);
    expect(mockCollector.collect).toHaveBeenCalledTimes(3);
  });

  it('does not start multiple times', () => {
    updateLoop.start();
    updateLoop.start();

    jest.advanceTimersByTime(5000);
    expect(mockCollector.collect).toHaveBeenCalledTimes(2);
  });

  it('stops the loop', () => {
    updateLoop.start();
    expect(updateLoop.isRunning()).toBe(true);

    updateLoop.stop();
    expect(updateLoop.isRunning()).toBe(false);

    jest.advanceTimersByTime(10000);
    expect(mockCollector.collect).toHaveBeenCalledTimes(1);
  });

  it('returns running status', () => {
    expect(updateLoop.isRunning()).toBe(false);

    updateLoop.start();
    expect(updateLoop.isRunning()).toBe(true);

    updateLoop.stop();
    expect(updateLoop.isRunning()).toBe(false);
  });

  it('handles send errors gracefully', () => {
    mockApiClient.sendWorldData.mockRejectedValue(new Error('Network error'));

    updateLoop.start();

    jest.advanceTimersByTime(5000);
    expect(mockCollector.collect).toHaveBeenCalledTimes(2);
  });

  it('does nothing when stopping already stopped loop', () => {
    updateLoop.stop();

    expect(updateLoop.isRunning()).toBe(false);
  });
});
