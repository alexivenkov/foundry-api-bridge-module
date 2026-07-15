import type { ActorRef, EmbeddedItemRecord } from '@/compendiums/domain/model';

export interface ActorInventory {
  findActor(actorId: string): ActorRef | null;

  /**
   * Create an embedded Item on a world actor from raw item data.
   * Returns null when the underlying create resolved to nothing.
   */
  createEmbeddedItem(
    actorId: string,
    itemData: Record<string, unknown>
  ): Promise<EmbeddedItemRecord | null>;
}
