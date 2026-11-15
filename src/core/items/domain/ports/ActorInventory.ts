import type { ActorRef } from '@/core/shared/domain';
import type {
  InventoryItem,
  ItemOwner,
  OwnedItem,
  OwnedItemChanges,
  OwnedItemDraft
} from '@/core/items/domain/model/OwnedItem';

// The items an actor owns: a world actor, or one token's own actor. Reads are
// synchronous: they live in memory. Every method but `findOwner` fails with
// the reference's own lookup error when the actor is gone. `addItem` resolves
// to null when the core created nothing. `updateItem` resolves to the item as
// it is after the update — changed or not — and to null when the item is gone.
export interface ActorInventory {
  findOwner(actor: ActorRef): ItemOwner | null;
  listItems(actor: ActorRef): readonly InventoryItem[];
  hasItem(actor: ActorRef, itemId: string): boolean;
  addItem(actor: ActorRef, draft: OwnedItemDraft): Promise<OwnedItem | null>;
  updateItem(actor: ActorRef, itemId: string, changes: OwnedItemChanges): Promise<OwnedItem | null>;
  removeItem(actor: ActorRef, itemId: string): Promise<void>;
}
