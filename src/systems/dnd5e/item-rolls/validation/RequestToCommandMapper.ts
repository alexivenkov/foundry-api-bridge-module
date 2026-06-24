import type { RollAttackCommand, RollDamageCommand } from '@/systems/dnd5e/item-rolls/application';
import type { RollAttackRequest } from './RollAttackRequestSchema';
import type { RollDamageRequest } from './RollDamageRequestSchema';

export const RequestToCommandMapper = {
  toRollAttackCommand(request: RollAttackRequest): RollAttackCommand {
    return {
      actorId: request.actorId,
      itemId: request.itemId,
      advantage: request.advantage ?? false,
      disadvantage: request.disadvantage ?? false,
      showInChat: request.showInChat ?? false
    };
  },
  toRollDamageCommand(request: RollDamageRequest): RollDamageCommand {
    return {
      actorId: request.actorId,
      itemId: request.itemId,
      critical: request.critical ?? false,
      showInChat: request.showInChat ?? false
    };
  }
};
