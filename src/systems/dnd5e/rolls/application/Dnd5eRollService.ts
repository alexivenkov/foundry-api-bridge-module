import type { RollOutcome } from '@/systems/shared/domain';
import type { ActorRollPort } from '@/systems/dnd5e/rolls/domain';
import type {
  RollSkillCommand,
  RollAbilityCommand,
  RollSaveCommand,
  RollPerceptionCommand
} from './RollCommands';

export class Dnd5eRollService {
  constructor(private readonly actorRoll: ActorRollPort) {}

  async rollSkill(command: RollSkillCommand): Promise<RollOutcome> {
    return this.actorRoll.rollSkill(command.actorId, command.skill, {
      showInChat: command.showInChat
    });
  }

  async rollAbility(command: RollAbilityCommand): Promise<RollOutcome> {
    return this.actorRoll.rollAbility(command.actorId, command.ability, {
      showInChat: command.showInChat
    });
  }

  async rollSave(command: RollSaveCommand): Promise<RollOutcome> {
    return this.actorRoll.rollSave(command.actorId, command.ability, {
      showInChat: command.showInChat
    });
  }

  async rollPerception(command: RollPerceptionCommand): Promise<RollOutcome> {
    return this.actorRoll.rollPerception(command.actorId, {
      showInChat: command.showInChat
    });
  }
}
