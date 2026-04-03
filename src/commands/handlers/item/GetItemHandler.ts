import type { ItemData } from '@/types/foundry';
import type { GetItemParams } from '@/commands/types';
import { mapWorldItemToData, type FoundryWorldItem } from './GetItemsHandler';

interface FoundryWorldItemsCollection {
  get(id: string): FoundryWorldItem | undefined;
}

interface FoundryGame {
  items: FoundryWorldItemsCollection;
}

function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

export function getItemHandler(params: GetItemParams): Promise<ItemData> {
  const item = getGame().items.get(params.itemId);

  if (!item) {
    return Promise.reject(new Error(`Item not found: ${params.itemId}`));
  }

  return Promise.resolve(mapWorldItemToData(item));
}
