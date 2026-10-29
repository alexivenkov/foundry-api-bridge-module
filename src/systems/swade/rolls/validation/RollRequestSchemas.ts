import { z } from 'zod';
import { SWADE_ATTRIBUTE_KEYS } from '@/systems/swade/shared/domain';
import { swadeActorTargetShape, hasActorOrToken, targetRefinement } from '@/systems/swade/shared/validation';

const traitRollShape = {
  modifier: z.number().optional(),
  modifierLabel: z.string().optional(),
  targetNumber: z.number().int().optional(),
  ignoreWounds: z.boolean().optional(),
  showInChat: z.boolean().optional()
};

export const rollAttributeRequestSchema = z
  .object({
    ...swadeActorTargetShape,
    attribute: z.enum(SWADE_ATTRIBUTE_KEYS),
    ...traitRollShape
  })
  .refine(hasActorOrToken, targetRefinement);

export const rollSkillRequestSchema = z
  .object({
    ...swadeActorTargetShape,
    skill: z.string().min(1),
    unskilled: z.boolean().optional(),
    ...traitRollShape
  })
  .refine(hasActorOrToken, targetRefinement);

export const rollAttackRequestSchema = z
  .object({
    ...swadeActorTargetShape,
    itemId: z.string().min(1),
    targetTokenId: z.string().optional(),
    targetNumber: z.number().int().optional(),
    modifier: z.number().optional(),
    modifierLabel: z.string().optional(),
    showInChat: z.boolean().optional()
  })
  .refine(hasActorOrToken, targetRefinement);

export const rollDamageRequestSchema = z
  .object({
    ...swadeActorTargetShape,
    itemId: z.string().min(1),
    raise: z.boolean().optional(),
    modifier: z.union([z.number(), z.string()]).optional(),
    modifierLabel: z.string().optional(),
    ap: z.number().int().nonnegative().optional(),
    targetTokenId: z.string().optional(),
    showInChat: z.boolean().optional()
  })
  .refine(hasActorOrToken, targetRefinement);

export type RollAttributeRequest = z.infer<typeof rollAttributeRequestSchema>;
export type RollSkillRequest = z.infer<typeof rollSkillRequestSchema>;
export type RollAttackRequest = z.infer<typeof rollAttackRequestSchema>;
export type RollDamageRequest = z.infer<typeof rollDamageRequestSchema>;
