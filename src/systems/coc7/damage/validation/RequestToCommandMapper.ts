import { toActorTarget } from '@/systems/coc7/shared/validation';
import type { ApplyDamageCommand } from '@/systems/coc7/damage/application';
import type { ApplyDamageRequest } from './DamageRequestSchemas';

export const RequestToCommandMapper = {
  toApplyDamageCommand(request: ApplyDamageRequest): ApplyDamageCommand {
    return {
      target: toActorTarget(request),
      damage: request.damage,
      heal: request.heal,
      ignoreArmor: request.ignoreArmor ?? false,
      armor: request.armor
    };
  }
};
