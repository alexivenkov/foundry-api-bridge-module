import type { ItemTraits } from '@/core/items/domain';

export interface FoundryItemWithConventionalSystem {
  system: {
    equipped?: boolean;
    quantity?: number;
    activities?: { contents: { type: string }[] };
    description?: { value?: string };
    damage?: Record<string, unknown>;
    range?: Record<string, unknown>;
  };
}

/**
 * NOT system-neutral, and the only place the items context looks inside
 * `item.system`.
 *
 * Reads the dnd5e item layout — `system.equipped`, `system.quantity`,
 * `system.activities` (a collection whose entries carry a `type`),
 * `system.description.value`, `system.damage`, `system.range` — for the item
 * cards `get-actor-items` has always returned. A system without one of these
 * fields gets the default for it.
 *
 * Values are reported as stored, neither checked nor converted: a system that
 * keeps something else under the same name has that reported instead (pf2e's
 * `system.equipped` is an object, not a flag). System-specific inventories
 * belong in a `<system>/…` slice.
 */
export function readConventionalItemTraits(item: FoundryItemWithConventionalSystem): ItemTraits {
  const system = item.system;
  const activities = system.activities?.contents ?? [];
  return {
    equipped: system.equipped ?? false,
    quantity: system.quantity ?? 1,
    activityTypes: activities.map((activity) => activity.type),
    description: system.description?.value ?? '',
    damage: system.damage ?? null,
    range: system.range ?? null
  };
}
