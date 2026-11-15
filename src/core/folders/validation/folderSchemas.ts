import { z } from 'zod';

// Deliberately tolerant, as the pre-DDD handlers were: unknown keys are ignored
// and `type` is any string — the core decides which document types have folders.
// `null` moves a folder to the root or clears its color or description. The two
// tree flags were only ever compared with a literal, so a value that is not a
// boolean still falls back to the default instead of failing the request.

const clearableString = z.string().nullable().optional();

export const getFoldersRequestSchema = z.object({
  type: z.string().optional()
});

export const getFolderRequestSchema = z.object({
  folderId: z.string(),
  includeSubfolders: z.boolean().optional().catch(undefined),
  includeContents: z.boolean().optional().catch(undefined)
});

export const createFolderRequestSchema = z.object({
  name: z.string(),
  type: z.string(),
  parentId: clearableString,
  color: clearableString,
  description: clearableString,
  sort: z.number().optional()
});

export const updateFolderRequestSchema = z.object({
  folderId: z.string(),
  name: z.string().optional(),
  parentId: clearableString,
  color: clearableString,
  description: clearableString,
  sort: z.number().optional()
});

export const deleteFolderRequestSchema = z.object({
  folderId: z.string(),
  deleteSubfolders: z.boolean().optional(),
  deleteContents: z.boolean().optional()
});

export type GetFoldersRequest = z.infer<typeof getFoldersRequestSchema>;
export type GetFolderRequest = z.infer<typeof getFolderRequestSchema>;
export type CreateFolderRequest = z.infer<typeof createFolderRequestSchema>;
export type UpdateFolderRequest = z.infer<typeof updateFolderRequestSchema>;
export type DeleteFolderRequest = z.infer<typeof deleteFolderRequestSchema>;
