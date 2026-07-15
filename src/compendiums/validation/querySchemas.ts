import { z } from 'zod';

// Schemas are deliberately tolerant: numeric bounds and unknown keys are not
// rejected here — out-of-range limits fall back via domain policies, exactly
// as the pre-DDD handlers behaved.

export const packFieldOperatorSchema = z.enum([
  'EQUALS',
  'CONTAINS',
  'STARTS_WITH',
  'ENDS_WITH',
  'LESS_THAN',
  'LESS_THAN_EQUAL',
  'GREATER_THAN',
  'GREATER_THAN_EQUAL',
  'BETWEEN',
  'IS_EMPTY'
]);

export const getCompendiumRequestSchema = z.object({
  packId: z.string(),
  types: z.array(z.string()).optional(),
  ids: z.array(z.string()).optional()
});

export type GetCompendiumRequest = z.infer<typeof getCompendiumRequestSchema>;

export const getCompendiumIndexRequestSchema = z.object({
  packId: z.string(),
  fields: z.array(z.string()).optional()
});

export type GetCompendiumIndexRequest = z.infer<typeof getCompendiumIndexRequestSchema>;

export const searchCompendiumRequestSchema = z.object({
  packId: z.string(),
  query: z.string().optional(),
  filters: z
    .array(
      z.object({
        field: z.string(),
        operator: packFieldOperatorSchema.optional(),
        value: z.unknown(),
        negate: z.boolean().optional()
      })
    )
    .optional(),
  exclude: z.array(z.string()).optional(),
  fields: z.array(z.string()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
});

export type SearchCompendiumRequest = z.infer<typeof searchCompendiumRequestSchema>;

export const searchCompendiumsRequestSchema = z.object({
  query: z.string(),
  type: z.string().optional(),
  system: z.string().optional(),
  limit: z.number().optional()
});

export type SearchCompendiumsRequest = z.infer<typeof searchCompendiumsRequestSchema>;

export const getCompendiumDocumentRequestSchema = z.object({
  packId: z.string(),
  documentId: z.string()
});

export const searchCompendiumPagesRequestSchema = z.object({
  query: z.string(),
  packIds: z.array(z.string()).optional(),
  pageTypes: z.array(z.string()).optional(),
  searchContent: z.boolean().optional(),
  limit: z.number().optional()
});

export type SearchCompendiumPagesRequest = z.infer<
  typeof searchCompendiumPagesRequestSchema
>;

export type GetCompendiumDocumentRequest = z.infer<
  typeof getCompendiumDocumentRequestSchema
>;
