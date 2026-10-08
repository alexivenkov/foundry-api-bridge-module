import type { UpdateActorParams, ActorResult } from '@/commands/types';
import { resolveActorTarget, type ActorTargetGame } from '@/commands/handlers/actorTarget';

interface FoundryActor {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: { name: string } | null;
  update(data: Record<string, unknown>): Promise<unknown>;
}

type FoundryGame = ActorTargetGame<FoundryActor>;

declare const game: FoundryGame;

export async function updateActorHandler(params: UpdateActorParams): Promise<ActorResult> {
  const { actor, tokenId } = resolveActorTarget(game, params);

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

  const result: ActorResult = {
    id: actor.id,
    uuid: actor.uuid,
    name: actor.name,
    type: actor.type,
    img: actor.img,
    folder: actor.folder?.name ?? null
  };
  if (tokenId !== undefined) {
    result.tokenId = tokenId;
  }
  return result;
}
