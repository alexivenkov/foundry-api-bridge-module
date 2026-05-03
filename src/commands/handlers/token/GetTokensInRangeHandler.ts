import type {
  GetTokensInRangeParams,
  GetTokensInRangeResult,
  TokenInRangeEntry
} from '@/commands/types';
import {
  getActiveScene,
  dispositionFromNumber,
  type FoundryGame,
  type FoundryToken
} from './tokenTypes';
import { chebyshevDistanceFromPoint } from './geometry';

declare const game: FoundryGame;

const DEFAULT_GRID_SIZE = 100;
const DEFAULT_GRID_DISTANCE = 5;
const DEFAULT_GRID_UNITS = 'ft';

function tokenActorId(token: FoundryToken): string | null {
  if (token.actorId !== undefined) return token.actorId;
  return token.actor?.id ?? null;
}

export function getTokensInRangeHandler(
  params: GetTokensInRangeParams
): Promise<GetTokensInRangeResult> {
  try {
    const scene = getActiveScene(game, params.sceneId);
    const grid = scene.grid;
    const gridSize = grid?.size ?? DEFAULT_GRID_SIZE;
    const gridDistance = grid?.distance ?? DEFAULT_GRID_DISTANCE;
    const units = grid?.units ?? DEFAULT_GRID_UNITS;

    const tokens: TokenInRangeEntry[] = [];

    for (const token of scene.tokens.contents) {
      if (params.excludeTokenId !== undefined && token.id === params.excludeTokenId) {
        continue;
      }

      const distance = chebyshevDistanceFromPoint(
        params.originX,
        params.originY,
        token,
        gridSize,
        gridDistance
      );

      if (distance <= params.range) {
        tokens.push({
          id: token.id,
          name: token.name,
          x: token.x,
          y: token.y,
          distance,
          actorId: tokenActorId(token),
          disposition: dispositionFromNumber(token.disposition)
        });
      }
    }

    tokens.sort((a, b) => a.distance - b.distance);

    return Promise.resolve({
      sceneId: scene.id,
      origin: { x: params.originX, y: params.originY },
      range: params.range,
      units,
      tokens
    });
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
