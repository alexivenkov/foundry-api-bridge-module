import { toActorTarget } from '@/systems/swade/shared/validation';
import type {
  RollAttributeCommand,
  RollSkillCommand,
  RollAttackCommand,
  RollDamageCommand
} from '@/systems/swade/rolls/application';
import type {
  RollAttributeRequest,
  RollSkillRequest,
  RollAttackRequest,
  RollDamageRequest
} from './RollRequestSchemas';

const DEFAULT_TARGET_NUMBER = 4;

export const RequestToCommandMapper = {
  toRollAttributeCommand(request: RollAttributeRequest): RollAttributeCommand {
    return {
      target: toActorTarget(request),
      attribute: request.attribute,
      modifier: request.modifier,
      modifierLabel: request.modifierLabel,
      targetNumber: request.targetNumber ?? DEFAULT_TARGET_NUMBER,
      ignoreWounds: request.ignoreWounds ?? false,
      showInChat: request.showInChat ?? false
    };
  },
  toRollSkillCommand(request: RollSkillRequest): RollSkillCommand {
    return {
      target: toActorTarget(request),
      skill: request.skill,
      modifier: request.modifier,
      modifierLabel: request.modifierLabel,
      targetNumber: request.targetNumber ?? DEFAULT_TARGET_NUMBER,
      ignoreWounds: request.ignoreWounds ?? false,
      unskilled: request.unskilled ?? false,
      showInChat: request.showInChat ?? false
    };
  },
  toRollAttackCommand(request: RollAttackRequest): RollAttackCommand {
    return {
      target: toActorTarget(request),
      itemId: request.itemId,
      targetTokenId: request.targetTokenId,
      targetNumber: request.targetNumber,
      modifier: request.modifier,
      modifierLabel: request.modifierLabel,
      showInChat: request.showInChat ?? false
    };
  },
  toRollDamageCommand(request: RollDamageRequest): RollDamageCommand {
    return {
      target: toActorTarget(request),
      itemId: request.itemId,
      raise: request.raise ?? false,
      modifier: request.modifier,
      modifierLabel: request.modifierLabel,
      ap: request.ap,
      targetTokenId: request.targetTokenId,
      showInChat: request.showInChat ?? false
    };
  }
};
