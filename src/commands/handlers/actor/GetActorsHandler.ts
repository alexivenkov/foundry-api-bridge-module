import type { ActorSummary } from '@/commands/types';

interface ActorEntry {
  id: string;
  name: string;
  type: string;
  img: string | undefined;
}

interface ActorsCollection {
  forEach(fn: (actor: ActorEntry) => void): void;
}

interface FoundryGame {
  actors: ActorsCollection;
}

function getGame(): FoundryGame {
  return (globalThis as unknown as { game: FoundryGame }).game;
}

export function getActorsHandler(_params: Record<string, never>): Promise<ActorSummary[]> {
  const actors: ActorSummary[] = [];

  getGame().actors.forEach(actor => {
    actors.push({
      id: actor.id,
      name: actor.name,
      type: actor.type,
      img: actor.img ?? ''
    });
  });

  return Promise.resolve(actors);
}
