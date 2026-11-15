import { CoreFeatureUnavailableError } from '../../../shared';
import {
  CompendiumDocumentReadOnlyError,
  DocumentCreationFailedError,
  DocumentNotFoundError,
  DocumentTypeNotTransferableError,
  DocumentsNotSiblingsError,
  ImportFolderNotFoundError,
  ImportFolderTypeMismatchError,
  PayloadTooLargeError,
  ScriptImportDisabledError,
  type DocumentSearchQuery,
  type SortableDocument
} from '../../domain';
import { DocumentSearchService } from '../DocumentSearchService';
import { DocumentSortService } from '../DocumentSortService';
import { DocumentTransferService } from '../DocumentTransferService';
import { FakeExporter, FakeImporter, FakeIndexReader, FakeSortStore, ref, scriptPolicy } from './fakePorts';

function sortable(uuid: string, container: string | null, overrides: Partial<SortableDocument['document']> = {}): SortableDocument {
  return { document: ref({ uuid, ...overrides }), sort: 100000, container };
}

describe('DocumentSortService', () => {
  const siblings = [sortable('Actor.a', 'world:Actor:f1'), sortable('Actor.b', 'world:Actor:f1'), sortable('Actor.c', 'world:Actor:')];

  it('sorts a document relative to a sibling and returns its new sort value', async () => {
    const store = new FakeSortStore(siblings);
    const service = new DocumentSortService({ documents: store });

    const result = await service.sortDocument({ uuid: 'Actor.a', targetUuid: 'Actor.b', position: 'after' });

    expect(store.sorted).toEqual([{ uuid: 'Actor.a', targetUuid: 'Actor.b', position: 'after' }]);
    expect(result).toEqual({ document: ref({ uuid: 'Actor.a' }), sort: 150000, targetUuid: 'Actor.b', position: 'after' });
  });

  it('refuses documents that are not siblings, without writing', async () => {
    const store = new FakeSortStore(siblings);
    const service = new DocumentSortService({ documents: store });

    await expect(service.sortDocument({ uuid: 'Actor.a', targetUuid: 'Actor.c', position: 'before' })).rejects.toThrow(
      DocumentsNotSiblingsError
    );
    expect(store.sorted).toHaveLength(0);
  });

  it('refuses an unknown target and a compendium document', async () => {
    const packed = [sortable('Compendium.p.Actor.x', 'pack:p:Actor:', { packId: 'p' }), sortable('Compendium.p.Actor.y', 'pack:p:Actor:', { packId: 'p' })];
    const service = new DocumentSortService({ documents: new FakeSortStore([...siblings, ...packed]) });

    await expect(service.sortDocument({ uuid: 'Actor.a', targetUuid: 'Actor.zz', position: 'before' })).rejects.toThrow(
      'Document not found: Actor.zz'
    );
    await expect(
      service.sortDocument({ uuid: 'Compendium.p.Actor.x', targetUuid: 'Compendium.p.Actor.y', position: 'before' })
    ).rejects.toThrow(CompendiumDocumentReadOnlyError);
  });

  it('reports a document that vanished during the write as not found', async () => {
    const store = new FakeSortStore(siblings);
    store.losesDocumentOnWrite = true;

    await expect(
      new DocumentSortService({ documents: store }).sortDocument({ uuid: 'Actor.a', targetUuid: 'Actor.b', position: 'before' })
    ).rejects.toThrow(DocumentNotFoundError);
  });
});

describe('DocumentSearchService', () => {
  const query: DocumentSearchQuery = { query: 'gob', documentTypes: ['Actor'], source: 'all', limit: 10 };
  const hit = {
    uuid: 'Actor.a',
    id: 'a',
    name: 'Goblin',
    documentType: 'Actor',
    subtype: 'npc',
    packId: null,
    folderId: null,
    parentUuid: null
  };

  it('passes the query to the index and echoes it', async () => {
    const index = new FakeIndexReader([hit]);

    await expect(new DocumentSearchService({ index }).search(query)).resolves.toEqual({ query: 'gob', results: [hit] });
    expect(index.queries).toEqual([query]);
  });

  it('refuses when the core has no document index', async () => {
    const service = new DocumentSearchService({ index: new FakeIndexReader([], false) });

    await expect(service.search(query)).rejects.toThrow(CoreFeatureUnavailableError);
    await expect(service.search(query)).rejects.toThrow('The core document index is not available');
  });
});

describe('DocumentTransferService', () => {
  function setup(options: { scripts?: boolean } = {}): {
    exporter: FakeExporter;
    importer: FakeImporter;
    service: DocumentTransferService;
  } {
    const exporter = new FakeExporter([
      ref(),
      ref({ uuid: 'User.u1', documentType: 'User', id: 'u1', name: 'Alice' }),
      ref({ uuid: 'Compendium.p.Item.i', documentType: 'Item', packId: 'p' })
    ]);
    const importer = new FakeImporter([
      { id: 'fActors', type: 'Actor' },
      { id: 'fItems', type: 'Item' }
    ]);
    const service = new DocumentTransferService({ exporter, importer, scripts: scriptPolicy(options.scripts ?? false) });
    return { exporter, importer, service };
  }

  describe('exportDocument', () => {
    it('returns the exported data of a transferable document, world or compendium', async () => {
      const { exporter, service } = setup();

      await expect(service.exportDocument({ uuid: 'Actor.a1' })).resolves.toEqual({
        document: ref(),
        data: { name: 'Goblin', type: 'npc' }
      });
      await expect(service.exportDocument({ uuid: 'Compendium.p.Item.i' })).resolves.toMatchObject({
        document: { packId: 'p' }
      });
      expect(exporter.exported).toEqual(['Actor.a1', 'Compendium.p.Item.i']);
    });

    it('refuses a User before the core serializes it', async () => {
      const { exporter, service } = setup();

      await expect(service.exportDocument({ uuid: 'User.u1' })).rejects.toThrow(DocumentTypeNotTransferableError);
      expect(exporter.exported).toHaveLength(0);
    });

    it('refuses an unknown uuid and an export over the size limit', async () => {
      const { exporter, service } = setup();

      await expect(service.exportDocument({ uuid: 'Actor.zz' })).rejects.toThrow('Document not found: Actor.zz');
      exporter.data = { blob: 'x'.repeat(8 * 1024 * 1024) };
      await expect(service.exportDocument({ uuid: 'Actor.a1' })).rejects.toThrow(PayloadTooLargeError);
      await expect(service.exportDocument({ uuid: 'Actor.a1' })).rejects.toThrow(/^The exported Actor is \d+ bytes as JSON/);
    });
  });

  describe('importDocument', () => {
    it('creates the document, at the root or in a folder of its type', async () => {
      const { importer, service } = setup();

      await expect(
        service.importDocument({ documentType: 'Actor', data: { name: 'Orc' }, folderId: undefined })
      ).resolves.toEqual({ document: ref({ uuid: 'Actor.new1', id: 'new1', name: 'Orc' }), folderId: null });
      await expect(
        service.importDocument({ documentType: 'Actor', data: { name: 'Orc' }, folderId: 'fActors' })
      ).resolves.toMatchObject({ folderId: 'fActors' });
      expect(importer.imported.map((call) => call.folderId)).toEqual([null, 'fActors']);
    });

    it('refuses a missing folder and a folder of another type', async () => {
      const { importer, service } = setup();

      await expect(
        service.importDocument({ documentType: 'Actor', data: {}, folderId: 'nope' })
      ).rejects.toThrow(ImportFolderNotFoundError);
      await expect(
        service.importDocument({ documentType: 'Actor', data: {}, folderId: 'fItems' })
      ).rejects.toThrow(ImportFolderTypeMismatchError);
      await expect(
        service.importDocument({ documentType: 'Actor', data: {}, folderId: 'fItems' })
      ).rejects.toThrow('Folder fItems holds Item documents, not Actor');
      expect(importer.imported).toHaveLength(0);
    });

    it('refuses script content unless script macros are allowed', async () => {
      const blocked = setup({ scripts: false });
      blocked.importer.scriptContent = ['script macro'];

      await expect(
        blocked.service.importDocument({ documentType: 'Macro', data: { type: 'script' }, folderId: undefined })
      ).rejects.toThrow(ScriptImportDisabledError);
      expect(blocked.importer.imported).toHaveLength(0);

      const allowed = setup({ scripts: true });
      allowed.importer.scriptContent = ['script macro'];
      await expect(
        allowed.service.importDocument({ documentType: 'Macro', data: { type: 'script' }, folderId: undefined })
      ).resolves.toMatchObject({ document: { documentType: 'Macro' } });
    });

    it('refuses oversized data and reports a vetoed creation', async () => {
      const { importer, service } = setup();

      await expect(
        service.importDocument({ documentType: 'Item', data: { blob: 'x'.repeat(8 * 1024 * 1024) }, folderId: undefined })
      ).rejects.toThrow(PayloadTooLargeError);

      importer.createsNothing = true;
      await expect(service.importDocument({ documentType: 'Item', data: {}, folderId: undefined })).rejects.toThrow(
        DocumentCreationFailedError
      );
      await expect(service.importDocument({ documentType: 'Item', data: {}, folderId: undefined })).rejects.toThrow(
        'Failed to create Item'
      );
    });
  });
});
