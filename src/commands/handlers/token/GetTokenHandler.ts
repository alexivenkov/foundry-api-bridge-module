import type { GetTokenParams, GetTokenResult } from '@/commands/types';
import {
  getActiveScene,
  getToken,
  mapTokenToDetail,
  type FoundryGame
} from './tokenTypes';

declare const game: FoundryGame;

export function getTokenHandler(params: GetTokenParams): Promise<GetTokenResult> {
  try {
    const scene = getActiveScene(game, params.sceneId);
    const token = getToken(scene, params.tokenId);
    return Promise.resolve(mapTokenToDetail(token, scene));
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
