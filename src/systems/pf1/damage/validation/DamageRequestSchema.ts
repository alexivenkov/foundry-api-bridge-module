import { z } from 'zod';
import { hasActorOrToken, pf1ActorTargetShape, targetRefinement } from '@/systems/pf1/shared/validation';

export const EXACTLY_ONE_OF_DAMAGE_OR_HEAL = 'Exactly one of damage or heal is required';
export const REDUCTION_ONLY_FOR_DAMAGE = 'ratio and reduction apply to damage only';

export const applyDamageRequestSchema = z
  .object({
    ...pf1ActorTargetShape,
    damage: z.number().int().positive().optional(),
    heal: z.number().int().positive().optional(),
    nonlethal: z.boolean().optional(),
    asWounds: z.boolean().optional(),
    reduction: z.number().int().nonnegative().optional(),
    ratio: z.number().positive().optional()
  })
  .refine(hasActorOrToken, targetRefinement)
  .refine((request) => (request.damage === undefined) !== (request.heal === undefined), {
    message: EXACTLY_ONE_OF_DAMAGE_OR_HEAL
  })
  // The system subtracts `reduction` from healing too, which no rule calls for.
  .refine((request) => request.heal === undefined || (request.reduction === undefined && request.ratio === undefined), {
    message: REDUCTION_ONLY_FOR_DAMAGE
  });

export type ApplyDamageRequest = z.infer<typeof applyDamageRequestSchema>;
