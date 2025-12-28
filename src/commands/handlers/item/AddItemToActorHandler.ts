import type { AddItemToActorParams, ItemResult } from '@/commands/types';

interface FoundryItem {
  id: string;
  name: string;
  type: string;
  img: string;
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

interface FoundryGame {
  actors: ActorsCollection;
}

declare const game: FoundryGame;

export async function addItemToActorHandler(params: AddItemToActorParams): Promise<ItemResult> {
  const actor = game.actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  const itemData: Record<string, unknown> = {
    name: params.name,
    type: params.type
  };

  if (params.img !== undefined) {
    itemData['img'] = params.img;
  }

  if (params.system !== undefined) {
    itemData['system'] = params.system;
  }

  const createdItems = await actor.createEmbeddedDocuments('Item', [itemData]);

  const createdItem = createdItems[0];

  if (!createdItem) {
    throw new Error('Failed to create item');
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
