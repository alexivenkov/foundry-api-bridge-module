import type { CreateActorFromCompendiumParams, ActorResult } from '@/commands/types';

interface FoundryActor {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: { name: string } | null;
  toObject(source?: boolean): Record<string, unknown>;
}

interface ActorDocumentClass {
  create(data: Record<string, unknown>): Promise<FoundryActor>;
}

interface ActorsCollection {
  documentClass: ActorDocumentClass;
}

interface FoundryPack {
  collection: string;
  metadata: {
    type: string;
  };
  getDocument(id: string): Promise<FoundryActor | null>;
}

interface PacksCollection {
  get(id: string): FoundryPack | undefined;
}

interface FoundryGame {
  actors: ActorsCollection;
  packs: PacksCollection;
}

declare const game: FoundryGame;

export async function createActorFromCompendiumHandler(
  params: CreateActorFromCompendiumParams
): Promise<ActorResult> {
  const pack = game.packs.get(params.packId);

  if (!pack) {
    throw new Error(`Compendium pack not found: ${params.packId}`);
  }

  if (pack.metadata.type !== 'Actor') {
    throw new Error(`Compendium pack is not an Actor pack: ${params.packId}`);
  }

  const compendiumActor = await pack.getDocument(params.actorId);

  if (!compendiumActor) {
    throw new Error(`Actor not found in compendium: ${params.actorId}`);
  }

  const actorData = compendiumActor.toObject();

  if (params.name !== undefined) {
    actorData['name'] = params.name;
  }

  if (params.folder !== undefined) {
    actorData['folder'] = params.folder;
  }

  delete actorData['_id'];

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