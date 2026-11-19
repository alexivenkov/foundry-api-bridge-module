import type { Pf1ApplyDamageOutcome, Pf1DamagePort } from '@/systems/pf1/damage/domain';
import type { ApplyDamageCommand } from './DamageCommands';

export class Pf1DamageService {
  constructor(private readonly damage: Pf1DamagePort) {}

  async applyDamage(command: ApplyDamageCommand): Promise<Pf1ApplyDamageOutcome> {
    return this.damage.applyDamage(command.target, command.options);
  }
}
