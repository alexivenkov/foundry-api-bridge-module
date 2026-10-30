import { z } from 'zod';
import { COC7_LUCK_ACTIONS } from '@/systems/coc7/shared/domain';
import { coc7ActorTargetShape, hasActorOrToken, targetRefinement } from '@/systems/coc7/shared/validation';

export const LUCK_AMOUNT_POSITIVE = 'amount must be at least 1 for spend and add';

export const luckRequestSchema = z
  .object({
    ...coc7ActorTargetShape,
    action: z.enum(COC7_LUCK_ACTIONS),
    amount: z.number().int().min(0)
  })
  .refine(hasActorOrToken, targetRefinement)
  .refine((request) => request.action === 'set' || request.amount >= 1, { message: LUCK_AMOUNT_POSITIVE });

export type LuckRequest = z.infer<typeof luckRequestSchema>;
