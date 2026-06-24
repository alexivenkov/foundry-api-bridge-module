import { parseSkillKey, parseAbilityKey } from '@/systems/dnd5e/rolls/domain';
import type { RollSkillCommand, RollAbilityCommand, RollSaveCommand } from '@/systems/dnd5e/rolls/application';
import type { RollSkillRequest } from './RollSkillRequestSchema';
import type { RollAbilityRequest } from './RollAbilityRequestSchema';
import type { RollSaveRequest } from './RollSaveRequestSchema';

export const RequestToCommandMapper = {
  toRollSkillCommand(request: RollSkillRequest): RollSkillCommand {
    return {
      actorId: request.actorId,
      skill: parseSkillKey(request.skill),
      showInChat: request.showInChat ?? false
    };
  },
  toRollAbilityCommand(request: RollAbilityRequest): RollAbilityCommand {
    return {
      actorId: request.actorId,
      ability: parseAbilityKey(request.ability),
      showInChat: request.showInChat ?? false
    };
  },
  toRollSaveCommand(request: RollSaveRequest): RollSaveCommand {
    return {
      actorId: request.actorId,
      ability: parseAbilityKey(request.ability),
      showInChat: request.showInChat ?? false
    };
  }
};
