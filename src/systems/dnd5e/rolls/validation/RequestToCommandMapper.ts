import { parseSkillKey } from '@/systems/dnd5e/rolls/domain';
import type { RollSkillCommand } from '@/systems/dnd5e/rolls/application';
import type { RollSkillRequest } from './RollSkillRequestSchema';

export const RequestToCommandMapper = {
  toRollSkillCommand(request: RollSkillRequest): RollSkillCommand {
    return {
      actorId: request.actorId,
      skill: parseSkillKey(request.skill),
      showInChat: request.showInChat ?? false
    };
  }
};
