import type { CreateItemFromCompendiumParams, WorldItemResult } from '@/commands/types';

interface FoundryItem {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: { name: string } | null;
  toObject(source?: boolean): Record<string, unknown>;
}

interface ItemDocumentClass {
  create(data: Record<string, unknown>): Promise<FoundryItem>;
}

interface ItemsCollection {
  documentClass: ItemDocumentClass;
}

interface FoundryPack {
  collection: string;
  metadata: {
    type: string;
  };
  getDocument(id: string): Promise<FoundryItem | null>;
}

interface PacksCollection {
  get(id: string): FoundryPack | undefined;
}

interface FoundryGame {
  items: ItemsCollection;
  packs: PacksCollection;
}

declare const game: FoundryGame;

export async function createItemFromCompendiumHandler(
  params: CreateItemFromCompendiumParams
): Promise<WorldItemResult> {
  const pack = game.packs.get(params.packId);

  if (!pack) {
    throw new Error(`Compendium pack not found: ${params.packId}`);
  }

  if (pack.metadata.type !== 'Item') {
    throw new Error(`Compendium pack is not an Item pack: ${params.packId}`);
  }

  const compendiumItem = await pack.getDocument(params.itemId);

  if (!compendiumItem) {
    throw new Error(`Item not found in compendium: ${params.itemId}`);
  }

  const itemData = compendiumItem.toObject();

  delete itemData['_id'];

  if (params.name !== undefined) {
    itemData['name'] = params.name;
  }

  if (params.folder !== undefined) {
    itemData['folder'] = params.folder;
  }

  const item = await game.items.documentClass.create(itemData);

  return {
    id: item.id,
    uuid: item.uuid,
    name: item.name,
    type: item.type,
    img: item.img,
    folder: item.folder?.name ?? null
  };
}
