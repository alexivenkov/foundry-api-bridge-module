import type { RollOutcome } from '@/systems/shared/domain';
import type { ActorRollPort } from '@/systems/dnd5e/rolls/domain';
import type { RollSkillCommand } from './RollCommands';

export class Dnd5eRollService {
  constructor(private readonly actorRoll: ActorRollPort) {}

  async rollSkill(command: RollSkillCommand): Promise<RollOutcome> {
    return this.actorRoll.rollSkill(command.actorId, command.skill, {
      showInChat: command.showInChat
    });
  }
}
