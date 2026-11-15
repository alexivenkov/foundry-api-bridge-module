import type { ActorRef } from '@/core/shared/domain';
import type { SystemData } from '@/core/actors/domain/model/Actor';

/** The stored game-system data of an actor, which tells a carrier the actor keeps from a new one. */
export interface ActorSources {
  storedSystem(actor: ActorRef): SystemData | null;
}
