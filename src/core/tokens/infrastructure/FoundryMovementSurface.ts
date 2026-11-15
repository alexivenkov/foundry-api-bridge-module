import type { CollisionChecker, MovementSurface, MovementSurfaceProbe } from '@/core/tokens/domain';

export interface FoundryCanvasGlobals {
  canvas?: {
    scene?: {
      grid?: { size?: number | undefined };
    };
  };
  CONFIG?: {
    Canvas?: {
      polygonBackends?: {
        move?: CollisionChecker;
      };
    };
  };
}

export type CanvasGlobalsProvider = () => FoundryCanvasGlobals;

const fromGlobalThis: CanvasGlobalsProvider = () => globalThis as unknown as FoundryCanvasGlobals;

/**
 * The core's movement collision backend, with the grid of the scene on the
 * canvas. Collision tests always run against the viewed scene, so the probe is
 * only meaningful for tokens of that scene.
 */
export class FoundryMovementSurface implements MovementSurface {
  constructor(private readonly globals: CanvasGlobalsProvider = fromGlobalThis) {}

  probe(): MovementSurfaceProbe | null {
    const globals = this.globals();
    const collision = globals.CONFIG?.Canvas?.polygonBackends?.move;
    const gridSize = globals.canvas?.scene?.grid?.size;
    return collision && gridSize ? { gridSize, collision } : null;
  }
}
