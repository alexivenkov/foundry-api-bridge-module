import type { RollOutcome } from '@/systems/shared/domain';
import type { Pf2eActorRollPort } from '@/systems/pf2e/rolls/domain';
import type { RollSkillCommand, RollSaveCommand, RollPerceptionCommand } from './RollCommands';

export class Pf2eRollService {
  constructor(private readonly actorRoll: Pf2eActorRollPort) {}

  async rollSkill(command: RollSkillCommand): Promise<RollOutcome> {
    return this.actorRoll.rollSkill(command.actorId, command.skill, {
      showInChat: command.showInChat
    });
  }

  async rollSave(command: RollSaveCommand): Promise<RollOutcome> {
    return this.actorRoll.rollSave(command.actorId, command.save, {
      showInChat: command.showInChat
    });
  }

  async rollPerception(command: RollPerceptionCommand): Promise<RollOutcome> {
    return this.actorRoll.rollPerception(command.actorId, {
      showInChat: command.showInChat
    });
  }
}
