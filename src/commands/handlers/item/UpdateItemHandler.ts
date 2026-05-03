import type { UpdateItemParams, WorldItemResult } from '@/commands/types';

interface FoundryItem {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: { name: string } | null;
  update(data: Record<string, unknown>): Promise<FoundryItem>;
}

interface ItemsCollection {
  get(id: string): FoundryItem | undefined;
}

interface FoundryGame {
  items: ItemsCollection | undefined;
}

declare const game: FoundryGame;

export async function updateItemHandler(params: UpdateItemParams): Promise<WorldItemResult> {
  const item = game.items?.get(params.itemId);

  if (!item) {
    throw new Error(`Item not found: ${params.itemId}`);
  }

  const updateData: Record<string, unknown> = {};

  if (params.name !== undefined) {
    updateData['name'] = params.name;
  }

  if (params.img !== undefined) {
    updateData['img'] = params.img;
  }

  if (params.folder !== undefined) {
    updateData['folder'] = params.folder;
  }

  if (params.system !== undefined) {
    updateData['system'] = params.system;
  }

  const updatedItem = await item.update(updateData);

  return {
    id: updatedItem.id,
    uuid: updatedItem.uuid,
    name: updatedItem.name,
    type: updatedItem.type,
    img: updatedItem.img,
    folder: updatedItem.folder?.name ?? null
  };
}
