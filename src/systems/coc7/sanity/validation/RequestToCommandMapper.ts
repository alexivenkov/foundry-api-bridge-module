import { toActorTarget } from '@/systems/coc7/shared/validation';
import type { BoutOfMadnessCommand, SanityCheckCommand } from '@/systems/coc7/sanity/application';
import type { BoutOfMadnessRequest, SanityCheckRequest } from './SanityRequestSchemas';

export const RequestToCommandMapper = {
  toSanityCheckCommand(request: SanityCheckRequest): SanityCheckCommand {
    return {
      target: toActorTarget(request),
      lossPassed: request.lossPassed,
      lossFailed: request.lossFailed,
      reason: request.reason,
      difficulty: request.difficulty,
      bonusDice: request.bonusDice ?? 0,
      penaltyDice: request.penaltyDice ?? 0,
      apply: request.apply ?? true,
      showInChat: request.showInChat ?? false
    };
  },

  toBoutOfMadnessCommand(request: BoutOfMadnessRequest): BoutOfMadnessCommand {
    return { target: toActorTarget(request), realTime: request.realTime ?? true, duration: request.duration ?? 1 };
  }
};
