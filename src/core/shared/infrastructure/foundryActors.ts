import {
  ActorNotFoundError,
  SceneNotFoundError,
  TargetTokenNotFoundError,
  TokenHasNoActorError,
  type ActorRef
} from '@/core/shared/domain';
import { findFoundryScene, type FoundrySceneLike, type FoundryScenesGame } from './foundryScenes';

export interface FoundryActorLike {
  id: string;
  name: string;
}

export interface FoundryActorToken<TActor> {
  id: string;
  actor: TActor | null;
}

export interface FoundryActorScene<TActor> extends FoundrySceneLike {
  tokens: { get(id: string): FoundryActorToken<TActor> | undefined };
}

/** A game whose actors can be reached by an `ActorRef`: world actors, and the tokens of its scenes. */
export interface FoundryActorsGame<TActor = FoundryActorLike> extends FoundryScenesGame<FoundryActorScene<TActor>> {
  actors: { get(id: string): TActor | undefined };
}

/**
 * The document behind a reference: a world actor, or the token's own actor.
 * When it is gone since the reference was resolved, the lookup fails the way
 * resolving it would.
 */
export function requireFoundryActor<TActor>(game: FoundryActorsGame<TActor>, ref: ActorRef): TActor {
  if (ref.kind === 'world') {
    const actor = game.actors.get(ref.actorId);
    if (!actor) {
      throw new ActorNotFoundError(ref.actorId);
    }
    return actor;
  }

  const scene = findFoundryScene(game.scenes, ref.sceneId);
  if (!scene) {
    throw new SceneNotFoundError(ref.sceneId);
  }
  const token = scene.tokens.get(ref.tokenId);
  if (!token) {
    throw new TargetTokenNotFoundError(ref.tokenId);
  }
  if (!token.actor) {
    throw new TokenHasNoActorError(ref.tokenId);
  }
  return token.actor;
}
