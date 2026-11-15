import type { FoundryDocument, FoundryDocumentClass, FoundryDocumentIndex } from '../../../../core/documents/infrastructure';
import { fakeDocument, fakeGlobals } from '../../../../core/documents/infrastructure/__tests__/fakeFoundry';
import type { DocumentHandlerDependencies } from '../GetDocumentOwnershipHandler';
import { createExportDocumentHandler } from '../ExportDocumentHandler';
import { createGetDocumentFlagsHandler } from '../GetDocumentFlagsHandler';
import { createGetDocumentOwnershipHandler } from '../GetDocumentOwnershipHandler';
import { createImportDocumentHandler } from '../ImportDocumentHandler';
import { createSearchDocumentsHandler } from '../SearchDocumentsHandler';
import { createSetDocumentFlagHandler } from '../SetDocumentFlagHandler';
import { createSetDocumentOwnershipHandler } from '../SetDocumentOwnershipHandler';
import { createSortDocumentHandler } from '../SortDocumentHandler';
import { createUnsetDocumentFlagHandler } from '../UnsetDocumentFlagHandler';

const U1 = 'bbbbbbbbbbbbbbbb';

function world(): {
  deps: DocumentHandlerDependencies;
  goblin: ReturnType<typeof fakeDocument>;
  orc: ReturnType<typeof fakeDocument>;
  actorClass: jest.Mocked<FoundryDocumentClass>;
} {
  const goblin = fakeDocument({
    uuid: 'Actor.gob',
    documentName: 'Actor',
    name: 'Goblin',
    source: { name: 'Goblin', type: 'npc', folder: null, sort: 100000, ownership: { default: 0, [U1]: 3 }, flags: { world: { stage: 1 } } }
  });
  const orc = fakeDocument({ uuid: 'Actor.orc', documentName: 'Actor', name: 'Orc', source: { folder: null, sort: 200000 } });
  const user = fakeDocument({ uuid: 'User.u', documentName: 'User', fields: ['flags', 'name'] });
  const created = fakeDocument({ uuid: 'Actor.new', documentName: 'Actor', name: 'Imported', source: { folder: null } });
  const actorClass: jest.Mocked<FoundryDocumentClass> = {
    fromImport: jest.fn((source: Record<string, unknown>) =>
      Promise.resolve(fakeDocument({ uuid: 'Actor.tmp', documentName: 'Actor', source }))
    ),
    fromSource: jest.fn(),
    create: jest.fn((_data: Record<string, unknown>) => Promise.resolve<FoundryDocument | null | undefined>(created))
  };
  const documentIndex: FoundryDocumentIndex = {
    ready: null,
    lookup: () => ({ Actor: [{ entry: goblin, documentName: 'Actor', uuid: 'Actor.gob' }] })
  };
  const globals = fakeGlobals({
    documents: [goblin, orc, user],
    users: { [U1]: 'Alice' },
    collections: { Actor: [goblin, orc] },
    documentClasses: { Actor: actorClass },
    documentIndex
  });
  return {
    deps: { globals: () => globals, scripts: { allowsScripts: () => false }, generation: () => 14 },
    goblin,
    orc,
    actorClass
  };
}

describe('document handlers', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('get-document-ownership / set-document-ownership', () => {
    it('reads the ownership with user names', async () => {
      const { deps } = world();

      await expect(createGetDocumentOwnershipHandler(deps)({ uuid: 'Actor.gob' })).resolves.toEqual({
        uuid: 'Actor.gob',
        documentType: 'Actor',
        id: 'gob',
        name: 'Goblin',
        packId: null,
        parentUuid: null,
        defaultLevel: 'none',
        users: [{ userId: U1, userName: 'Alice', level: 'owner' }]
      });
    });

    it('replaces the ownership and returns the result', async () => {
      const { deps, goblin } = world();

      const result = await createSetDocumentOwnershipHandler(deps)({ uuid: 'Actor.gob', defaultLevel: 'observer', users: { [U1]: null } });

      expect(goblin.update).toHaveBeenCalledWith({ ownership: { default: 2 } }, { diff: false, recursive: false });
      expect(result).toMatchObject({ defaultLevel: 'observer', users: [] });
    });

    it('rejects an invalid level and an unknown document', async () => {
      const { deps } = world();

      await expect(createSetDocumentOwnershipHandler(deps)({ uuid: 'Actor.gob', defaultLevel: 'admin' as never })).rejects.toThrow(
        /^defaultLevel: /
      );
      await expect(createGetDocumentOwnershipHandler(deps)({ uuid: 'Actor.zz' })).rejects.toThrow('Document not found: Actor.zz');
    });
  });

  describe('flags', () => {
    it('reads, sets and unsets a flag', async () => {
      const { deps, goblin } = world();

      await expect(createGetDocumentFlagsHandler(deps)({ uuid: 'Actor.gob', scope: 'world' })).resolves.toMatchObject({
        scope: 'world',
        flags: { stage: 1 }
      });
      await expect(
        createSetDocumentFlagHandler(deps)({ uuid: 'Actor.gob', scope: 'dnd5e', key: 'hint.seen', value: true })
      ).resolves.toMatchObject({ uuid: 'Actor.gob', scope: 'dnd5e', key: 'hint.seen', value: true });
      expect(goblin.setFlag).toHaveBeenCalledWith('dnd5e', 'hint.seen', true);
      await expect(createUnsetDocumentFlagHandler(deps)({ uuid: 'Actor.gob', scope: 'world', key: 'stage' })).resolves.toMatchObject({
        unset: true,
        existed: true
      });
      expect(goblin.unsetFlag).toHaveBeenCalledWith('world', 'stage');
    });

    it('rejects a missing value, an inactive scope and an unknown document', async () => {
      const { deps } = world();

      await expect(createSetDocumentFlagHandler(deps)({ uuid: 'Actor.gob', scope: 'world', key: 'k' } as never)).rejects.toThrow(
        'value: is required'
      );
      await expect(createSetDocumentFlagHandler(deps)({ uuid: 'Actor.gob', scope: 'pf2e', key: 'k', value: 1 })).rejects.toThrow(
        'Flag scope "pf2e" is not valid or not currently active'
      );
      await expect(createGetDocumentFlagsHandler(deps)({ uuid: 'Actor.zz' })).rejects.toThrow('Document not found: Actor.zz');
    });
  });

  describe('sort-document', () => {
    it('sorts relative to a sibling', async () => {
      const { deps, orc } = world();

      await expect(createSortDocumentHandler(deps)({ uuid: 'Actor.orc', targetUuid: 'Actor.gob', position: 'before' })).resolves.toEqual({
        uuid: 'Actor.orc',
        documentType: 'Actor',
        id: 'orc',
        name: 'Orc',
        packId: null,
        parentUuid: null,
        sort: 150000,
        targetUuid: 'Actor.gob',
        position: 'before'
      });
      expect(orc.sortRelative.mock.calls[0]?.[0].sortBefore).toBe(true);
    });

    it('rejects a bad position and an unknown target', async () => {
      const { deps } = world();

      await expect(
        createSortDocumentHandler(deps)({ uuid: 'Actor.orc', targetUuid: 'Actor.gob', position: 'first' as never })
      ).rejects.toThrow(/^position: /);
      await expect(createSortDocumentHandler(deps)({ uuid: 'Actor.orc', targetUuid: 'Actor.zz', position: 'after' })).rejects.toThrow(
        'Document not found: Actor.zz'
      );
    });
  });

  describe('search-documents', () => {
    it('searches the index', async () => {
      const { deps } = world();

      await expect(createSearchDocumentsHandler(deps)({ query: 'gob' })).resolves.toEqual({
        query: 'gob',
        results: [
          {
            uuid: 'Actor.gob',
            id: 'gob',
            name: 'Goblin',
            documentType: 'Actor',
            subtype: null,
            packId: null,
            folderId: null,
            parentUuid: null
          }
        ]
      });
    });

    it('rejects an unknown document type', async () => {
      const { deps } = world();

      await expect(createSearchDocumentsHandler(deps)({ query: 'gob', documentTypes: ['Setting' as never] })).rejects.toThrow(
        /^documentTypes\.0: /
      );
    });
  });

  describe('export-document / import-document', () => {
    it('exports a transferable document with the export stamp', async () => {
      const { deps } = world();

      const result = await createExportDocumentHandler(deps)({ uuid: 'Actor.gob' });

      expect(result).toMatchObject({ uuid: 'Actor.gob', documentType: 'Actor', data: { name: 'Goblin', type: 'npc' } });
      expect((result.data['_stats'] as Record<string, unknown>)['exportSource']).toMatchObject({ uuid: 'Actor.gob', worldId: 'my-world' });
    });

    it('refuses to export a User and an unknown document', async () => {
      const { deps } = world();

      await expect(createExportDocumentHandler(deps)({ uuid: 'User.u' })).rejects.toThrow('User documents cannot be exported or imported');
      await expect(createExportDocumentHandler(deps)({ uuid: 'Actor.zz' })).rejects.toThrow('Document not found: Actor.zz');
    });

    it('imports exported data as a new world document', async () => {
      const { deps, actorClass } = world();

      await expect(createImportDocumentHandler(deps)({ documentType: 'Actor', data: { name: 'Imported', type: 'npc' } })).resolves.toEqual({
        uuid: 'Actor.new',
        documentType: 'Actor',
        id: 'new',
        name: 'Imported',
        packId: null,
        parentUuid: null,
        folderId: null
      });
      expect(actorClass.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Imported', folder: null }));
    });

    it('rejects a forbidden type, a missing folder and a script macro without the opt-in', async () => {
      const { deps } = world();
      const importDocument = createImportDocumentHandler(deps);

      await expect(importDocument({ documentType: 'User' as never, data: {} })).rejects.toThrow(/^documentType: /);
      await expect(importDocument({ documentType: 'Actor', data: {}, folderId: 'nope' })).rejects.toThrow('Folder not found: nope');
      await expect(importDocument({ documentType: 'Macro', data: { name: 'm', type: 'script' } })).rejects.toThrow(
        'Script macros are disabled.'
      );
    });
  });
});
