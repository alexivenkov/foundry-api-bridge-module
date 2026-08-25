import type { CreateItemParams, WorldItemResult } from '@/commands/types';

interface FoundryItem {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: { name: string } | null;
}

interface ItemDocumentClass {
  create(data: Record<string, unknown>): Promise<FoundryItem | undefined>;
}

interface ItemsCollection {
  documentClass: ItemDocumentClass;
}

interface FoundryGame {
  items: ItemsCollection;
}

declare const game: FoundryGame;

export async function createItemHandler(params: CreateItemParams): Promise<WorldItemResult> {
  const itemData: Record<string, unknown> = {
    name: params.name,
    type: params.type
  };

  if (params.folder !== undefined) {
    itemData['folder'] = params.folder;
  }

  if (params.img !== undefined) {
    itemData['img'] = params.img;
  }

  if (params.system !== undefined) {
    itemData['system'] = params.system;
  }

  const item = await game.items.documentClass.create(itemData);

  if (!item) {
    throw new Error('Item creation was cancelled by Foundry (a module hook may have vetoed it)');
  }

  return {
    id: item.id,
    uuid: item.uuid,
    name: item.name,
    type: item.type,
    img: item.img,
    folder: item.folder?.name ?? null
  };
}
