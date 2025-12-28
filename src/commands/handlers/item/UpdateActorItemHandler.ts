import type { UpdateActorItemParams, ItemResult } from '@/commands/types';

interface FoundryItem {
  id: string;
  name: string;
  type: string;
  img: string;
}

interface FoundryItemsCollection {
  get(id: string): FoundryItem | undefined;
}

interface FoundryActor {
  id: string;
  name: string;
  items: FoundryItemsCollection;
  updateEmbeddedDocuments(
    embeddedName: string,
    updates: Record<string, unknown>[]
  ): Promise<FoundryItem[]>;
}

interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
}

interface FoundryGame {
  actors: ActorsCollection;
}

declare const game: FoundryGame;

export async function updateActorItemHandler(params: UpdateActorItemParams): Promise<ItemResult> {
  const actor = game.actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  const item = actor.items.get(params.itemId);

  if (!item) {
    throw new Error(`Item not found: ${params.itemId}`);
  }

  const updateData: Record<string, unknown> = {
    _id: params.itemId
  };

  if (params.name !== undefined) {
    updateData['name'] = params.name;
  }

  if (params.img !== undefined) {
    updateData['img'] = params.img;
  }

  if (params.system !== undefined) {
    for (const [key, value] of Object.entries(params.system)) {
      updateData[`system.${key}`] = value;
    }
  }

  const updatedItems = await actor.updateEmbeddedDocuments('Item', [updateData]);

  const updatedItem = updatedItems[0];

  if (!updatedItem) {
    throw new Error('Failed to update item');
  }

  return {
    id: updatedItem.id,
    name: updatedItem.name,
    type: updatedItem.type,
    img: updatedItem.img,
    actorId: actor.id,
    actorName: actor.name
  };
}
