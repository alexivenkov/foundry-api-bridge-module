import type { RollOutcome } from '@/systems/shared/domain';
import type { ActorRollPort, RollOptions } from '@/systems/dnd5e/rolls/domain';
import type {
  RollSkillCommand,
  RollAbilityCommand,
  RollSaveCommand,
  RollPerceptionCommand
} from './RollCommands';

function toRollOptions(command: RollPerceptionCommand): RollOptions {
  return {
    advantage: command.advantage,
    disadvantage: command.disadvantage,
    showInChat: command.showInChat
  };
}

export class Dnd5eRollService {
  constructor(private readonly actorRoll: ActorRollPort) {}

  async rollSkill(command: RollSkillCommand): Promise<RollOutcome> {
    return this.actorRoll.rollSkill(command.actorId, command.skill, toRollOptions(command));
  }

  async rollAbility(command: RollAbilityCommand): Promise<RollOutcome> {
    return this.actorRoll.rollAbility(command.actorId, command.ability, toRollOptions(command));
  }

  async rollSave(command: RollSaveCommand): Promise<RollOutcome> {
    return this.actorRoll.rollSave(command.actorId, command.ability, toRollOptions(command));
  }

  async rollPerception(command: RollPerceptionCommand): Promise<RollOutcome> {
    return this.actorRoll.rollPerception(command.actorId, toRollOptions(command));
  }
}
