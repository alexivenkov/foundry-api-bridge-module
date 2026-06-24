import type { RollOutcome } from '@/systems/shared/domain';
import type { ItemRollPort } from '@/systems/dnd5e/item-rolls/domain';
import type { RollAttackCommand, RollDamageCommand } from './ItemRollCommands';

export class Dnd5eItemRollService {
  constructor(private readonly itemRoll: ItemRollPort) {}

  async rollAttack(command: RollAttackCommand): Promise<RollOutcome> {
    return this.itemRoll.rollAttack(command.actorId, command.itemId, {
      advantage: command.advantage,
      disadvantage: command.disadvantage,
      showInChat: command.showInChat
    });
  }

  async rollDamage(command: RollDamageCommand): Promise<RollOutcome> {
    return this.itemRoll.rollDamage(command.actorId, command.itemId, {
      critical: command.critical,
      showInChat: command.showInChat
    });
  }
}
