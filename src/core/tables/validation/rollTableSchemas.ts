import { z } from 'zod';
import { MAX_TABLE_DRAWS, TABLE_DRAW_VISIBILITIES } from '@/core/tables/domain';

// Deliberately tolerant, as the pre-DDD handlers were: unknown keys are ignored
// and values are not range-checked — the core decides what it accepts. Where a
// handler fell back to a default with `??`, `null` still means "not given".

const tableResultSchema = z.object({
  text: z.string(),
  range: z.tuple([z.number(), z.number()]),
  weight: z.number().nullish(),
  type: z.number().nullish(),
  documentCollection: z.string().optional(),
  documentId: z.string().optional(),
  img: z.string().optional()
});

export const getRollTableRequestSchema = z.object({
  tableId: z.string()
});

// The options added later are validated strictly; the original keys keep their tolerance.
export const rollOnTableRequestSchema = z.object({
  tableId: z.string(),
  displayChat: z.boolean().nullish(),
  count: z.number().int().min(1).max(MAX_TABLE_DRAWS).optional(),
  visibility: z.enum(TABLE_DRAW_VISIBILITIES).optional(),
  recursive: z.boolean().optional(),
  formula: z.string().optional()
});

export const resetTableRequestSchema = z.object({
  tableId: z.string()
});

export const createRollTableRequestSchema = z.object({
  name: z.string(),
  formula: z.string().nullish(),
  replacement: z.boolean().nullish(),
  displayRoll: z.boolean().nullish(),
  description: z.string().optional(),
  img: z.string().optional(),
  folder: z.string().optional(),
  results: z.array(tableResultSchema).optional()
});

export const updateRollTableRequestSchema = z.object({
  tableId: z.string(),
  name: z.string().optional(),
  formula: z.string().optional(),
  replacement: z.boolean().optional(),
  displayRoll: z.boolean().optional(),
  description: z.string().optional(),
  img: z.string().optional(),
  // `folderId`, not create's `folder`: the command always ignored a `folder` key and still does.
  folderId: z.string().min(1).nullable().optional()
});

export const deleteRollTableRequestSchema = z.object({
  tableId: z.string()
});

export type GetRollTableRequest = z.infer<typeof getRollTableRequestSchema>;
export type RollOnTableRequest = z.infer<typeof rollOnTableRequestSchema>;
export type ResetTableRequest = z.infer<typeof resetTableRequestSchema>;
export type CreateRollTableRequest = z.infer<typeof createRollTableRequestSchema>;
export type CreateTableResultRequest = z.infer<typeof tableResultSchema>;
export type UpdateRollTableRequest = z.infer<typeof updateRollTableRequestSchema>;
export type DeleteRollTableRequest = z.infer<typeof deleteRollTableRequestSchema>;
