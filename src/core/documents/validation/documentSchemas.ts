import { z } from 'zod';
import {
  OWNERSHIP_LEVELS,
  SEARCHABLE_DOCUMENT_TYPES,
  SEARCH_LIMIT_MAX,
  SEARCH_QUERY_MAX_LENGTH,
  SEARCH_SOURCES,
  SORT_POSITIONS,
  TRANSFERABLE_DOCUMENT_TYPES
} from '@/core/documents/domain';

const uuidSchema = z.string().min(1);
const nameSchema = z.string().min(1);
const levelSchema = z.enum(OWNERSHIP_LEVELS);

export const documentUuidRequestSchema = z.object({ uuid: uuidSchema });

export const setDocumentOwnershipRequestSchema = z.object({
  uuid: uuidSchema,
  defaultLevel: levelSchema.optional(),
  users: z.record(nameSchema, levelSchema.nullable()).optional()
});

export const getDocumentFlagsRequestSchema = z.object({
  uuid: uuidSchema,
  scope: z.string().nullish()
});

// The transport delivers parsed JSON, so any present value is a JSON value; `null` is one.
export const setDocumentFlagRequestSchema = z.object({
  uuid: uuidSchema,
  scope: nameSchema,
  key: nameSchema,
  value: z.unknown().refine((value) => value !== undefined, { message: 'is required' })
});

export const unsetDocumentFlagRequestSchema = z.object({
  uuid: uuidSchema,
  scope: nameSchema,
  key: nameSchema
});

export const sortDocumentRequestSchema = z.object({
  uuid: uuidSchema,
  targetUuid: uuidSchema,
  position: z.enum(SORT_POSITIONS)
});

export const searchDocumentsRequestSchema = z.object({
  query: z.string().trim().min(1).max(SEARCH_QUERY_MAX_LENGTH),
  documentTypes: z.array(z.enum(SEARCHABLE_DOCUMENT_TYPES)).optional(),
  source: z.enum(SEARCH_SOURCES).optional(),
  limit: z.number().int().min(1).max(SEARCH_LIMIT_MAX).optional()
});

export const importDocumentRequestSchema = z.object({
  documentType: z.enum(TRANSFERABLE_DOCUMENT_TYPES),
  data: z.record(z.string(), z.unknown()),
  folderId: z.string().nullish()
});

export type DocumentUuidRequest = z.infer<typeof documentUuidRequestSchema>;
export type SetDocumentOwnershipRequest = z.infer<typeof setDocumentOwnershipRequestSchema>;
export type GetDocumentFlagsRequest = z.infer<typeof getDocumentFlagsRequestSchema>;
export type SetDocumentFlagRequest = z.infer<typeof setDocumentFlagRequestSchema>;
export type UnsetDocumentFlagRequest = z.infer<typeof unsetDocumentFlagRequestSchema>;
export type SortDocumentRequest = z.infer<typeof sortDocumentRequestSchema>;
export type SearchDocumentsRequest = z.infer<typeof searchDocumentsRequestSchema>;
export type ImportDocumentRequest = z.infer<typeof importDocumentRequestSchema>;
