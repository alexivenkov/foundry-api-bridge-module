import type { CaptureSceneParams, CaptureSceneResult } from '@/commands/types';

interface FoundryExtract {
  base64(target: unknown, mimeType?: string, quality?: number): Promise<string>;
}

interface FoundryRenderer {
  extract: FoundryExtract;
  width: number;
  height: number;
}

interface FoundryApp {
  renderer: FoundryRenderer;
}

interface FoundryScene {
  id: string;
  name: string;
}

interface FoundryCanvas {
  ready: boolean;
  app: FoundryApp;
  stage: unknown;
  scene: FoundryScene | null;
}

const MIME_TYPE = 'image/webp';
const QUALITY = 0.8;
const BASE64_PREFIX = 'data:image/webp;base64,';

function getCanvas(): FoundryCanvas | undefined {
  return (globalThis as unknown as { canvas?: FoundryCanvas }).canvas;
}

export async function captureSceneHandler(_params: CaptureSceneParams): Promise<CaptureSceneResult> {
  const canvas = getCanvas();

  if (!canvas?.ready || !canvas.scene) {
    throw new Error('Canvas not ready');
  }

  const dataUrl = await canvas.app.renderer.extract.base64(canvas.stage, MIME_TYPE, QUALITY);
  const image = dataUrl.startsWith(BASE64_PREFIX)
    ? dataUrl.slice(BASE64_PREFIX.length)
    : dataUrl;

  return {
    sceneId: canvas.scene.id,
    sceneName: canvas.scene.name,
    image,
    mimeType: MIME_TYPE,
    width: canvas.app.renderer.width,
    height: canvas.app.renderer.height
  };
}
