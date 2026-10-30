import type { Coc7ApplyDamageOutcome, Coc7DamagePort } from '@/systems/coc7/damage/domain';
import type { ApplyDamageCommand } from './DamageCommands';

export class Coc7DamageService {
  constructor(private readonly damage: Coc7DamagePort) {}

  async applyDamage(command: ApplyDamageCommand): Promise<Coc7ApplyDamageOutcome> {
    return this.damage.applyDamage(command.target, {
      damage: command.damage,
      heal: command.heal,
      ignoreArmor: command.ignoreArmor,
      armor: command.armor
    });
  }
}
