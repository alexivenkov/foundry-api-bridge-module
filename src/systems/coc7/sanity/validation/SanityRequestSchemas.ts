import { z } from 'zod';
import { COC7_DIFFICULTIES, COC7_MAX_POOL_DICE } from '@/systems/coc7/shared/domain';
import {
  coc7ActorTargetShape,
  hasActorOrToken,
  poolDiceExclusive,
  poolDiceRefinement,
  targetRefinement
} from '@/systems/coc7/shared/validation';

const lossFormula = z.union([z.string().min(1), z.number().int().min(0)]);

export const sanityCheckRequestSchema = z
  .object({
    ...coc7ActorTargetShape,
    lossPassed: lossFormula,
    lossFailed: lossFormula,
    reason: z.string().optional(),
    difficulty: z.enum(COC7_DIFFICULTIES).optional(),
    bonusDice: z.number().int().min(0).max(COC7_MAX_POOL_DICE).optional(),
    penaltyDice: z.number().int().min(0).max(COC7_MAX_POOL_DICE).optional(),
    apply: z.boolean().optional(),
    showInChat: z.boolean().optional()
  })
  .refine(hasActorOrToken, targetRefinement)
  .refine(poolDiceExclusive, poolDiceRefinement);

export const boutOfMadnessRequestSchema = z
  .object({
    ...coc7ActorTargetShape,
    realTime: z.boolean().optional(),
    duration: z.number().int().min(1).optional()
  })
  .refine(hasActorOrToken, targetRefinement);

export type SanityCheckRequest = z.infer<typeof sanityCheckRequestSchema>;
export type BoutOfMadnessRequest = z.infer<typeof boutOfMadnessRequestSchema>;
