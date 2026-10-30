import { toActorTarget, toCheckOptions } from '@/systems/coc7/shared/validation';
import type { RollAttackCommand, RollDamageCommand } from '@/systems/coc7/attacks/application';
import type { RollAttackRequest, RollDamageRequest } from './AttackRequestSchemas';

export const RequestToCommandMapper = {
  toRollAttackCommand(request: RollAttackRequest): RollAttackCommand {
    return {
      target: toActorTarget(request),
      itemId: request.itemId,
      alternativeSkill: request.alternativeSkill ?? false,
      options: toCheckOptions(request)
    };
  },

  toRollDamageCommand(request: RollDamageRequest): RollDamageCommand {
    return {
      target: toActorTarget(request),
      itemId: request.itemId,
      range: request.range ?? 'normal',
      successLevel: request.successLevel ?? 'regular',
      targetTokenId: request.targetTokenId,
      showInChat: request.showInChat ?? false
    };
  }
};
