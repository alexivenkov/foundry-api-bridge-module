import { z } from 'zod';
import { swadeActorTargetShape, hasActorOrToken, targetRefinement } from '@/systems/swade/shared/validation';

export const applyDamageRequestSchema = z
  .object({
    ...swadeActorTargetShape,
    damage: z.number().nonnegative(),
    ap: z.number().int().nonnegative().optional(),
    isHeavyWeapon: z.boolean().optional(),
    apply: z.boolean().optional()
  })
  .refine(hasActorOrToken, targetRefinement);

export const soakRequestSchema = z
  .object({
    ...swadeActorTargetShape,
    wounds: z.number().int().min(1),
    spendBenny: z.boolean().optional(),
    modifier: z.number().optional(),
    modifierLabel: z.string().optional(),
    clearIncapacitated: z.boolean().optional(),
    showInChat: z.boolean().optional()
  })
  .refine(hasActorOrToken, targetRefinement);

export type ApplyDamageRequest = z.infer<typeof applyDamageRequestSchema>;
export type SoakRequest = z.infer<typeof soakRequestSchema>;
