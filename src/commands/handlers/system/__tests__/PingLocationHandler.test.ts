import { pingLocationHandler } from '../PingLocationHandler';

interface MockCanvas {
  animatePan: jest.Mock;
  ping: jest.Mock;
}

const createMockCanvas = (): MockCanvas => ({
  animatePan: jest.fn().mockResolvedValue(undefined),
  ping: jest.fn().mockResolvedValue(undefined)
});

describe('pingLocationHandler', () => {
  let mockCanvas: MockCanvas;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanvas = createMockCanvas();
    (globalThis as Record<string, unknown>)['canvas'] = mockCanvas;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['canvas'];
  });

  it('pings with minimal x/y', async () => {
    const result = await pingLocationHandler({ x: 100, y: 200 });

    expect(mockCanvas.ping).toHaveBeenCalledWith({ x: 100, y: 200 }, {});
    expect(result).toEqual({ pinged: true, x: 100, y: 200 });
  });

  it('passes style option', async () => {
    await pingLocationHandler({ x: 0, y: 0, style: 'arrow' });

    expect(mockCanvas.ping).toHaveBeenCalledWith({ x: 0, y: 0 }, { style: 'arrow' });
  });

  it('passes color and duration', async () => {
    await pingLocationHandler({ x: 50, y: 75, color: '#ff0000', duration: 1500 });

    expect(mockCanvas.ping).toHaveBeenCalledWith(
      { x: 50, y: 75 },
      { color: '#ff0000', duration: 1500 }
    );
  });

  it('throws when canvas is not available', async () => {
    delete (globalThis as Record<string, unknown>)['canvas'];

    await expect(pingLocationHandler({ x: 0, y: 0 })).rejects.toThrow('Canvas not available');
  });

  it('passes point object as { x, y } structure', async () => {
    await pingLocationHandler({ x: 999, y: 888, style: 'pulse', color: '#00ff00' });

    const call = mockCanvas.ping.mock.calls[0];
    expect(call?.[0]).toEqual({ x: 999, y: 888 });
    expect(call?.[1]).toEqual({ style: 'pulse', color: '#00ff00' });
  });
});
