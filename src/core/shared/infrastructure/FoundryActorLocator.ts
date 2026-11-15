import type { ActorIdentity, ActorLocator, TargetToken } from '@/core/shared/domain';
import type { FoundryActorLike, FoundryActorsGame } from './foundryActors';
import { findFoundryScene } from './foundryScenes';
import type { GameProvider } from './gameProvider';

function toActorIdentity(actor: FoundryActorLike): ActorIdentity {
  return { id: actor.id, name: actor.name };
}

/** Finds what an actor target addresses: world actors, and tokens with the actor they stand for. */
export class FoundryActorLocator implements ActorLocator {
  constructor(private readonly gameProvider: GameProvider<FoundryActorsGame>) {}

  findWorldActor(actorId: string): ActorIdentity | null {
    const actor = this.gameProvider.getGame().actors.get(actorId);
    return actor ? toActorIdentity(actor) : null;
  }

  findToken(sceneId: string, tokenId: string): TargetToken | null {
    const token = findFoundryScene(this.gameProvider.getGame().scenes, sceneId)?.tokens.get(tokenId);
    if (!token) {
      return null;
    }
    return { id: token.id, actor: token.actor ? toActorIdentity(token.actor) : null };
  }
}
