import type { CaptureSceneParams, CaptureSceneResult } from '@/commands/types';
import { addGridOverlay, removeGridOverlay, type OverlayCanvas } from './GridOverlay';

interface FoundryView {
  toDataURL(type?: string, quality?: number): string;
  width: number;
  height: number;
}

interface FoundryRenderer {
  render(stage: unknown): void;
}

interface FoundryCanvas {
  ready: boolean;
  app: {
    renderer: FoundryRenderer;
    view: FoundryView;
  };
  stage: unknown;
  scene: {
    id: string;
    name: string;
    grid: { size: number };
    dimensions: { sceneWidth: number; sceneHeight: number; sceneX: number; sceneY: number };
  } | null;
}

const MIME_TYPE = 'image/webp';
const QUALITY = 0.8;
const BASE64_PREFIX_PATTERN = /^data:[^;]+;base64,/;

function getCanvas(): FoundryCanvas | undefined {
  return (globalThis as unknown as { canvas?: FoundryCanvas }).canvas;
}

export function captureSceneHandler(_params: CaptureSceneParams): Promise<CaptureSceneResult> {
  const canvas = getCanvas();

  if (!canvas?.ready || !canvas.scene) {
    return Promise.reject(new Error('Canvas not ready'));
  }

  const overlay = addGridOverlay(canvas as unknown as OverlayCanvas);

  canvas.app.renderer.render(canvas.stage);
  const view = canvas.app.view;
  const dataUrl = view.toDataURL(MIME_TYPE, QUALITY);
  const image = dataUrl.replace(BASE64_PREFIX_PATTERN, '');

  if (overlay) {
    removeGridOverlay(canvas as unknown as OverlayCanvas, overlay);
    canvas.app.renderer.render(canvas.stage);
  }

  return Promise.resolve({
    sceneId: canvas.scene.id,
    sceneName: canvas.scene.name,
    image,
    mimeType: MIME_TYPE,
    width: view.width,
    height: view.height
  });
}
