import { z } from 'zod';

export const folderReferenceSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    recursive: z.boolean().optional()
  })
  .refine(
    (obj) => obj.id !== undefined || obj.name !== undefined,
    { message: "folder must specify at least 'id' or 'name'" }
  );
