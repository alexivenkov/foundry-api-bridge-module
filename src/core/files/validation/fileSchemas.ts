import { z } from 'zod';
import { FILE_SOURCES } from '@/core/files/domain';

const MAX_PATH_LENGTH = 1024;

export const browseFilesRequestSchema = z.object({
  source: z.enum(FILE_SOURCES).optional(),
  path: z.string().max(MAX_PATH_LENGTH).nullish(),
  bucket: z.string().max(255).nullish(),
  extensions: z
    .array(z.string().regex(/^\.?[A-Za-z0-9]{1,10}$/, 'must be a file extension such as png or .png'))
    .max(50)
    .optional(),
  wildcard: z.boolean().optional()
});

export const createDirectoryRequestSchema = z.object({
  path: z.string().min(1).max(MAX_PATH_LENGTH)
});

export const uploadFileRequestSchema = z.object({
  directory: z.string().min(1).max(MAX_PATH_LENGTH),
  fileName: z.string().min(1),
  content: z.string().min(1),
  overwrite: z.boolean().optional()
});

export type BrowseFilesRequest = z.infer<typeof browseFilesRequestSchema>;
export type CreateDirectoryRequest = z.infer<typeof createDirectoryRequestSchema>;
export type UploadFileRequest = z.infer<typeof uploadFileRequestSchema>;
