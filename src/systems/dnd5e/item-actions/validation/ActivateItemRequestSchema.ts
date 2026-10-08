import { z } from 'zod';

export const BOTH_ADVANTAGE_AND_DISADVANTAGE = 'Cannot have both advantage and disadvantage';

export const activateItemRequestSchema = z
  .object({
    actorId: z.string(),
    itemId: z.string(),
    activityId: z.string().optional(),
    activityType: z.string().optional(),
    targetTokenIds: z.array(z.string()).optional(),
    templatePosition: z
      .object({
        x: z.number(),
        y: z.number(),
        direction: z.number().optional()
      })
      .optional(),
    spellLevel: z.number().optional(),
    attackerTokenId: z.string().optional(),
    attackMode: z.string().optional(),
    ammunition: z.union([z.string(), z.literal(false)]).optional(),
    consume: z
      .object({
        spellSlot: z.boolean().optional(),
        itemUses: z.boolean().optional(),
        ammunition: z.boolean().optional()
      })
      .optional(),
    fastForward: z.boolean().optional(),
    advantage: z.boolean().optional(),
    disadvantage: z.boolean().optional(),
    attackBonus: z.union([z.number(), z.string()]).optional(),
    damageBonus: z.string().optional(),
    targetAcBonus: z.number().optional()
  })
  .refine((r) => !(r.advantage === true && r.disadvantage === true), {
    message: BOTH_ADVANTAGE_AND_DISADVANTAGE
  });

export type ActivateItemRequest = z.infer<typeof activateItemRequestSchema>;
