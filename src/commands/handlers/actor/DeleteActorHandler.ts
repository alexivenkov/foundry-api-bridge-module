import type { DeleteActorParams, DeleteResult } from '@/commands/types';

interface FoundryActor {
  id: string;
  delete(): Promise<FoundryActor>;
}

interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
}

interface FoundryGame {
  actors: ActorsCollection;
}

declare const game: FoundryGame;

export async function deleteActorHandler(params: DeleteActorParams): Promise<DeleteResult> {
  const actor = game.actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
  }

  await actor.delete();

  return {
    deleted: true
  };
}