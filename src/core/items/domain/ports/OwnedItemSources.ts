import type { ActorRef } from '@/core/shared/domain';
import type { SystemData } from '@/core/items/domain/model/WorldItem';

/** The stored game-system data of an owned item, which tells a carrier the item keeps from a new one. */
export interface OwnedItemSources {
  storedSystem(actor: ActorRef, itemId: string): SystemData | null;
}
