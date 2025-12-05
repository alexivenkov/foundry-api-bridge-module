import type { CreateActorParams, ActorResult } from '@/commands/types';

interface FoundryActor {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: { name: string } | null;
}

interface ActorDocumentClass {
  create(data: Record<string, unknown>): Promise<FoundryActor>;
}

interface ActorsCollection {
  documentClass: ActorDocumentClass;
}

interface FoundryGame {
  actors: ActorsCollection;
}

declare const game: FoundryGame;

export async function createActorHandler(params: CreateActorParams): Promise<ActorResult> {
  const actorData: Record<string, unknown> = {
    name: params.name,
    type: params.type
  };

  if (params.folder !== undefined) {
    actorData['folder'] = params.folder;
  }

  if (params.img !== undefined) {
    actorData['img'] = params.img;
  }

  if (params.system !== undefined) {
    actorData['system'] = params.system;
  }

  const actor = await game.actors.documentClass.create(actorData);

  return {
    id: actor.id,
    uuid: actor.uuid,
    name: actor.name,
    type: actor.type,
    img: actor.img,
    folder: actor.folder?.name ?? null
  };
}