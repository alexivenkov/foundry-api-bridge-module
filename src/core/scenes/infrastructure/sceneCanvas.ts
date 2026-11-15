import type {
  MapCollisionTest,
  MovementCollisions,
  SceneViewport,
  ViewportCapture
} from '@/core/scenes/domain';
import {
  addGridOverlay,
  removeGridOverlay,
  type OverlayCanvas,
  type PixiConstructors,
  type PixiStage
} from './gridOverlay';

export interface FoundryCanvasScene {
  id: string;
  name: string;
  grid: { size: number };
  dimensions: { sceneWidth: number; sceneHeight: number; sceneX: number; sceneY: number };
}

export interface FoundryCanvas {
  ready: boolean;
  app: {
    renderer: { render(stage: unknown): void };
    view: {
      toDataURL(type?: string, quality?: number): string;
      width: number;
      height: number;
    };
  };
  stage: PixiStage;
  scene: FoundryCanvasScene | null;
}

export interface FoundrySceneCanvasGlobals {
  canvas?: FoundryCanvas | undefined;
  CONFIG?: {
    Canvas?: {
      polygonBackends?: {
        move?: MapCollisionTest;
      };
    };
    /** Keyed by the value a scene stores in `weather`. */
    weatherEffects?: Record<string, { id?: string; label?: string }>;
  };
  PIXI?: PixiConstructors | undefined;
}

export type SceneCanvasGlobalsProvider = () => FoundrySceneCanvasGlobals;

const fromGlobalThis: SceneCanvasGlobalsProvider = () => globalThis as unknown as FoundrySceneCanvasGlobals;

const REQUESTED_MIME_TYPE = 'image/webp';
const QUALITY = 0.8;
const DATA_URL_PREFIX_PATTERN = /^data:([^;]+);base64,/;

/** The core's movement collision backend. It tests against the walls of the scene on the canvas. */
export class FoundryMovementCollisions implements MovementCollisions {
  constructor(private readonly globals: SceneCanvasGlobalsProvider = fromGlobalThis) {}

  collisionTest(): MapCollisionTest | undefined {
    return this.globals().CONFIG?.Canvas?.polygonBackends?.move;
  }
}

/**
 * Renders the canvas of the GM this module runs as into an image, with a
 * labelled grid drawn over the scene for the duration of the capture.
 */
export class FoundrySceneViewport implements SceneViewport {
  constructor(private readonly globals: SceneCanvasGlobalsProvider = fromGlobalThis) {}

  /** A canvas that is still drawing a scene does not show it yet. */
  viewedSceneId(): string | null {
    const canvas = this.globals().canvas;
    return canvas?.ready && canvas.scene ? canvas.scene.id : null;
  }

  capture(): ViewportCapture | null {
    const globals = this.globals();
    const canvas = globals.canvas;
    if (!canvas?.ready || !canvas.scene) {
      return null;
    }

    const scene = canvas.scene;
    const surface: OverlayCanvas = { scene, stage: canvas.stage };
    const view = canvas.app.view;
    const overlay = addGridOverlay(surface, () => globals.PIXI);

    let dataUrl: string;
    try {
      canvas.app.renderer.render(canvas.stage);
      dataUrl = view.toDataURL(REQUESTED_MIME_TYPE, QUALITY);
    } finally {
      if (overlay) {
        removeGridOverlay(surface, overlay);
      }
    }
    if (overlay) {
      canvas.app.renderer.render(canvas.stage);
    }

    // A browser that cannot encode the requested type answers with PNG.
    const prefix = DATA_URL_PREFIX_PATTERN.exec(dataUrl);
    return {
      sceneId: scene.id,
      sceneName: scene.name,
      image: {
        data: prefix ? dataUrl.slice(prefix[0].length) : dataUrl,
        mimeType: prefix?.[1] ?? REQUESTED_MIME_TYPE,
        width: view.width,
        height: view.height
      }
    };
  }
}
