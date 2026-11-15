import { z } from 'zod';
import { imagePath } from './mediaPaths';

const combatId = z.string().nullish();
const groupId = z.string().min(1);

export const combatantGroupsRequestSchema = z.object({ combatId });

export const createCombatantGroupRequestSchema = z.object({
  combatId,
  name: z.string().optional(),
  img: imagePath.optional(),
  initiative: z.number().optional()
});

export const updateCombatantGroupRequestSchema = z.object({
  combatId,
  groupId,
  name: z.string().nullable().optional(),
  img: imagePath.nullable().optional(),
  initiative: z.number().nullable().optional()
});

export const combatantGroupAddressRequestSchema = z.object({ combatId, groupId });

export type CombatantGroupsRequest = z.infer<typeof combatantGroupsRequestSchema>;
export type CreateCombatantGroupRequest = z.infer<typeof createCombatantGroupRequestSchema>;
export type UpdateCombatantGroupRequest = z.infer<typeof updateCombatantGroupRequestSchema>;
export type CombatantGroupAddressRequest = z.infer<typeof combatantGroupAddressRequestSchema>;
