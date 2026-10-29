import type { SwadeTraitRollOutcome } from '@/systems/swade/shared/domain';
import type {
  SwadeAttackRollOutcome,
  SwadeDamageRollOutcome,
  SwadeRollPort
} from '@/systems/swade/rolls/domain';
import type {
  RollAttributeCommand,
  RollSkillCommand,
  RollAttackCommand,
  RollDamageCommand
} from './RollCommands';

export class SwadeRollService {
  constructor(private readonly rolls: SwadeRollPort) {}

  async rollAttribute(command: RollAttributeCommand): Promise<SwadeTraitRollOutcome> {
    return this.rolls.rollAttribute(command.target, command.attribute, {
      modifier: command.modifier,
      modifierLabel: command.modifierLabel,
      targetNumber: command.targetNumber,
      ignoreWounds: command.ignoreWounds,
      showInChat: command.showInChat
    });
  }

  async rollSkill(command: RollSkillCommand): Promise<SwadeTraitRollOutcome> {
    return this.rolls.rollSkill(command.target, command.skill, {
      modifier: command.modifier,
      modifierLabel: command.modifierLabel,
      targetNumber: command.targetNumber,
      ignoreWounds: command.ignoreWounds,
      unskilled: command.unskilled,
      showInChat: command.showInChat
    });
  }

  async rollAttack(command: RollAttackCommand): Promise<SwadeAttackRollOutcome> {
    return this.rolls.rollAttack(command.target, command.itemId, {
      targetTokenId: command.targetTokenId,
      targetNumber: command.targetNumber,
      modifier: command.modifier,
      modifierLabel: command.modifierLabel,
      showInChat: command.showInChat
    });
  }

  async rollDamage(command: RollDamageCommand): Promise<SwadeDamageRollOutcome> {
    return this.rolls.rollDamage(command.target, command.itemId, {
      raise: command.raise,
      modifier: command.modifier,
      modifierLabel: command.modifierLabel,
      ap: command.ap,
      targetTokenId: command.targetTokenId,
      showInChat: command.showInChat
    });
  }
}
