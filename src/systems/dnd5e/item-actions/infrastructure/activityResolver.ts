import { ActivityResolutionError } from '@/systems/shared/domain/errors';
import type { FoundryActivity, FoundryItem } from './foundryItemActionTypes';

export interface ActivitySelector {
  readonly activityId: string | undefined;
  readonly activityType: string | undefined;
}

/**
 * Three-tier resolution of an activity on a Foundry dnd5e item:
 *   1. explicit activityId  -> activities.get
 *   2. explicit activityType -> activities.find
 *   3. otherwise the first activity (undefined if none -> caller falls back)
 * Shared by use-item and activate-item — the single source of truth for these
 * resolution error messages.
 */
export function resolveActivity(
  item: FoundryItem,
  selector: ActivitySelector
): FoundryActivity | undefined {
  const activities = item.system.activities;

  if (selector.activityId) {
    const activity = activities?.get(selector.activityId);
    if (!activity) {
      throw new ActivityResolutionError(`Activity not found: ${selector.activityId}`);
    }
    return activity;
  }

  if (selector.activityType) {
    const activity = activities?.find((a) => a.type === selector.activityType);
    if (!activity) {
      throw new ActivityResolutionError(
        `No activity of type '${selector.activityType}' found on item: ${item.name}`
      );
    }
    return activity;
  }

  const contents = activities?.contents ?? [];
  return contents[0];
}
