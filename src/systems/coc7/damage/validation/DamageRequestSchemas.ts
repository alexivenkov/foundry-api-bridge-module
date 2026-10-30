import { z } from 'zod';
import { coc7ActorTargetShape, hasActorOrToken, targetRefinement } from '@/systems/coc7/shared/validation';

export const DAMAGE_OR_HEAL_REQUIRED = 'Either damage or heal is required';
export const DAMAGE_AND_HEAL_EXCLUSIVE = 'damage and heal are exclusive';

export const applyDamageRequestSchema = z
  .object({
    ...coc7ActorTargetShape,
    damage: z.number().int().min(1).optional(),
    heal: z.number().int().min(1).optional(),
    ignoreArmor: z.boolean().optional(),
    armor: z.union([z.string().min(1), z.number().int().min(0)]).optional()
  })
  .refine(hasActorOrToken, targetRefinement)
  .refine((request) => request.damage !== undefined || request.heal !== undefined, { message: DAMAGE_OR_HEAL_REQUIRED })
  .refine((request) => request.damage === undefined || request.heal === undefined, { message: DAMAGE_AND_HEAL_EXCLUSIVE });

export type ApplyDamageRequest = z.infer<typeof applyDamageRequestSchema>;
