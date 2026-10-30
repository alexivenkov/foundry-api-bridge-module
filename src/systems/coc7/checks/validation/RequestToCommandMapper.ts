import { toActorTarget, toCheckOptions } from '@/systems/coc7/shared/validation';
import type { RollAttributeCommand, RollCharacteristicCommand, RollSkillCommand } from '@/systems/coc7/checks/application';
import type { RollAttributeRequest, RollCharacteristicRequest, RollSkillRequest } from './CheckRequestSchemas';

export const RequestToCommandMapper = {
  toRollSkillCommand(request: RollSkillRequest): RollSkillCommand {
    return { target: toActorTarget(request), skill: request.skill, options: toCheckOptions(request) };
  },

  toRollCharacteristicCommand(request: RollCharacteristicRequest): RollCharacteristicCommand {
    return { target: toActorTarget(request), characteristic: request.characteristic, options: toCheckOptions(request) };
  },

  toRollAttributeCommand(request: RollAttributeRequest): RollAttributeCommand {
    return { target: toActorTarget(request), attribute: request.attribute, options: toCheckOptions(request) };
  }
};
