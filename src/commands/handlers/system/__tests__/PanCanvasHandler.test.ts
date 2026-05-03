import { panCanvasHandler } from '../PanCanvasHandler';

interface MockCanvas {
  animatePan: jest.Mock;
  ping: jest.Mock;
}

const createMockCanvas = (): MockCanvas => ({
  animatePan: jest.fn().mockResolvedValue(undefined),
  ping: jest.fn().mockResolvedValue(undefined)
});

describe('panCanvasHandler', () => {
  let mockCanvas: MockCanvas;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanvas = createMockCanvas();
    (globalThis as Record<string, unknown>)['canvas'] = mockCanvas;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['canvas'];
  });

  it('passes all parameters to animatePan', async () => {
    const result = await panCanvasHandler({ x: 100, y: 200, scale: 1.5, duration: 500 });

    expect(mockCanvas.animatePan).toHaveBeenCalledWith({ x: 100, y: 200, scale: 1.5, duration: 500 });
    expect(result).toEqual({ panned: true });
  });

  it('passes only specified parameters (partial)', async () => {
    await panCanvasHandler({ x: 50 });

    expect(mockCanvas.animatePan).toHaveBeenCalledWith({ x: 50 });
  });

  it('passes empty object when no params provided', async () => {
    await panCanvasHandler({});

    expect(mockCanvas.animatePan).toHaveBeenCalledWith({});
  });

  it('throws when canvas is not available', async () => {
    delete (globalThis as Record<string, unknown>)['canvas'];

    await expect(panCanvasHandler({ x: 0, y: 0 })).rejects.toThrow('Canvas not available');
  });

  it('throws when canvas is null', async () => {
    (globalThis as Record<string, unknown>)['canvas'] = null;

    await expect(panCanvasHandler({})).rejects.toThrow('Canvas not available');
  });
});
