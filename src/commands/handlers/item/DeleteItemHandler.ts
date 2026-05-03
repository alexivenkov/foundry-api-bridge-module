import type { DeleteItemParams, DeleteItemResult } from '@/commands/types';

interface FoundryItem {
  id: string;
  delete(): Promise<FoundryItem>;
}

interface ItemsCollection {
  get(id: string): FoundryItem | undefined;
}

interface FoundryGame {
  items: ItemsCollection | undefined;
}

declare const game: FoundryGame;

export async function deleteItemHandler(params: DeleteItemParams): Promise<DeleteItemResult> {
  const item = game.items?.get(params.itemId);

  if (!item) {
    throw new Error(`Item not found: ${params.itemId}`);
  }

  await item.delete();

  return {
    deleted: true,
    itemId: params.itemId
  };
}
