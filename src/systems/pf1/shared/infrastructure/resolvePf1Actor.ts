import { ActorNotFoundError, ValidationError } from '@/systems/shared/domain/errors';
import type { Pf1ActorTarget } from '@/systems/pf1/shared/domain';
import type { FoundryPf1Actor, FoundryPf1Game, FoundryPf1Scene } from './foundryPf1Types';

export interface ResolvedPf1Actor {
  readonly actor: FoundryPf1Actor;
  readonly tokenId?: string;
}

function resolveScene(game: FoundryPf1Game, sceneId: string | undefined): FoundryPf1Scene {
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
export function resolvePf1Actor(game: FoundryPf1Game, target: Pf1ActorTarget): ResolvedPf1Actor {
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
    return { actor: token.actor, tokenId: token.id };
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
