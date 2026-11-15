import type {
  ActorDetailResult,
  ActorResult,
  ActorSummary as WireActorSummary
} from '@/commands/types';
import { storedImage } from '@/commands/handlers/legacyWire';
import type {
  Actor,
  ActorDetails,
  ActorGameProvider,
  ActorSummary,
  ActorUpdateResult,
  ScriptCarrierPolicy
} from '@/core/actors';

export interface ActorHandlerDependencies {
  gameProvider?: ActorGameProvider;
  scripts?: ScriptCarrierPolicy;
}

export function toWireActorSummary(actor: ActorSummary): WireActorSummary {
  return {
    id: actor.id,
    name: actor.name,
    type: actor.type,
    img: actor.img ?? ''
  };
}

export function toWireActorDetail(actor: ActorDetails): ActorDetailResult {
  return {
    id: actor.id,
    name: actor.name,
    type: actor.type,
    img: actor.img ?? '',
    system: actor.rollData,
    items: actor.items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      img: item.img ?? '',
      system: item.system
    }))
  };
}

export function toWireActorResult(actor: Actor): ActorResult {
  return {
    id: actor.id,
    uuid: actor.uuid,
    name: actor.name,
    type: actor.type,
    img: storedImage(actor.img),
    folder: actor.folderName
  };
}

export function toWireActorUpdateResult(update: ActorUpdateResult): ActorResult {
  const result = toWireActorResult(update.actor);
  if (update.tokenId !== undefined) {
    result.tokenId = update.tokenId;
  }
  return result;
}
