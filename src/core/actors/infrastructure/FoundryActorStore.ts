import { requireFoundryActor, type ActorRef, type GameProvider } from '@/core/shared';
import type {
  Actor,
  ActorChanges,
  ActorDetails,
  ActorDraft,
  ActorSources,
  ActorStore,
  ActorSummary,
  SystemData
} from '@/core/actors/domain';
import {
  toActor,
  toActorDetails,
  toActorSummary,
  toFoundryActorCreateData,
  toFoundryActorUpdateData
} from './actorMapper';
import type { FoundryActorGame } from './foundryActorTypes';

export type ActorGameProvider = GameProvider<FoundryActorGame>;

/** Anti-corruption layer over the world's Actor documents and the actors of scene tokens. */
export class FoundryActorStore implements ActorStore, ActorSources {
  constructor(private readonly gameProvider: ActorGameProvider) {}

  listActors(): readonly ActorSummary[] {
    const actors: ActorSummary[] = [];
    this.gameProvider.getGame().actors.forEach((document) => {
      actors.push(toActorSummary(document));
    });
    return actors;
  }

  findActorDetails(actorId: string): ActorDetails | null {
    const document = this.gameProvider.getGame().actors.get(actorId);
    return document ? toActorDetails(document) : null;
  }

  async createActor(draft: ActorDraft): Promise<Actor | null> {
    const document = await this.gameProvider.getGame().actors.documentClass.create(toFoundryActorCreateData(draft));
    return document ? toActor(document) : null;
  }

  async updateActor(actor: ActorRef, changes: ActorChanges): Promise<Actor> {
    const document = requireFoundryActor(this.gameProvider.getGame(), actor);
    await document.update(toFoundryActorUpdateData(changes));
    return toActor(document);
  }

  storedSystem(actor: ActorRef): SystemData | null {
    return requireFoundryActor(this.gameProvider.getGame(), actor)._source?.system ?? null;
  }

  async deleteActor(actorId: string): Promise<void> {
    await this.gameProvider.getGame().actors.get(actorId)?.delete();
  }
}
