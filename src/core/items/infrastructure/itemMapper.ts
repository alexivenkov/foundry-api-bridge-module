import type {
  InventoryItem,
  OwnedItem,
  OwnedItemChanges,
  OwnedItemDraft,
  WorldItem,
  WorldItemChanges,
  WorldItemDetails,
  WorldItemDraft
} from '@/core/items/domain';
import { readConventionalItemTraits } from './conventionalItemTraits';
import type {
  FoundryOwnedItemDocument,
  FoundryOwnedItemHeader,
  FoundryWorldItemDocument
} from './foundryItemTypes';

export function toWorldItem(document: FoundryWorldItemDocument): WorldItem {
  return {
    id: document.id,
    uuid: document.uuid,
    name: document.name,
    type: document.type,
    img: document.img ?? null,
    folderName: document.folder?.name ?? null
  };
}

/** `system` is the item's system data without derived values; it is opaque to the core. */
export function toWorldItemDetails(document: FoundryWorldItemDocument): WorldItemDetails {
  return { ...toWorldItem(document), system: document.toObject(false).system };
}

export function toOwnedItem(document: FoundryOwnedItemHeader): OwnedItem {
  return {
    id: document.id,
    name: document.name,
    type: document.type,
    img: document.img ?? null
  };
}

export function toInventoryItem(document: FoundryOwnedItemDocument): InventoryItem {
  return { ...toOwnedItem(document), traits: readConventionalItemTraits(document) };
}

function setIfDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

/** Only the attributes that are set become document fields; the folder is given by id. */
export function toFoundryWorldItemCreateData(draft: WorldItemDraft): Record<string, unknown> {
  const data: Record<string, unknown> = { name: draft.name, type: draft.type };
  setIfDefined(data, 'folder', draft.folderId);
  setIfDefined(data, 'img', draft.img);
  setIfDefined(data, 'system', draft.system);
  setIfDefined(data, 'sort', draft.sort);
  return data;
}

export function toFoundryWorldItemUpdateData(changes: WorldItemChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  setIfDefined(data, 'name', changes.name);
  setIfDefined(data, 'img', changes.img);
  setIfDefined(data, 'folder', changes.folderId);
  setIfDefined(data, 'system', changes.system);
  setIfDefined(data, 'sort', changes.sort);
  return data;
}

export function toFoundryOwnedItemCreateData(draft: OwnedItemDraft): Record<string, unknown> {
  const data: Record<string, unknown> = { name: draft.name, type: draft.type };
  setIfDefined(data, 'img', draft.img);
  setIfDefined(data, 'system', draft.system);
  setIfDefined(data, 'sort', draft.sort);
  return data;
}

/**
 * An embedded update names its document by `_id`. System data goes out one
 * top-level key at a time, as `system.<key>` paths: the shape this update has
 * always had on the wire to the core.
 */
export function toFoundryOwnedItemUpdateData(itemId: string, changes: OwnedItemChanges): Record<string, unknown> {
  const data: Record<string, unknown> = { _id: itemId };
  setIfDefined(data, 'name', changes.name);
  setIfDefined(data, 'img', changes.img);
  setIfDefined(data, 'sort', changes.sort);
  if (changes.system !== undefined) {
    for (const [key, value] of Object.entries(changes.system)) {
      data[`system.${key}`] = value;
    }
  }
  return data;
}
