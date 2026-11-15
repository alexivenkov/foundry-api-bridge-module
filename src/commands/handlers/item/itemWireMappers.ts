import type { ActorItemsResult as WireActorItemsResult, ItemDetailSummary, ItemResult, WorldItemResult } from '@/commands/types';
import { storedImage } from '@/commands/handlers/legacyWire';
import {
  hasActivities,
  type ActorItemsResult,
  type InventoryItem,
  type ItemGameProvider,
  type OwnedItemResult,
  type ScriptCarrierPolicy,
  type WorldItem,
  type WorldItemDetails
} from '@/core/items';
import type { ItemData } from '@/types/foundry';

export interface ItemHandlerDependencies {
  gameProvider?: ItemGameProvider;
  scripts?: ScriptCarrierPolicy;
}

export function toWireItemData(item: WorldItemDetails): ItemData {
  return {
    id: item.id,
    uuid: item.uuid,
    name: item.name,
    type: item.type,
    img: item.img ?? '',
    folder: item.folderName,
    system: item.system
  };
}

export function toWireWorldItemResult(item: WorldItem): WorldItemResult {
  return {
    id: item.id,
    uuid: item.uuid,
    name: item.name,
    type: item.type,
    img: storedImage(item.img),
    folder: item.folderName
  };
}

function toWireItemDetail(item: InventoryItem): ItemDetailSummary {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    img: storedImage(item.img),
    equipped: item.traits.equipped,
    quantity: item.traits.quantity,
    hasActivities: hasActivities(item),
    activityTypes: [...item.traits.activityTypes],
    description: item.traits.description,
    damage: item.traits.damage,
    range: item.traits.range
  };
}

export function toWireActorItems(result: ActorItemsResult): WireActorItemsResult {
  return {
    actorId: result.owner.id,
    actorName: result.owner.name,
    items: result.items.map(toWireItemDetail)
  };
}

export function toWireItemResult(result: OwnedItemResult): ItemResult {
  return {
    id: result.item.id,
    name: result.item.name,
    type: result.item.type,
    img: storedImage(result.item.img),
    actorId: result.owner.id,
    actorName: result.owner.name
  };
}
