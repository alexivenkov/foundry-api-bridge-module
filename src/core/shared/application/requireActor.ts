import {
  ActorNotFoundError,
  TargetTokenNotFoundError,
  TokenHasNoActorError,
  type ActorLocator,
  type ActorTarget,
  type LocatedActor,
  type SceneLocator
} from '@/core/shared/domain';
import { requireScene } from './requireScene';

/**
 * The actor a command addresses. A token target is looked up on its scene —
 * the active one when the target names none — and yields the token's own actor.
 */
export function requireActor(scenes: SceneLocator, actors: ActorLocator, target: ActorTarget): LocatedActor {
  if (target.kind === 'token') {
    const scene = requireScene(scenes, target.sceneId);
    const token = actors.findToken(scene.id, target.tokenId);
    if (token === null) {
      throw new TargetTokenNotFoundError(target.tokenId);
    }
    if (token.actor === null) {
      throw new TokenHasNoActorError(target.tokenId);
    }
    return { ...token.actor, ref: { kind: 'token', sceneId: scene.id, tokenId: token.id } };
  }

  const actor = actors.findWorldActor(target.actorId);
  if (actor === null) {
    throw new ActorNotFoundError(target.actorId);
  }
  return { ...actor, ref: { kind: 'world', actorId: target.actorId } };
}
