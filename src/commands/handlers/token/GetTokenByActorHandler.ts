import type { GetTokenByActorParams, GetTokenByActorResult } from '@/commands/types';
import {
  getActiveScene,
  mapTokenToDetail,
  type FoundryGame,
  type FoundryToken
} from './tokenTypes';

declare const game: FoundryGame;

function tokenActorId(token: FoundryToken): string | null {
  if (token.actorId !== undefined) return token.actorId;
  return token.actor?.id ?? null;
}

export function getTokenByActorHandler(
  params: GetTokenByActorParams
): Promise<GetTokenByActorResult> {
  try {
    const scene = getActiveScene(game, params.sceneId);
    const token = scene.tokens.contents.find(t => tokenActorId(t) === params.actorId);
    if (!token) {
      throw new Error(`No token for actor ${params.actorId} on scene ${scene.id}`);
    }
    return Promise.resolve(mapTokenToDetail(token, scene));
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
