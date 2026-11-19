import { z } from 'zod';
import { PF1_ROLL_MODES } from '@/systems/pf1/shared/domain';
import { hasActorOrToken, pf1ActorTargetShape, targetRefinement } from '@/systems/pf1/shared/validation';

export const useItemRequestSchema = z
  .object({
    ...pf1ActorTargetShape,
    item: z.string().min(1),
    actionId: z.string().min(1).optional(),
    cost: z.number().int().optional(),
    rollMode: z.enum(PF1_ROLL_MODES).optional(),
    showInChat: z.boolean().optional(),
    powerAttack: z.boolean().optional(),
    primaryAttack: z.boolean().optional(),
    pointBlankShot: z.boolean().optional(),
    flanking: z.boolean().optional(),
    highGround: z.boolean().optional(),
    charge: z.boolean().optional(),
    clCheck: z.boolean().optional(),
    ammo: z.string().min(1).optional()
  })
  .refine(hasActorOrToken, targetRefinement);

export type UseItemRequest = z.infer<typeof useItemRequestSchema>;
