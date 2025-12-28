import type { DeleteActorItemParams, DeleteResult } from '@/commands/types';

interface FoundryItem {
  id: string;
}

interface FoundryItemsCollection {
  get(id: string): FoundryItem | undefined;
}

interface FoundryActor {
  id: string;
  name: string;
  items: FoundryItemsCollection;
  deleteEmbeddedDocuments(embeddedName: string, ids: string[]): Promise<FoundryItem[]>;
}

interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
}

interface FoundryGame {
  actors: ActorsCollection;
}

declare const game: FoundryGame;

export async function deleteActorItemHandler(params: DeleteActorItemParams): Promise<DeleteResult> {
  const actor = game.actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  const item = actor.items.get(params.itemId);

  if (!item) {
    throw new Error(`Item not found: ${params.itemId}`);
  }

  await actor.deleteEmbeddedDocuments('Item', [params.itemId]);

  return {
    deleted: true
  };
}
