import type { Coc7AttackPort, Coc7AttackRollOutcome, Coc7DamageRollOutcome } from '@/systems/coc7/attacks/domain';
import type { RollAttackCommand, RollDamageCommand } from './AttackCommands';

export class Coc7AttackService {
  constructor(private readonly attacks: Coc7AttackPort) {}

  async rollAttack(command: RollAttackCommand): Promise<Coc7AttackRollOutcome> {
    return this.attacks.rollAttack(command.target, {
      itemId: command.itemId,
      alternativeSkill: command.alternativeSkill,
      options: command.options
    });
  }

  async rollDamage(command: RollDamageCommand): Promise<Coc7DamageRollOutcome> {
    return this.attacks.rollDamage(command.target, {
      itemId: command.itemId,
      range: command.range,
      successLevel: command.successLevel,
      targetTokenId: command.targetTokenId,
      showInChat: command.showInChat
    });
  }
}
