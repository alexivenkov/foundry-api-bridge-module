import { ActorNotFoundError, ValidationError } from '@/systems/shared/domain/errors';
import type { Coc7ActorTarget } from '@/systems/coc7/shared/domain';
import type { FoundryCoc7Actor, FoundryCoc7Game, FoundryCoc7Scene, FoundryCoc7Token } from './foundryCoc7Types';

export interface ResolvedCoc7Actor {
  readonly actor: FoundryCoc7Actor;
  readonly tokenId?: string;
  readonly token?: FoundryCoc7Token;
}

function resolveScene(game: FoundryCoc7Game, sceneId: string | undefined): FoundryCoc7Scene {
  if (sceneId !== undefined) {
    const scene = game.scenes.get(sceneId);
    if (!scene) {
      throw new ValidationError(`Scene not found: ${sceneId}`);
    }
    return scene;
  }
  const active = game.scenes.active;
  if (!active) {
    throw new ValidationError('No active scene');
  }
  return active;
}

/**
 * The actor a command addresses: `actorId` for a world actor, or `tokenId`
 * (+ optional `sceneId`) for one token's actor, so an unlinked token's
 * synthetic actor takes the hit alone.
 */
export function resolveCoc7Actor(game: FoundryCoc7Game, target: Coc7ActorTarget): ResolvedCoc7Actor {
  if (target.tokenId !== undefined) {
    const scene = resolveScene(game, target.sceneId);
    const token = scene.tokens.get(target.tokenId);
    if (!token) {
      throw new ValidationError(
        target.sceneId !== undefined
          ? `Token not found on scene ${target.sceneId}: ${target.tokenId}`
          : `Token not found on active scene: ${target.tokenId}`
      );
    }
    if (!token.actor) {
      throw new ValidationError(`Token has no actor: ${target.tokenId}`);
    }
    return { actor: token.actor, tokenId: token.id, token };
  }
  if (target.actorId !== undefined) {
    const actor = game.actors.get(target.actorId);
    if (!actor) {
      throw new ActorNotFoundError(target.actorId);
    }
    return { actor };
  }
  throw new ValidationError('Either actorId or tokenId is required');
}

/** A token on the active (or given) scene that carries an actor, for damage previews. */
export function resolveCoc7TargetToken(
  game: FoundryCoc7Game,
  tokenId: string,
  sceneId: string | undefined
): { tokenId: string; name: string; actor: FoundryCoc7Actor } {
  const scene = resolveScene(game, sceneId);
  const token = scene.tokens.get(tokenId);
  if (!token) {
    throw new ValidationError(`Target token not found: ${tokenId}`);
  }
  if (!token.actor) {
    throw new ValidationError(`Token has no actor: ${tokenId}`);
  }
  return { tokenId: token.id, name: token.name, actor: token.actor };
}
