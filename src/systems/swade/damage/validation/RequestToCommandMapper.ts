import { toActorTarget } from '@/systems/swade/shared/validation';
import type { ApplyDamageCommand, SoakCommand } from '@/systems/swade/damage/application';
import type { ApplyDamageRequest, SoakRequest } from './DamageRequestSchemas';

export const RequestToCommandMapper = {
  toApplyDamageCommand(request: ApplyDamageRequest): ApplyDamageCommand {
    return {
      target: toActorTarget(request),
      damage: request.damage,
      ap: request.ap ?? 0,
      isHeavyWeapon: request.isHeavyWeapon ?? false,
      apply: request.apply ?? true
    };
  },
  toSoakCommand(request: SoakRequest): SoakCommand {
    return {
      target: toActorTarget(request),
      wounds: request.wounds,
      spendBenny: request.spendBenny ?? true,
      modifier: request.modifier,
      modifierLabel: request.modifierLabel,
      clearIncapacitated: request.clearIncapacitated ?? false,
      showInChat: request.showInChat ?? false
    };
  }
};
