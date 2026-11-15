import { z } from 'zod';

// New commands validate strictly (no legacy clients); unknown keys are ignored.

const id = z.string().min(1);
const label = z.string().trim().min(1);

// An optional addressing id sent as null or '' reads as absent.
const optionalId = z
  .string()
  .nullish()
  .transform(value => (value === null || value === '' ? undefined : value));

// A settable reference: null (or '') clears it.
const clearableId = z
  .string()
  .nullable()
  .optional()
  .transform(value => (value === '' ? null : value));

export const COMPENDIUM_PACK_TYPE_CODES = [
  'ActiveEffect',
  'Actor',
  'Adventure',
  'Cards',
  'Item',
  'JournalEntry',
  'Macro',
  'Playlist',
  'RollTable',
  'Scene'
] as const;

export const SELECTABLE_ADVENTURE_CONTENT_CODES = [
  'Actor',
  'Combat',
  'Item',
  'JournalEntry',
  'Scene',
  'RollTable',
  'Macro',
  'Cards',
  'Playlist'
] as const;

const ownershipLevel = z.enum(['inherit', 'none', 'limited', 'observer', 'owner']);

export const packIdRequestSchema = z.object({ packId: id });

export type PackIdRequest = z.infer<typeof packIdRequestSchema>;

export const createCompendiumRequestSchema = z.object({
  label,
  documentType: z.enum(COMPENDIUM_PACK_TYPE_CODES),
  folderId: optionalId
});

export type CreateCompendiumRequest = z.infer<typeof createCompendiumRequestSchema>;

export const duplicateCompendiumRequestSchema = z.object({
  packId: id,
  label: label.optional(),
  folderId: optionalId
});

export type DuplicateCompendiumRequest = z.infer<typeof duplicateCompendiumRequestSchema>;

export const configureCompendiumRequestSchema = z.object({
  packId: id,
  locked: z.boolean().optional(),
  ownership: z
    .object({
      player: ownershipLevel.optional(),
      trusted: ownershipLevel.optional(),
      assistant: ownershipLevel.optional()
    })
    .nullable()
    .optional(),
  folderId: clearableId
});

export type ConfigureCompendiumRequest = z.infer<typeof configureCompendiumRequestSchema>;

export const exportToCompendiumRequestSchema = z.object({
  packId: id,
  documentId: id,
  name: label.optional(),
  folderId: optionalId
});

export type ExportToCompendiumRequest = z.infer<typeof exportToCompendiumRequestSchema>;

export const exportFolderToCompendiumRequestSchema = z.object({
  packId: id,
  folderId: id,
  packFolderId: optionalId,
  keepFolders: z.boolean().optional(),
  updateByName: z.boolean().optional(),
  keepId: z.boolean().optional()
});

export type ExportFolderToCompendiumRequest = z.infer<typeof exportFolderToCompendiumRequestSchema>;

export const updateCompendiumDocumentRequestSchema = z.object({
  packId: id,
  documentId: id,
  name: label.optional(),
  folderId: clearableId,
  changes: z
    .record(z.string(), z.unknown())
    .refine(changes => !Object.keys(changes).some(key => key === '_id' || key.startsWith('_id.')), {
      message: '_id cannot be changed'
    })
    .optional()
});

export type UpdateCompendiumDocumentRequest = z.infer<typeof updateCompendiumDocumentRequestSchema>;

export const packDocumentRequestSchema = z.object({ packId: id, documentId: id });

export type PackDocumentRequest = z.infer<typeof packDocumentRequestSchema>;

export const importCompendiumRequestSchema = z.object({
  packId: id,
  folderId: optionalId,
  folderName: label.optional(),
  keepId: z.boolean().optional()
});

export type ImportCompendiumRequest = z.infer<typeof importCompendiumRequestSchema>;

export const importCompendiumFolderRequestSchema = z.object({
  packId: id,
  packFolderId: id,
  folderId: optionalId,
  keepId: z.boolean().optional()
});

export type ImportCompendiumFolderRequest = z.infer<typeof importCompendiumFolderRequestSchema>;

export const getAdventureRequestSchema = z.object({ packId: id, adventureId: id });

export type GetAdventureRequest = z.infer<typeof getAdventureRequestSchema>;

export const importAdventureRequestSchema = z.object({
  packId: id,
  adventureId: id,
  documentTypes: z.array(z.enum(SELECTABLE_ADVENTURE_CONTENT_CODES)).min(1).optional(),
  overwrite: z.boolean().optional()
});

export type ImportAdventureRequest = z.infer<typeof importAdventureRequestSchema>;
