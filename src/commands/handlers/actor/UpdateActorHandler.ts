import type { UpdateActorParams, ActorResult } from '@/commands/types';

interface FoundryActor {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: { name: string } | null;
  update(data: Record<string, unknown>): Promise<unknown>;
}

interface ActorsCollection {
  get(id: string): FoundryActor | undefined;
}

interface FoundryGame {
  actors: ActorsCollection;
}

declare const game: FoundryGame;

export async function updateActorHandler(params: UpdateActorParams): Promise<ActorResult> {
  const actor = game.actors.get(params.actorId);

  if (!actor) {
    throw new Error(`Actor not found: ${params.actorId}`);
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

  await actor.update(updateData);

  return {
    id: actor.id,
    uuid: actor.uuid,
    name: actor.name,
    type: actor.type,
    img: actor.img,
    folder: actor.folder?.name ?? null
  };
}