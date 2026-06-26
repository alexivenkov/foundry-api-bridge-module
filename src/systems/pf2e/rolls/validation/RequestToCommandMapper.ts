import type {
  RollSkillCommand,
  RollSaveCommand,
  RollPerceptionCommand
} from '@/systems/pf2e/rolls/application';
import type { RollSkillRequest } from './RollSkillRequestSchema';
import type { RollSaveRequest } from './RollSaveRequestSchema';
import type { RollPerceptionRequest } from './RollPerceptionRequestSchema';

export const RequestToCommandMapper = {
  toRollSkillCommand(request: RollSkillRequest): RollSkillCommand {
    return {
      actorId: request.actorId,
      skill: request.skill,
      showInChat: request.showInChat ?? false
    };
  },
  toRollSaveCommand(request: RollSaveRequest): RollSaveCommand {
    return {
      actorId: request.actorId,
      save: request.save,
      showInChat: request.showInChat ?? false
    };
  },
  toRollPerceptionCommand(request: RollPerceptionRequest): RollPerceptionCommand {
    return {
      actorId: request.actorId,
      showInChat: request.showInChat ?? false
    };
  }
};
