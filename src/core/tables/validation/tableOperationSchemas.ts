import { z } from 'zod';

// The commands added after the original table commands validate strictly: a
// wrong type or a number the core would round or replace is rejected. Unknown
// keys are ignored.

const id = z.string().min(1);
const rangeSchema = z
  .tuple([z.number().int(), z.number().int()])
  .refine(([low, high]) => low <= high, 'range must be [low, high] with low <= high');
const weightSchema = z.number().int().min(1);
const typeCodeSchema = z.union([z.literal(0), z.literal(1), z.literal(2)]);

export const previewTableRollRequestSchema = z.object({
  tableId: id,
  formula: z.string().optional(),
  recursive: z.boolean().optional()
});

export const normalizeRollTableRequestSchema = z.object({
  tableId: id
});

export const createRollTableFromFolderRequestSchema = z.object({
  folderId: id
});

export const createTableResultRequestSchema = z.object({
  tableId: id,
  text: z.string(),
  range: rangeSchema,
  weight: weightSchema.optional(),
  type: typeCodeSchema.optional(),
  documentCollection: id.optional(),
  documentId: id.optional(),
  img: id.optional()
});

export const updateTableResultRequestSchema = z
  .object({
    tableId: id,
    resultId: id,
    text: z.string().optional(),
    range: rangeSchema.optional(),
    weight: weightSchema.optional(),
    type: typeCodeSchema.optional(),
    documentCollection: id.nullable().optional(),
    documentId: id.nullable().optional(),
    img: id.nullable().optional(),
    drawn: z.boolean().optional()
  })
  .refine(
    (request) =>
      (request.documentCollection === undefined && request.documentId === undefined) ||
      (request.documentCollection === null && request.documentId === null) ||
      (typeof request.documentCollection === 'string' && typeof request.documentId === 'string'),
    { message: 'documentCollection and documentId must be set together, or both null', path: ['documentId'] }
  );

export const deleteTableResultRequestSchema = z.object({
  tableId: id,
  resultId: id
});

export type PreviewTableRollRequest = z.infer<typeof previewTableRollRequestSchema>;
export type NormalizeRollTableRequest = z.infer<typeof normalizeRollTableRequestSchema>;
export type CreateRollTableFromFolderRequest = z.infer<typeof createRollTableFromFolderRequestSchema>;
export type CreateTableResultEntryRequest = z.infer<typeof createTableResultRequestSchema>;
export type UpdateTableResultRequest = z.infer<typeof updateTableResultRequestSchema>;
export type DeleteTableResultRequest = z.infer<typeof deleteTableResultRequestSchema>;
