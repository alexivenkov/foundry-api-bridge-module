import { findFoundryScene, requireFoundryActor, type ActorRef } from '@/core/shared';
import type {
  ActorInventory,
  InventoryItem,
  ItemOwner,
  OwnedItem,
  OwnedItemChanges,
  OwnedItemDraft,
  OwnedItemSources,
  SystemData
} from '@/core/items/domain';
import type { ActorInventoryGameProvider } from './FoundryWorldItemStore';
import type { FoundryItemOwner } from './foundryItemTypes';
import {
  toFoundryOwnedItemCreateData,
  toFoundryOwnedItemUpdateData,
  toInventoryItem,
  toOwnedItem
} from './itemMapper';

/**
 * Anti-corruption layer over the Item documents embedded in an actor: a world
 * actor, or the synthetic actor of an unlinked token (the core keeps its items
 * in the token's actor delta).
 */
export class FoundryActorInventory implements ActorInventory, OwnedItemSources {
  constructor(private readonly gameProvider: ActorInventoryGameProvider) {}

  findOwner(actor: ActorRef): ItemOwner | null {
    const game = this.gameProvider.getGame();
    const document =
      actor.kind === 'world'
        ? game.actors.get(actor.actorId)
        : findFoundryScene(game.scenes, actor.sceneId)?.tokens.get(actor.tokenId)?.actor;
    return document ? { id: document.id, name: document.name } : null;
  }

  listItems(actor: ActorRef): readonly InventoryItem[] {
    return this.requireActor(actor).items.contents.map(toInventoryItem);
  }

  hasItem(actor: ActorRef, itemId: string): boolean {
    return Boolean(this.requireActor(actor).items.get(itemId));
  }

  async addItem(actor: ActorRef, draft: OwnedItemDraft): Promise<OwnedItem | null> {
    const created = await this.requireActor(actor).createEmbeddedDocuments('Item', [
      toFoundryOwnedItemCreateData(draft)
    ]);
    const document = created[0];
    return document ? toOwnedItem(document) : null;
  }

  /**
   * The core hands back only the documents an update changed. When it hands
   * back none, the item stands as it was, and is read from the actor instead.
   */
  async updateItem(actor: ActorRef, itemId: string, changes: OwnedItemChanges): Promise<OwnedItem | null> {
    const owner = this.requireActor(actor);
    const updated = await owner.updateEmbeddedDocuments('Item', [toFoundryOwnedItemUpdateData(itemId, changes)]);
    const document = updated[0] ?? owner.items.get(itemId);
    return document ? toOwnedItem(document) : null;
  }

  storedSystem(actor: ActorRef, itemId: string): SystemData | null {
    return this.requireActor(actor).items.get(itemId)?._source?.system ?? null;
  }

  async removeItem(actor: ActorRef, itemId: string): Promise<void> {
    await this.requireActor(actor).deleteEmbeddedDocuments('Item', [itemId]);
  }

  private requireActor(actor: ActorRef): FoundryItemOwner {
    return requireFoundryActor(this.gameProvider.getGame(), actor);
  }
}
