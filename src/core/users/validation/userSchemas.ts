import { z } from 'zod';
import { USER_ROLES } from '@/core/users/domain';

// The core rewrites a short `#rgb` color into a different `#rrggbb` one, so only the full form is accepted.
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const idSchema = z.string().min(1);

export const getUsersRequestSchema = z.object({
  activeOnly: z.boolean().optional()
});

export const getUserRequestSchema = z.object({
  userId: idSchema
});

export const updateUserRequestSchema = z.object({
  userId: idSchema,
  name: z.string().trim().min(1, 'must not be blank').optional(),
  color: z.string().regex(HEX_COLOR, 'must be a #rrggbb hex color').optional(),
  pronouns: z.string().trim().nullable().optional(),
  characterId: idSchema.nullable().optional(),
  role: z.enum(USER_ROLES).optional()
});

export type GetUsersRequest = z.infer<typeof getUsersRequestSchema>;
export type GetUserRequest = z.infer<typeof getUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
