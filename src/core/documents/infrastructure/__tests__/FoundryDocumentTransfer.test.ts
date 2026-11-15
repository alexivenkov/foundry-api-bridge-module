import { DocumentImportRejectedError } from '../../domain';
import { FoundryDocumentExporter } from '../FoundryDocumentExporter';
import { FoundryDocumentImporter } from '../FoundryDocumentImporter';
import type { FoundryDocument, FoundryDocumentClass } from '../foundryDocumentTypes';
import { fakeDocument, fakeGlobals } from './fakeFoundry';

describe('FoundryDocumentExporter', () => {
  function actor(): ReturnType<typeof fakeDocument> {
    return fakeDocument({
      uuid: 'Actor.a1',
      documentName: 'Actor',
      name: 'Goblin',
      source: { name: 'Goblin', type: 'npc', sort: 5, _stats: { coreVersion: '13.351' } }
    });
  }

  it('exports what "Export Data" writes on Foundry 12+: toCompendium without clearing the source, plus _stats.exportSource', async () => {
    const document = actor();
    const exporter = new FoundryDocumentExporter(() => fakeGlobals({ documents: [document] }), () => 13);

    const data = await exporter.exportDocument('Actor.a1');

    expect(document.toCompendium).toHaveBeenCalledWith(null, { clearSource: false });
    expect(data).toEqual({
      name: 'Goblin',
      type: 'npc',
      _stats: {
        coreVersion: '13.351',
        exportSource: {
          worldId: 'my-world',
          uuid: 'Actor.a1',
          coreVersion: '13.351',
          systemId: 'dnd5e',
          systemVersion: '5.1.0'
        }
      }
    });
  });

  it('stamps flags.exportSource before Foundry 12', async () => {
    const exporter = new FoundryDocumentExporter(() => fakeGlobals({ documents: [actor()] }), () => 11);

    const data = await exporter.exportDocument('Actor.a1');

    expect(data?.['flags']).toEqual({
      exportSource: { world: 'my-world', system: 'dnd5e', coreVersion: '13.351', systemVersion: '5.1.0' }
    });
    expect((data?.['_stats'] as Record<string, unknown>)['exportSource']).toBeUndefined();
  });

  it('finds the reference and resolves to null for a missing document', async () => {
    const exporter = new FoundryDocumentExporter(() => fakeGlobals({ documents: [actor()] }), () => 14);

    await expect(exporter.findDocument('Actor.a1')).resolves.toMatchObject({ documentType: 'Actor', name: 'Goblin' });
    await expect(exporter.findDocument('Actor.zz')).resolves.toBeNull();
    await expect(exporter.exportDocument('Actor.zz')).resolves.toBeNull();
  });
});

describe('FoundryDocumentImporter', () => {
  function documentClass(created: FoundryDocument | null): jest.Mocked<Required<FoundryDocumentClass>> {
    return {
      fromImport: jest.fn((source: Record<string, unknown>) =>
        Promise.resolve(fakeDocument({ uuid: 'Actor.tmp', documentName: 'Actor', source }))
      ),
      fromSource: jest.fn((source: Record<string, unknown>, _options: { strict: boolean }) =>
        fakeDocument({ uuid: 'Actor.tmp', documentName: 'Actor', source })
      ),
      create: jest.fn((_data: Record<string, unknown>) => Promise.resolve<FoundryDocument | null | undefined>(created))
    };
  }

  const createdActor = fakeDocument({ uuid: 'Actor.new1', documentName: 'Actor', name: 'Orc', source: { folder: 'fActors' } });

  it('prepares the data through fromImport and WorldCollection#fromCompendium, then creates it in the folder', async () => {
    const cls = documentClass(createdActor);
    const fromCompendium = jest.fn((document: FoundryDocument, _options: Record<string, boolean>) => ({
      ...document._source,
      ownership: { default: 0 }
    }));
    const importer = new FoundryDocumentImporter(() =>
      fakeGlobals({ documentClasses: { Actor: cls }, collections: { Actor: [] }, fromCompendium })
    );
    const data = { _id: 'old', name: 'Orc', type: 'npc', folder: 'stale' };

    const imported = await importer.importDocument('Actor', data, 'fActors');

    expect(cls.fromImport).toHaveBeenCalledWith(data);
    expect(cls.fromImport.mock.calls[0]?.[0]).not.toBe(data);
    expect(fromCompendium.mock.calls[0]?.[1]).toEqual({
      clearFolder: true,
      clearSort: true,
      clearOwnership: true,
      clearState: true,
      keepId: false
    });
    expect(cls.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Orc', folder: 'fActors', ownership: { default: 0 } }));
    expect(imported).toEqual({
      document: { uuid: 'Actor.new1', documentType: 'Actor', id: 'new1', name: 'Orc', packId: null, parentUuid: null },
      folderId: 'fActors'
    });
  });

  it('creates at the root with folder null', async () => {
    const cls = documentClass(fakeDocument({ uuid: 'Actor.new2', documentName: 'Actor', source: { folder: null } }));
    const importer = new FoundryDocumentImporter(() => fakeGlobals({ documentClasses: { Actor: cls }, collections: { Actor: [] } }));

    await expect(importer.importDocument('Actor', { name: 'Orc' }, null)).resolves.toMatchObject({ folderId: null });
    expect(cls.create).toHaveBeenCalledWith(expect.objectContaining({ folder: null }));
  });

  it('falls back to a strict fromSource where the core has no fromImport', async () => {
    const { fromImport: _unused, ...withoutImport } = documentClass(createdActor);
    const importer = new FoundryDocumentImporter(() =>
      fakeGlobals({ documentClasses: { Actor: withoutImport }, collections: { Actor: [] } })
    );

    await importer.importDocument('Actor', { name: 'Orc' }, null);

    expect(withoutImport.fromSource).toHaveBeenCalledWith({ name: 'Orc' }, { strict: true });
  });

  it('turns a core validation or migration failure into a domain refusal with a one-line detail', async () => {
    const cls = documentClass(createdActor);
    cls.fromImport.mockRejectedValue(new Error('Actor validation errors:\n  name: may not be undefined'));
    const importer = new FoundryDocumentImporter(() => fakeGlobals({ documentClasses: { Actor: cls }, collections: { Actor: [] } }));

    await expect(importer.importDocument('Actor', {}, null)).rejects.toThrow(DocumentImportRejectedError);
    await expect(importer.importDocument('Actor', {}, null)).rejects.toThrow(
      'Could not import Actor: Actor validation errors: name: may not be undefined'
    );
    expect(cls.create).not.toHaveBeenCalled();
  });

  it('resolves to null when the core created nothing', async () => {
    const cls = documentClass(null);
    const importer = new FoundryDocumentImporter(() => fakeGlobals({ documentClasses: { Actor: cls }, collections: { Actor: [] } }));

    await expect(importer.importDocument('Actor', { name: 'Orc' }, null)).resolves.toBeNull();
  });

  it('finds an import folder with its document type', () => {
    const folder = fakeDocument({ uuid: 'Folder.fActors', documentName: 'Folder', source: { type: 'Actor' } });
    const importer = new FoundryDocumentImporter(() => fakeGlobals({ folders: [folder] }));

    expect(importer.findFolder('fActors')).toEqual({ id: 'fActors', type: 'Actor' });
    expect(importer.findFolder('nope')).toBeNull();
  });

  describe('findScriptContent', () => {
    const scriptMacro = fakeDocument({ uuid: 'Macro.script1', documentName: 'Macro', source: { type: 'script' } });
    const chatMacro = fakeDocument({ uuid: 'Macro.chat1', documentName: 'Macro', source: { type: 'chat' } });
    const importer = new FoundryDocumentImporter(() => fakeGlobals({ documents: [scriptMacro, chatMacro] }));

    it('flags a script macro, not a chat macro or a macro without type (core default chat)', async () => {
      await expect(importer.findScriptContent('Macro', { type: 'script', command: 'x' })).resolves.toEqual(['script macro']);
      await expect(importer.findScriptContent('Macro', { type: 'chat' })).resolves.toEqual([]);
      await expect(importer.findScriptContent('Macro', {})).resolves.toEqual([]);
    });

    it('flags executeScript behaviors and executeMacro behaviors aimed at a script macro in scene regions', async () => {
      const scene = {
        name: 'Crypt',
        regions: [
          { behaviors: [{ type: 'executeScript', system: { source: 'evil()' } }, { type: 'teleportToken', system: {} }] },
          {
            behaviors: [
              { type: 'executeMacro', system: { uuid: 'Macro.script1' } },
              { type: 'executeMacro', system: { uuid: 'Macro.chat1' } },
              { type: 'executeMacro', system: { uuid: 'Macro.missing' } }
            ]
          },
          'junk'
        ]
      };

      await expect(importer.findScriptContent('Scene', scene)).resolves.toEqual([
        'executeScript region behavior',
        'executeMacro region behavior aimed at a script macro'
      ]);
      await expect(importer.findScriptContent('Scene', { name: 'Plain' })).resolves.toEqual([]);
    });

    it('ignores the other transferable types', async () => {
      await expect(importer.findScriptContent('Actor', { type: 'script', regions: [] })).resolves.toEqual([]);
    });
  });
});
