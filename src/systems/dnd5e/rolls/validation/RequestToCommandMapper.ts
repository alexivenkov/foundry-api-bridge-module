import type {
  RollSkillCommand,
  RollAbilityCommand,
  RollSaveCommand,
  RollPerceptionCommand
} from '@/systems/dnd5e/rolls/application';
import type { RollSkillRequest } from './RollSkillRequestSchema';
import type { RollAbilityRequest } from './RollAbilityRequestSchema';
import type { RollSaveRequest } from './RollSaveRequestSchema';
import type { RollPerceptionRequest } from './RollPerceptionRequestSchema';

export const RequestToCommandMapper = {
  toRollSkillCommand(request: RollSkillRequest): RollSkillCommand {
    return {
      actorId: request.actorId,
      skill: request.skill,
      advantage: request.advantage ?? false,
      disadvantage: request.disadvantage ?? false,
      showInChat: request.showInChat ?? false
    };
  },
  toRollAbilityCommand(request: RollAbilityRequest): RollAbilityCommand {
    return {
      actorId: request.actorId,
      ability: request.ability,
      advantage: request.advantage ?? false,
      disadvantage: request.disadvantage ?? false,
      showInChat: request.showInChat ?? false
    };
  },
  toRollSaveCommand(request: RollSaveRequest): RollSaveCommand {
    return {
      actorId: request.actorId,
      ability: request.ability,
      advantage: request.advantage ?? false,
      disadvantage: request.disadvantage ?? false,
      showInChat: request.showInChat ?? false
    };
  },
  toRollPerceptionCommand(request: RollPerceptionRequest): RollPerceptionCommand {
    return {
      actorId: request.actorId,
      advantage: request.advantage ?? false,
      disadvantage: request.disadvantage ?? false,
      showInChat: request.showInChat ?? false
    };
  }
};
