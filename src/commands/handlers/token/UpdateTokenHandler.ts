import type { UpdateTokenParams, TokenResult } from '@/commands/types';
import {
  getActiveScene,
  getToken,
  mapTokenToResult,
  type FoundryGame,
  type TokenUpdateData
} from './tokenTypes';

declare const game: FoundryGame;

export async function updateTokenHandler(params: UpdateTokenParams): Promise<TokenResult> {
  const scene = getActiveScene(game, params.sceneId);
  const token = getToken(scene, params.tokenId);

  const updateData: TokenUpdateData = {};

  if (params.hidden !== undefined) {
    updateData.hidden = params.hidden;
  }
  if (params.elevation !== undefined) {
    updateData.elevation = params.elevation;
  }
  if (params.rotation !== undefined) {
    updateData.rotation = params.rotation;
  }
  if (params.scale !== undefined) {
    updateData.scale = params.scale;
  }
  if (params.name !== undefined) {
    updateData.name = params.name;
  }
  if (params.displayName !== undefined) {
    updateData.displayName = params.displayName;
  }
  if (params.disposition !== undefined) {
    updateData.disposition = params.disposition;
  }
  if (params.lockRotation !== undefined) {
    updateData.lockRotation = params.lockRotation;
  }

  if (Object.keys(updateData).length === 0) {
    return mapTokenToResult(token);
  }

  const updated = await token.update(updateData);

  return mapTokenToResult(updated);
}