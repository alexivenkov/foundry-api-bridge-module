import { ActorNotFoundError, ValidationError } from '@/systems/shared/domain/errors';
import type { SwadeActorTarget } from '@/systems/swade/shared/domain';
import type { FoundrySwadeActor, FoundrySwadeGame, FoundrySwadeScene } from './foundrySwadeTypes';

export interface ResolvedSwadeActor {
  readonly actor: FoundrySwadeActor;
  readonly tokenId?: string;
}

function resolveScene(game: FoundrySwadeGame, sceneId: string | undefined): FoundrySwadeScene {
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
export function resolveSwadeActor(game: FoundrySwadeGame, target: SwadeActorTarget): ResolvedSwadeActor {
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

/** A token on the active (or given) scene that carries an actor, for attack targets and damage previews. */
export function resolveSwadeTargetToken(
  game: FoundrySwadeGame,
  tokenId: string,
  sceneId: string | undefined
): { tokenId: string; name: string; actor: FoundrySwadeActor } {
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
