import type { SwadeApplyDamageOutcome, SwadeDamagePort, SwadeSoakOutcome } from '@/systems/swade/damage/domain';
import type { ApplyDamageCommand, SoakCommand } from './DamageCommands';

export class SwadeDamageService {
  constructor(private readonly damage: SwadeDamagePort) {}

  async applyDamage(command: ApplyDamageCommand): Promise<SwadeApplyDamageOutcome> {
    return this.damage.applyDamage(command.target, {
      damage: command.damage,
      ap: command.ap,
      isHeavyWeapon: command.isHeavyWeapon,
      apply: command.apply
    });
  }

  async soak(command: SoakCommand): Promise<SwadeSoakOutcome> {
    return this.damage.soak(command.target, {
      wounds: command.wounds,
      spendBenny: command.spendBenny,
      modifier: command.modifier,
      modifierLabel: command.modifierLabel,
      clearIncapacitated: command.clearIncapacitated,
      showInChat: command.showInChat
    });
  }
}
