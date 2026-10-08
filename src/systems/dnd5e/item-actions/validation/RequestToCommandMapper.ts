import type { UseItemCommand, ActivateItemCommand } from '@/systems/dnd5e/item-actions/application';
import type { UseItemRequest } from './UseItemRequestSchema';
import type { ActivateItemRequest } from './ActivateItemRequestSchema';

function mapTemplatePosition(
  p: ActivateItemRequest['templatePosition']
): { x: number; y: number; direction?: number } | undefined {
  if (!p) {
    return undefined;
  }
  return p.direction === undefined ? { x: p.x, y: p.y } : { x: p.x, y: p.y, direction: p.direction };
}

function mapConsume(
  c: ActivateItemRequest['consume']
): { spellSlot?: boolean; itemUses?: boolean; ammunition?: boolean } | undefined {
  if (!c) {
    return undefined;
  }
  const consume: { spellSlot?: boolean; itemUses?: boolean; ammunition?: boolean } = {};
  if (c.spellSlot !== undefined) consume.spellSlot = c.spellSlot;
  if (c.itemUses !== undefined) consume.itemUses = c.itemUses;
  if (c.ammunition !== undefined) consume.ammunition = c.ammunition;
  return consume;
}

export const RequestToCommandMapper = {
  toUseItemCommand(request: UseItemRequest): UseItemCommand {
    return {
      actorId: request.actorId,
      itemId: request.itemId,
      activityId: request.activityId,
      activityType: request.activityType,
      // Foundry consumes resources unless the caller explicitly opts out.
      consume: request.consume !== false,
      scaling: request.scaling ?? false,
      showInChat: request.showInChat ?? false
    };
  },
  toActivateItemCommand(request: ActivateItemRequest): ActivateItemCommand {
    return {
      actorId: request.actorId,
      itemId: request.itemId,
      activityId: request.activityId,
      activityType: request.activityType,
      targetTokenIds: request.targetTokenIds ?? [],
      templatePosition: mapTemplatePosition(request.templatePosition),
      spellLevel: request.spellLevel,
      attackerTokenId: request.attackerTokenId,
      attackMode: request.attackMode,
      ammunition: request.ammunition,
      consume: mapConsume(request.consume),
      // Dialogs are skipped unless the caller asks to see them.
      fastForward: request.fastForward !== false,
      advantage: request.advantage ?? false,
      disadvantage: request.disadvantage ?? false,
      attackBonus: request.attackBonus,
      damageBonus: request.damageBonus,
      targetAcBonus: request.targetAcBonus
    };
  }
};
