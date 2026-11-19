import { z } from 'zod';
import { PF1_ABILITY_KEYS, PF1_SAVE_KEYS } from '@/systems/pf1/shared/domain';
import {
  hasActorOrToken,
  pf1ActorTargetShape,
  pf1CheckOptionsShape,
  targetRefinement
} from '@/systems/pf1/shared/validation';

export const rollAbilityRequestSchema = z
  .object({ ...pf1ActorTargetShape, ability: z.enum(PF1_ABILITY_KEYS), ...pf1CheckOptionsShape })
  .refine(hasActorOrToken, targetRefinement);

export const rollSkillRequestSchema = z
  .object({ ...pf1ActorTargetShape, skill: z.string().min(1), ...pf1CheckOptionsShape })
  .refine(hasActorOrToken, targetRefinement);

export const rollSaveRequestSchema = z
  .object({ ...pf1ActorTargetShape, save: z.enum(PF1_SAVE_KEYS), ...pf1CheckOptionsShape })
  .refine(hasActorOrToken, targetRefinement);

export const rollSpellbookCheckRequestSchema = z
  .object({ ...pf1ActorTargetShape, spellbook: z.string().min(1).optional(), ...pf1CheckOptionsShape })
  .refine(hasActorOrToken, targetRefinement);

export type RollAbilityRequest = z.infer<typeof rollAbilityRequestSchema>;
export type RollSkillRequest = z.infer<typeof rollSkillRequestSchema>;
export type RollSaveRequest = z.infer<typeof rollSaveRequestSchema>;
export type RollSpellbookCheckRequest = z.infer<typeof rollSpellbookCheckRequestSchema>;
