import { z } from 'zod';
import { COC7_ATTRIBUTE_KEYS, COC7_CHARACTERISTIC_CHECKS } from '@/systems/coc7/shared/domain';
import {
  coc7ActorTargetShape,
  coc7CheckOptionsShape,
  hasActorOrToken,
  poolDiceExclusive,
  poolDiceRefinement,
  targetRefinement
} from '@/systems/coc7/shared/validation';

export const rollSkillRequestSchema = z
  .object({
    ...coc7ActorTargetShape,
    ...coc7CheckOptionsShape,
    skill: z.string().min(1)
  })
  .refine(hasActorOrToken, targetRefinement)
  .refine(poolDiceExclusive, poolDiceRefinement);

export const rollCharacteristicRequestSchema = z
  .object({
    ...coc7ActorTargetShape,
    ...coc7CheckOptionsShape,
    characteristic: z.enum(COC7_CHARACTERISTIC_CHECKS)
  })
  .refine(hasActorOrToken, targetRefinement)
  .refine(poolDiceExclusive, poolDiceRefinement);

export const rollAttributeRequestSchema = z
  .object({
    ...coc7ActorTargetShape,
    ...coc7CheckOptionsShape,
    attribute: z.enum(COC7_ATTRIBUTE_KEYS)
  })
  .refine(hasActorOrToken, targetRefinement)
  .refine(poolDiceExclusive, poolDiceRefinement);

export type RollSkillRequest = z.infer<typeof rollSkillRequestSchema>;
export type RollCharacteristicRequest = z.infer<typeof rollCharacteristicRequestSchema>;
export type RollAttributeRequest = z.infer<typeof rollAttributeRequestSchema>;
