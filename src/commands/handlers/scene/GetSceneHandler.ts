import type { GetSceneParams, SceneDetailResult, SceneScreenshot } from '@/commands/types';
import { getScene, mapSceneToDetail, type FoundryGame } from './sceneTypes';
import { generateAsciiMap, type AsciiMapInput } from './AsciiMapGenerator';
import { addGridOverlay, removeGridOverlay, type OverlayCanvas } from './GridOverlay';

declare const game: FoundryGame;

interface CanvasView {
  toDataURL(type?: string, quality?: number): string;
  width: number;
  height: number;
}

interface CanvasRenderer {
  render(stage: unknown): void;
}

interface FoundryCanvas {
  ready: boolean;
  app: {
    renderer: CanvasRenderer;
    view: CanvasView;
  };
  stage: unknown;
  scene: {
    id: string;
    grid: { size: number };
    dimensions: { sceneWidth: number; sceneHeight: number; sceneX: number; sceneY: number };
  } | null;
}

interface CollisionBackend {
  testCollision(
    origin: { x: number; y: number },
    destination: { x: number; y: number },
    config: { type: string; mode: string }
  ): boolean;
}

interface CanvasGlobals {
  canvas?: FoundryCanvas;
  CONFIG?: {
    Canvas?: {
      polygonBackends?: {
        move?: CollisionBackend;
      };
    };
  };
}

const MIME_TYPE = 'image/webp';
const QUALITY = 0.8;
const BASE64_PREFIX_PATTERN = /^data:[^;]+;base64,/;

function getGlobals(): CanvasGlobals {
  return globalThis as unknown as CanvasGlobals;
}

function captureScreenshot(canvas: FoundryCanvas): SceneScreenshot | undefined {
  try {
    const overlay = addGridOverlay(canvas as unknown as OverlayCanvas);

    canvas.app.renderer.render(canvas.stage);
    const view = canvas.app.view;
    const dataUrl = view.toDataURL(MIME_TYPE, QUALITY);
    const image = dataUrl.replace(BASE64_PREFIX_PATTERN, '');

    if (overlay) {
      removeGridOverlay(canvas as unknown as OverlayCanvas, overlay);
      canvas.app.renderer.render(canvas.stage);
    }

    return {
      image,
      mimeType: MIME_TYPE,
      width: view.width,
      height: view.height
    };
  } catch {
    return undefined;
  }
}

export function getSceneHandler(params: GetSceneParams): Promise<SceneDetailResult> {
  try {
    const scene = getScene(game, params.sceneId);
    const detail = mapSceneToDetail(scene);

    const globals = getGlobals();
    const collisionBackend = globals.CONFIG?.Canvas?.polygonBackends?.move;

    const gridSize = scene.grid?.size ?? 100;
    const walls = (scene.walls?.contents ?? []).map(w => ({
      c: w.c,
      door: w.door,
      ds: w.ds ?? 0,
      move: w.move
    }));

    const tokens = (scene.tokens?.contents ?? []).map(t => ({
      id: t.id,
      name: t.name ?? '',
      x: t.x,
      y: t.y,
      width: t.width ?? 1,
      height: t.height ?? 1,
      hp: t.actor?.system?.attributes?.hp
    }));

    const mapInput: AsciiMapInput = {
      gridSize,
      gridDistance: scene.grid?.distance ?? 5,
      gridUnits: scene.grid?.units ?? 'ft',
      sceneName: scene.name,
      tokens,
      walls,
      collisionBackend
    };

    detail.asciiMap = generateAsciiMap(mapInput);

    if (params.includeScreenshot) {
      const canvas = globals.canvas;
      if (canvas?.ready && canvas.scene) {
        const screenshot = captureScreenshot(canvas);
        if (screenshot) {
          detail.screenshot = screenshot;
        }
      }
    }

    return Promise.resolve(detail);
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
