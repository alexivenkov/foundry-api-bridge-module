import { z } from 'zod';
import { COC7_RANGE_BANDS } from '@/systems/coc7/shared/domain';
import {
  coc7ActorTargetShape,
  coc7CheckOptionsShape,
  hasActorOrToken,
  poolDiceExclusive,
  poolDiceRefinement,
  targetRefinement
} from '@/systems/coc7/shared/validation';

export const rollAttackRequestSchema = z
  .object({
    ...coc7ActorTargetShape,
    ...coc7CheckOptionsShape,
    itemId: z.string().min(1),
    alternativeSkill: z.boolean().optional()
  })
  .refine(hasActorOrToken, targetRefinement)
  .refine(poolDiceExclusive, poolDiceRefinement);

export const rollDamageRequestSchema = z
  .object({
    ...coc7ActorTargetShape,
    itemId: z.string().min(1),
    range: z.enum(COC7_RANGE_BANDS).optional(),
    successLevel: z.enum(['regular', 'hard', 'extreme']).optional(),
    targetTokenId: z.string().optional(),
    showInChat: z.boolean().optional()
  })
  .refine(hasActorOrToken, targetRefinement);

export type RollAttackRequest = z.infer<typeof rollAttackRequestSchema>;
export type RollDamageRequest = z.infer<typeof rollDamageRequestSchema>;
