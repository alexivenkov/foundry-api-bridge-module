import type {
  WorldItem,
  WorldItemChanges,
  WorldItemDetails,
  WorldItemDraft
} from '@/core/items/domain/model/WorldItem';

// Reads are synchronous: the world's items live in memory. `createItem`
// resolves to null when the core created nothing (a hook may veto it);
// `updateItem` when the item is gone.
export interface WorldItemStore {
  listItems(): readonly WorldItemDetails[];
  findItem(itemId: string): WorldItemDetails | null;
  hasItem(itemId: string): boolean;
  createItem(draft: WorldItemDraft): Promise<WorldItem | null>;
  updateItem(itemId: string, changes: WorldItemChanges): Promise<WorldItem | null>;
  deleteItem(itemId: string): Promise<void>;
}
