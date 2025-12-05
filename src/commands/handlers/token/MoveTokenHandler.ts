import type { MoveTokenParams, TokenResult } from '@/commands/types';
import {
  getActiveScene,
  getToken,
  mapTokenToResult,
  type FoundryGame,
  type TokenUpdateData
} from './tokenTypes';

declare const game: FoundryGame;

export async function moveTokenHandler(params: MoveTokenParams): Promise<TokenResult> {
  const scene = getActiveScene(game, params.sceneId);
  const token = getToken(scene, params.tokenId);

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

  const animate = params.animate !== false;
  const updated = await token.update(updateData, { animate });

  return mapTokenToResult(updated);
}