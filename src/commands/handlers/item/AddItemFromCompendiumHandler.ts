import type { AddItemFromCompendiumParams, ItemResult } from '@/commands/types';

interface FoundryItem {
  id: string;
  name: string;
  type: string;
  img: string;
  toObject(source?: boolean): Record<string, unknown>;
}

interface FoundryActor {
  id: string;
  name: string;
  createEmbeddedDocuments(
    embeddedName: string,
    data: Record<string, unknown>[]
  ): Promise<FoundryItem[]>;
}

interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
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
  actors: ActorsCollection;
  packs: PacksCollection;
}

declare const game: FoundryGame;

export async function addItemFromCompendiumHandler(
  params: AddItemFromCompendiumParams
): Promise<ItemResult> {
  const actor = game.actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

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

  if (params.quantity !== undefined) {
    const existingSystem = itemData['system'];
    const system = (existingSystem as Record<string, unknown> | undefined) ?? {};
    system['quantity'] = params.quantity;
    itemData['system'] = system;
  }

  const createdItems = await actor.createEmbeddedDocuments('Item', [itemData]);

  const createdItem = createdItems[0];

  if (!createdItem) {
    throw new Error('Failed to create item from compendium');
  }

  return {
    id: createdItem.id,
    name: createdItem.name,
    type: createdItem.type,
    img: createdItem.img,
    actorId: actor.id,
    actorName: actor.name
  };
}
