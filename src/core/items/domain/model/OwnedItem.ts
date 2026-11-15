import type { SystemData } from '@/core/items/domain/model/WorldItem';

/** An item an actor owns. */
export interface OwnedItem {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  /** null when the item has no image. */
  readonly img: string | null;
}

export interface ItemOwner {
  readonly id: string;
  readonly name: string;
}

/**
 * What an item's game system says about carrying and using it, when it keeps
 * that where the core expects. One adapter knows the layout and reads it; a
 * system that keeps none of this yields the defaults.
 */
export interface ItemTraits {
  readonly equipped: boolean;
  readonly quantity: number;
  /** The type of every activity the item offers. */
  readonly activityTypes: readonly string[];
  readonly description: string;
  readonly damage: SystemData | null;
  readonly range: SystemData | null;
}

export interface InventoryItem extends OwnedItem {
  readonly traits: ItemTraits;
}

export interface InventoryFilter {
  readonly type: string | undefined;
  readonly equipped: boolean | undefined;
  readonly hasActivities: boolean | undefined;
}

export function hasActivities(item: InventoryItem): boolean {
  return item.traits.activityTypes.length > 0;
}

export function matchesInventoryFilter(item: InventoryItem, filter: InventoryFilter): boolean {
  if (filter.type !== undefined && item.type !== filter.type) {
    return false;
  }
  if (filter.equipped !== undefined && item.traits.equipped !== filter.equipped) {
    return false;
  }
  return filter.hasActivities === undefined || hasActivities(item) === filter.hasActivities;
}

export interface OwnedItemDraft {
  readonly name: string;
  readonly type: string;
  readonly img?: string | null | undefined;
  readonly system?: SystemData | undefined;
  readonly sort?: number | undefined;
}

/** Omitted attributes stay untouched; `system` is merged into the item's system data. */
export interface OwnedItemChanges {
  readonly name?: string | undefined;
  readonly img?: string | null | undefined;
  readonly system?: SystemData | undefined;
  readonly sort?: number | undefined;
}
