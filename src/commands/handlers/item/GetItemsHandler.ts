import type { ItemData } from '@/types/foundry';
import type { GetItemsParams } from '@/commands/types';

interface FoundryWorldItem {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string | undefined;
  folder: { name: string } | null;
  toObject(source: boolean): { system: Record<string, unknown> };
}

interface FoundryWorldItemsCollection {
  forEach(fn: (item: FoundryWorldItem) => void): void;
}

interface FoundryGame {
  items: FoundryWorldItemsCollection | undefined;
}

function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

function mapWorldItemToData(item: FoundryWorldItem): ItemData {
  return {
    id: item.id,
    uuid: item.uuid,
    name: item.name,
    type: item.type,
    img: item.img ?? '',
    folder: item.folder?.name ?? null,
    system: item.toObject(false).system
  };
}

export { mapWorldItemToData, type FoundryWorldItem };

export function getItemsHandler(_params: GetItemsParams): Promise<ItemData[]> {
  const game = getGame();
  const items: ItemData[] = [];

  game.items?.forEach(item => {
    items.push(mapWorldItemToData(item));
  });

  return Promise.resolve(items);
}
