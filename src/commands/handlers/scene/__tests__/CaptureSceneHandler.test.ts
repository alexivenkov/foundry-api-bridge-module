import { captureSceneHandler } from '../CaptureSceneHandler';

interface MockCanvas {
  ready: boolean;
  app: {
    renderer: {
      extract: { base64: jest.Mock };
      width: number;
      height: number;
    };
  };
  stage: object;
  scene: { id: string; name: string } | null;
}

function createMockCanvas(overrides?: Partial<MockCanvas>): MockCanvas {
  return {
    ready: true,
    app: {
      renderer: {
        extract: {
          base64: jest.fn().mockResolvedValue('data:image/webp;base64,abc123encodeddata')
        },
        width: 1920,
        height: 1080
      }
    },
    stage: {},
    scene: { id: 'scene-1', name: 'Tavern' },
    ...overrides
  };
}

function setCanvas(canvas: MockCanvas | undefined): void {
  if (canvas === undefined) {
    delete (globalThis as Record<string, unknown>)['canvas'];
  } else {
    (globalThis as Record<string, unknown>)['canvas'] = canvas;
  }
}

function clearCanvas(): void {
  delete (globalThis as Record<string, unknown>)['canvas'];
}

describe('captureSceneHandler', () => {
  afterEach(clearCanvas);

  it('should capture canvas and return base64 image without data URL prefix', async () => {
    const canvas = createMockCanvas();
    setCanvas(canvas);

    const result = await captureSceneHandler({} as Record<string, never>);

    expect(result.sceneId).toBe('scene-1');
    expect(result.sceneName).toBe('Tavern');
    expect(result.image).toBe('abc123encodeddata');
    expect(result.mimeType).toBe('image/webp');
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  });

  it('should call extract.base64 with stage, webp mime type and quality', async () => {
    const canvas = createMockCanvas();
    setCanvas(canvas);

    await captureSceneHandler({} as Record<string, never>);

    expect(canvas.app.renderer.extract.base64).toHaveBeenCalledWith(
      canvas.stage,
      'image/webp',
      0.8
    );
  });

  it('should reject when canvas is not ready', async () => {
    setCanvas(createMockCanvas({ ready: false }));

    await expect(captureSceneHandler({} as Record<string, never>))
      .rejects.toThrow('Canvas not ready');
  });

  it('should reject when canvas is undefined', async () => {
    setCanvas(undefined);

    await expect(captureSceneHandler({} as Record<string, never>))
      .rejects.toThrow('Canvas not ready');
  });

  it('should reject when canvas.scene is null', async () => {
    setCanvas(createMockCanvas({ scene: null }));

    await expect(captureSceneHandler({} as Record<string, never>))
      .rejects.toThrow('Canvas not ready');
  });

  it('should return renderer dimensions as width/height', async () => {
    setCanvas(createMockCanvas({
      app: {
        renderer: {
          extract: { base64: jest.fn().mockResolvedValue('data:image/webp;base64,x') },
          width: 6300,
          height: 8100
        }
      }
    }));

    const result = await captureSceneHandler({} as Record<string, never>);

    expect(result.width).toBe(6300);
    expect(result.height).toBe(8100);
  });

  it('should handle base64 string without data URL prefix', async () => {
    setCanvas(createMockCanvas({
      app: {
        renderer: {
          extract: { base64: jest.fn().mockResolvedValue('rawbase64withoutprefix') },
          width: 100,
          height: 100
        }
      }
    }));

    const result = await captureSceneHandler({} as Record<string, never>);

    expect(result.image).toBe('rawbase64withoutprefix');
  });

  it('should propagate extract errors', async () => {
    setCanvas(createMockCanvas({
      app: {
        renderer: {
          extract: { base64: jest.fn().mockRejectedValue(new Error('WebGL context lost')) },
          width: 1920,
          height: 1080
        }
      }
    }));

    await expect(captureSceneHandler({} as Record<string, never>))
      .rejects.toThrow('WebGL context lost');
  });
});
