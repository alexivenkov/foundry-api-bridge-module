import type { ActorRef } from '@/core/shared/domain';
import type {
  Actor,
  ActorChanges,
  ActorDetails,
  ActorDraft,
  ActorSummary
} from '@/core/actors/domain/model/Actor';

// Reads are synchronous: the world's actors live in memory. `createActor`
// resolves to null when the core created nothing (a hook may veto it).
export interface ActorStore {
  listActors(): readonly ActorSummary[];
  findActorDetails(actorId: string): ActorDetails | null;
  createActor(draft: ActorDraft): Promise<Actor | null>;
  /** Rejects with the reference's own lookup error when the actor is gone. */
  updateActor(actor: ActorRef, changes: ActorChanges): Promise<Actor>;
  deleteActor(actorId: string): Promise<void>;
}
