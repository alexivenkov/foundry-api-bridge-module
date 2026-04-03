import type { GetActorParams, ActorDetailResult, ItemSummary } from '@/commands/types';

interface ActorItem {
  id: string;
  name: string;
  type: string;
  img: string | undefined;
}

interface ActorItemsCollection {
  forEach(fn: (item: ActorItem) => void): void;
}

interface FoundryActor {
  id: string;
  name: string;
  type: string;
  img: string | undefined;
  getRollData(): Record<string, unknown>;
  items: ActorItemsCollection;
}

interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
}

interface FoundryGame {
  actors: ActorsCollection;
}

function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

export function getActorHandler(params: GetActorParams): Promise<ActorDetailResult> {
  const actor = getGame().actors.get(params.actorId);

  if (!actor) {
    return Promise.reject(new Error(`Actor not found: ${params.actorId}`));
  }

  const items: ItemSummary[] = [];
  actor.items.forEach(item => {
    items.push({
      id: item.id,
      name: item.name,
      type: item.type,
      img: item.img ?? ''
    });
  });

  return Promise.resolve({
    id: actor.id,
    name: actor.name,
    type: actor.type,
    img: actor.img ?? '',
    system: actor.getRollData(),
    items
  });
}
