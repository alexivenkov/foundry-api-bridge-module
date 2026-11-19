import { toActorTarget } from '@/systems/pf1/shared/validation';
import type { ApplyDamageCommand } from '@/systems/pf1/damage/application';
import type { ApplyDamageRequest } from './DamageRequestSchema';

export const RequestToCommandMapper = {
  toApplyDamageCommand(request: ApplyDamageRequest): ApplyDamageCommand {
    return {
      target: toActorTarget(request),
      options: {
        value: request.damage ?? -(request.heal ?? 0),
        nonlethal: request.nonlethal ?? false,
        asWounds: request.asWounds ?? false,
        reduction: request.reduction,
        ratio: request.ratio
      }
    };
  }
};
