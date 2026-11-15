import type {
  Actor,
  ActorChanges,
  ActorDetails,
  ActorDraft,
  ActorItem,
  ActorSummary
} from '@/core/actors/domain';
import type { FoundryActorDocument } from './foundryActorTypes';

export function toActorSummary(document: FoundryActorDocument): ActorSummary {
  return {
    id: document.id,
    name: document.name,
    type: document.type,
    img: document.img ?? null
  };
}

export function toActor(document: FoundryActorDocument): Actor {
  return {
    ...toActorSummary(document),
    uuid: document.uuid,
    folderName: document.folder?.name ?? null
  };
}

/**
 * `system` is the actor's roll data — the system data as the game system
 * prepared it — and each item carries its system data without derived values.
 * Both are opaque to the core.
 */
export function toActorDetails(document: FoundryActorDocument): ActorDetails {
  const items: ActorItem[] = [];
  document.items.forEach((item) => {
    items.push({
      id: item.id,
      name: item.name,
      type: item.type,
      img: item.img ?? null,
      system: item.toObject(false).system
    });
  });

  return { ...toActorSummary(document), rollData: document.getRollData(), items };
}

function setIfDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

/** Only the attributes that are set become document fields; the folder is given by id. */
export function toFoundryActorCreateData(draft: ActorDraft): Record<string, unknown> {
  const data: Record<string, unknown> = { name: draft.name, type: draft.type };
  setIfDefined(data, 'folder', draft.folderId);
  setIfDefined(data, 'img', draft.img);
  setIfDefined(data, 'system', draft.system);
  return data;
}

export function toFoundryActorUpdateData(changes: ActorChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  setIfDefined(data, 'name', changes.name);
  setIfDefined(data, 'img', changes.img);
  setIfDefined(data, 'folder', changes.folderId);
  setIfDefined(data, 'system', changes.system);
  return data;
}
