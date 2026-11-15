import { toActorTarget } from '@/systems/pf1/shared/validation';
import type { UseItemCommand } from '@/systems/pf1/item-use/application';
import type { Pf1UseToggles } from '@/systems/pf1/item-use/domain';
import type { UseItemRequest } from './ItemUseRequestSchema';

const TOGGLE_KEYS = [
  'powerAttack',
  'primaryAttack',
  'pointBlankShot',
  'flanking',
  'highGround',
  'charge',
  'clCheck',
  'ammo'
] as const satisfies readonly (keyof Pf1UseToggles)[];

export const RequestToCommandMapper = {
  toUseItemCommand(request: UseItemRequest): UseItemCommand {
    // Only the toggles the caller set: the system falls back to the item's own defaults for the rest.
    const toggles: Record<string, unknown> = {};
    for (const key of TOGGLE_KEYS) {
      if (request[key] !== undefined) {
        toggles[key] = request[key];
      }
    }
    return {
      target: toActorTarget(request),
      item: request.item,
      options: {
        actionId: request.actionId,
        cost: request.cost,
        rollMode: request.rollMode,
        showInChat: request.showInChat ?? false,
        toggles: toggles as Pf1UseToggles
      }
    };
  }
};
