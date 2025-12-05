import type { CreateTokenParams, TokenResult } from '@/commands/types';
import {
  getActiveScene,
  mapTokenToResult,
  type FoundryGame,
  type TokenCreateData
} from './tokenTypes';

declare const game: FoundryGame;

export async function createTokenHandler(params: CreateTokenParams): Promise<TokenResult> {
  const scene = getActiveScene(game, params.sceneId);

  const tokenData: TokenCreateData = {
    actorId: params.actorId,
    x: params.x,
    y: params.y
  };

  if (params.hidden !== undefined) {
    tokenData.hidden = params.hidden;
  }
  if (params.elevation !== undefined) {
    tokenData.elevation = params.elevation;
  }
  if (params.rotation !== undefined) {
    tokenData.rotation = params.rotation;
  }
  if (params.scale !== undefined) {
    tokenData.scale = params.scale;
  }

  const [token] = await scene.createEmbeddedDocuments('Token', [tokenData]);

  if (!token) {
    throw new Error('Failed to create token');
  }

  return mapTokenToResult(token);
}