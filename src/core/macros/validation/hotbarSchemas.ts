import { z } from 'zod';
import { HOTBAR_PAGE_COUNT, HOTBAR_SLOT_COUNT } from '@/core/macros/domain';

// No legacy clients: values are checked strictly. Unknown keys are ignored; a
// null or empty `userId` means the user the module runs as.

const slot = z.number().int().min(1).max(HOTBAR_SLOT_COUNT);
const userId = z.string().nullish();

export const getHotbarRequestSchema = z.object({
  userId,
  page: z.number().int().min(1).max(HOTBAR_PAGE_COUNT).optional()
});

export const assignHotbarSlotRequestSchema = z.object({
  userId,
  macroId: z.string().min(1),
  slot: slot.optional()
});

export const moveHotbarSlotRequestSchema = z
  .object({
    userId,
    fromSlot: slot,
    toSlot: slot
  })
  .refine((request) => request.fromSlot !== request.toSlot, {
    message: 'must differ from fromSlot',
    path: ['toSlot']
  });

export const clearHotbarSlotRequestSchema = z.object({
  userId,
  slot
});

export type GetHotbarRequest = z.infer<typeof getHotbarRequestSchema>;
export type AssignHotbarSlotRequest = z.infer<typeof assignHotbarSlotRequestSchema>;
export type MoveHotbarSlotRequest = z.infer<typeof moveHotbarSlotRequestSchema>;
export type ClearHotbarSlotRequest = z.infer<typeof clearHotbarSlotRequestSchema>;
