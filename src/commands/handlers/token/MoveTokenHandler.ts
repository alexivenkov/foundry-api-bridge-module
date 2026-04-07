import type { MoveTokenParams, TokenResult } from '@/commands/types';
import {
  getActiveScene,
  getToken,
  mapTokenToResult,
  type FoundryGame,
  type FoundryToken,
  type TokenUpdateData
} from './tokenTypes';
import { findGridPath, type CollisionChecker } from './GridPathfinder';

declare const game: FoundryGame;

interface CanvasGlobals {
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

function getGlobals(): CanvasGlobals {
  return globalThis as unknown as CanvasGlobals;
}

async function moveAlongPath(
  token: FoundryToken,
  path: Array<{ x: number; y: number }>,
  animate: boolean,
  finalUpdate?: TokenUpdateData
): Promise<FoundryToken> {
  let current = token;

  for (let i = 0; i < path.length; i++) {
    const waypoint = path[i];
    if (!waypoint) continue;

    const isLast = i === path.length - 1;
    const updateData: TokenUpdateData = { x: waypoint.x, y: waypoint.y };

    if (isLast && finalUpdate) {
      if (finalUpdate.elevation !== undefined) updateData.elevation = finalUpdate.elevation;
      if (finalUpdate.rotation !== undefined) updateData.rotation = finalUpdate.rotation;
    }

    current = await current.update(updateData, { animate });
  }

  return current;
}

export async function moveTokenHandler(params: MoveTokenParams): Promise<TokenResult> {
  const scene = getActiveScene(game, params.sceneId);
  const token = getToken(scene, params.tokenId);
  const animate = params.animate !== false;

  const globals = getGlobals();
  const collisionBackend = globals.CONFIG?.Canvas?.polygonBackends?.move;
  const gridSize = globals.canvas?.scene?.grid?.size;

  if (collisionBackend && gridSize) {
    const origin = { x: token.x + gridSize / 2, y: token.y + gridSize / 2 };
    const dest = { x: params.x + gridSize / 2, y: params.y + gridSize / 2 };

    const directBlocked = collisionBackend.testCollision(origin, dest, { type: 'move', mode: 'any' });

    if (directBlocked) {
      const path = findGridPath({
        startX: token.x,
        startY: token.y,
        endX: params.x,
        endY: params.y,
        gridSize,
        collision: collisionBackend
      });

      if (!path || path.length === 0) {
        throw new Error('Path blocked — no valid route to destination');
      }

      const finalUpdate: TokenUpdateData = {};
      if (params.elevation !== undefined) finalUpdate.elevation = params.elevation;
      if (params.rotation !== undefined) finalUpdate.rotation = params.rotation;

      const result = await moveAlongPath(token, path, animate, finalUpdate);
      return mapTokenToResult(result);
    }
  }

  const updateData: TokenUpdateData = {
    x: params.x,
    y: params.y
  };

  if (params.elevation !== undefined) {
    updateData.elevation = params.elevation;
  }
  if (params.rotation !== undefined) {
    updateData.rotation = params.rotation;
  }

  const updated = await token.update(updateData, { animate });
  return mapTokenToResult(updated);
}
