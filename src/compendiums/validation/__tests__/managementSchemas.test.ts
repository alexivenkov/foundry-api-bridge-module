import { ADVENTURE_CONTENT_TYPES, COMPENDIUM_PACK_TYPES } from '../../domain';
import {
  COMPENDIUM_PACK_TYPE_CODES,
  SELECTABLE_ADVENTURE_CONTENT_CODES,
  configureCompendiumRequestSchema,
  createCompendiumRequestSchema,
  duplicateCompendiumRequestSchema,
  exportFolderToCompendiumRequestSchema,
  exportToCompendiumRequestSchema,
  importAdventureRequestSchema,
  importCompendiumFolderRequestSchema,
  importCompendiumRequestSchema,
  packDocumentRequestSchema,
  packIdRequestSchema,
  updateCompendiumDocumentRequestSchema
} from '../managementSchemas';
import {
  toConfigurePackCommand,
  toCreatePackCommand,
  toExportFolderCommand,
  toImportAdventureCommand,
  toImportPackCommand,
  toImportPackFolderCommand,
  toUpdatePackDocumentCommand
} from '../managementMappers';

describe('compendium management schemas', () => {
  it('keeps the wire enums in line with the domain lists', () => {
    expect([...COMPENDIUM_PACK_TYPE_CODES]).toEqual([...COMPENDIUM_PACK_TYPES]);
    expect([...SELECTABLE_ADVENTURE_CONTENT_CODES, 'Folder']).toEqual([...ADVENTURE_CONTENT_TYPES]);
  });

  it('requires non-empty ids and ignores unknown keys', () => {
    expect(packIdRequestSchema.safeParse({ packId: '' }).success).toBe(false);
    expect(packIdRequestSchema.parse({ packId: 'world.a', extra: 1 })).toEqual({ packId: 'world.a' });
    expect(packDocumentRequestSchema.safeParse({ packId: 'world.a' }).success).toBe(false);
  });

  it('validates create-compendium and reads null / empty folder ids as absent', () => {
    expect(createCompendiumRequestSchema.safeParse({ label: ' ', documentType: 'Actor' }).success).toBe(false);
    expect(createCompendiumRequestSchema.safeParse({ label: 'A', documentType: 'Folder' }).success).toBe(false);
    const request = createCompendiumRequestSchema.parse({ label: ' Loot ', documentType: 'Item', folderId: '' });
    expect(toCreatePackCommand(request)).toEqual({ label: 'Loot', documentType: 'Item', folderId: undefined });
    expect(duplicateCompendiumRequestSchema.parse({ packId: 'p', folderId: null }).folderId).toBeUndefined();
  });

  it('validates configure-compendium: levels, null reset and folder clearing', () => {
    expect(configureCompendiumRequestSchema.safeParse({ packId: 'p', ownership: { player: 'OBSERVER' } }).success).toBe(false);
    expect(configureCompendiumRequestSchema.safeParse({ packId: 'p', locked: 'yes' }).success).toBe(false);
    const partial = configureCompendiumRequestSchema.parse({ packId: 'p', ownership: { trusted: 'owner' }, folderId: '' });
    expect(toConfigurePackCommand(partial)).toEqual({
      packId: 'p',
      locked: undefined,
      ownership: { trusted: 'owner' },
      folderId: null
    });
    const reset = configureCompendiumRequestSchema.parse({ packId: 'p', ownership: null, locked: false });
    expect(toConfigurePackCommand(reset)).toMatchObject({ ownership: null, locked: false, folderId: undefined });
  });

  it('validates export params and defaults the folder export flags to the core defaults', () => {
    expect(exportToCompendiumRequestSchema.safeParse({ packId: 'p', documentId: '' }).success).toBe(false);
    const request = exportFolderToCompendiumRequestSchema.parse({ packId: 'p', folderId: 'f', packFolderId: null });
    expect(toExportFolderCommand(request)).toEqual({
      packId: 'p',
      folderId: 'f',
      packFolderId: undefined,
      keepFolders: false,
      updateByName: false,
      keepId: false
    });
    expect(exportFolderToCompendiumRequestSchema.safeParse({ packId: 'p', folderId: 'f', keepId: 1 }).success).toBe(false);
  });

  it('refuses an _id change and passes other opaque changes through', () => {
    expect(updateCompendiumDocumentRequestSchema.safeParse({ packId: 'p', documentId: 'd', changes: { _id: 'x' } }).success).toBe(false);
    const request = updateCompendiumDocumentRequestSchema.parse({
      packId: 'p',
      documentId: 'd',
      folderId: null,
      changes: { 'system.hp': 3 }
    });
    expect(toUpdatePackDocumentCommand(request)).toEqual({
      packId: 'p',
      documentId: 'd',
      name: undefined,
      folderId: null,
      changes: { 'system.hp': 3 }
    });
  });

  it('validates the import params', () => {
    expect(toImportPackCommand(importCompendiumRequestSchema.parse({ packId: 'p', folderId: '' }))).toEqual({
      packId: 'p',
      folderId: undefined,
      folderName: undefined,
      keepId: false
    });
    expect(importCompendiumFolderRequestSchema.safeParse({ packId: 'p' }).success).toBe(false);
    expect(toImportPackFolderCommand(importCompendiumFolderRequestSchema.parse({ packId: 'p', packFolderId: 'f', keepId: true }))).toEqual({
      packId: 'p',
      packFolderId: 'f',
      folderId: undefined,
      keepId: true
    });
  });

  it('validates import-adventure types and defaults overwrite to false', () => {
    expect(importAdventureRequestSchema.safeParse({ packId: 'p', adventureId: 'a', documentTypes: ['Folder'] }).success).toBe(false);
    expect(importAdventureRequestSchema.safeParse({ packId: 'p', adventureId: 'a', documentTypes: [] }).success).toBe(false);
    expect(toImportAdventureCommand(importAdventureRequestSchema.parse({ packId: 'p', adventureId: 'a', documentTypes: ['Scene'] }))).toEqual({
      packId: 'p',
      adventureId: 'a',
      documentTypes: ['Scene'],
      overwrite: false
    });
  });
});
