import { AdventureOverwriteRefusedError, PackDocumentNotFoundError } from '../../domain';
import { FoundryAdventureGateway } from '../FoundryAdventureGateway';
import type {
  FoundryAdventureClass,
  FoundryAdventureImportData,
  FoundryAdventureImportResult,
  FoundryAdventurePreImport
} from '../foundryAdventureTypes';
import type { FoundryPackDocumentLike } from '../foundryPackManagementTypes';
import { fakeGlobals, fakePack, fakeWorld } from './managementFixtures';

// Adventure.contentFields as the v13 / v14 schema defines it (probed).
const adventureClass: FoundryAdventureClass = {
  contentFields: {
    actors: { documentName: 'Actor' },
    combats: { documentName: 'Combat' },
    items: { documentName: 'Item' },
    journal: { documentName: 'JournalEntry' },
    scenes: { documentName: 'Scene' },
    tables: { documentName: 'RollTable' },
    macros: { documentName: 'Macro' },
    cards: { documentName: 'Cards' },
    playlists: { documentName: 'Playlist' },
    folders: { documentName: 'Folder' }
  },
  prototype: { prepareImport: () => undefined, import: () => undefined }
};

const importData: FoundryAdventureImportData = {
  toCreate: {
    Scene: [{ _id: 's1', name: 'Cave' }],
    Actor: [{ _id: 'a1', name: 'Goblin' }]
  },
  toUpdate: { Folder: [{ _id: 'f1', name: 'Monsters' }] },
  documentCount: 3
};

function setup(result?: FoundryAdventureImportResult): {
  gateway: FoundryAdventureGateway;
  adventure: { prepareImport: jest.Mock; import: jest.Mock };
  settings: Record<string, unknown>;
} {
  const adventure = {
    id: 'adv1',
    uuid: 'Compendium.world.adventures.Adventure.adv1',
    name: 'Lost Mine',
    img: 'adv.webp',
    caption: '<p>A</p>',
    description: '<p>B</p>',
    prepareImport: jest.fn().mockResolvedValue(importData),
    import: jest.fn().mockResolvedValue(result ?? { created: {}, updated: {} })
  };
  const pack = fakePack({
    collection: 'world.adventures',
    getDocument: jest.fn((id: string) =>
      Promise.resolve(id === 'adv1' ? (adventure as unknown as FoundryPackDocumentLike) : null)
    )
  });
  const world = fakeWorld({ packs: [pack] });
  const gateway = new FoundryAdventureGateway(world.provider, fakeGlobals({ adventureClass: () => adventureClass }));
  return { gateway, adventure, settings: world.settings };
}

describe('FoundryAdventureGateway', () => {
  it('reports availability and the content types of the version', () => {
    const { gateway } = setup();
    expect(gateway.isAvailable()).toBe(true);
    expect(gateway.contentTypes()).toEqual([
      'Actor', 'Combat', 'Item', 'JournalEntry', 'Scene', 'RollTable', 'Macro', 'Cards', 'Playlist', 'Folder'
    ]);
    const bare = new FoundryAdventureGateway(fakeWorld().provider, fakeGlobals());
    expect(bare.isAvailable()).toBe(false);
    expect(bare.contentTypes()).toEqual([]);
  });

  it('reads the header with the import record of the world', async () => {
    const { gateway, settings } = setup();
    expect((await gateway.readAdventure('world.adventures', 'adv1'))?.imported).toBe(false);
    settings['core.adventureImports'] = { 'Compendium.world.adventures.Adventure.adv1': { coreVersion: '14.368' } };
    expect(await gateway.readAdventure('world.adventures', 'adv1')).toEqual({
      id: 'adv1',
      uuid: 'Compendium.world.adventures.Adventure.adv1',
      name: 'Lost Mine',
      img: 'adv.webp',
      caption: '<p>A</p>',
      description: '<p>B</p>',
      imported: true
    });
    expect(await gateway.readAdventure('world.adventures', 'gone')).toBeNull();
  });

  it('plans with every field, or the selected fields plus folders, grouped in content order', async () => {
    const { gateway, adventure } = setup();
    const plan = await gateway.planImport('world.adventures', 'adv1');
    expect(adventure.prepareImport).toHaveBeenCalledWith({ importFields: [] });
    expect(plan).toEqual({
      toCreate: [
        { documentType: 'Actor', documents: [{ id: 'a1', name: 'Goblin' }] },
        { documentType: 'Scene', documents: [{ id: 's1', name: 'Cave' }] }
      ],
      toUpdate: [{ documentType: 'Folder', documents: [{ id: 'f1', name: 'Monsters' }] }]
    });
    await gateway.planImport('world.adventures', 'adv1', ['Scene', 'Actor']);
    expect(adventure.prepareImport).toHaveBeenLastCalledWith({ importFields: ['actors', 'scenes', 'folders'] });
    await expect(gateway.planImport('world.adventures', 'gone')).rejects.toThrow(PackDocumentNotFoundError);
  });

  it('imports without the dialog and maps what the core created and replaced', async () => {
    const { gateway, adventure } = setup({
      created: { Actor: [{ id: 'a1', name: 'Goblin' }] },
      updated: { Folder: [{ id: 'f1', name: 'Monsters' }] }
    });
    const outcome = await gateway.importAdventure('world.adventures', 'adv1', { allowOverwrite: true });
    expect(adventure.import).toHaveBeenCalledWith({ dialog: false, importFields: [], preImport: [] });
    expect(outcome).toEqual({
      created: [{ documentType: 'Actor', documents: [{ id: 'a1', name: 'Goblin' }] }],
      updated: [{ documentType: 'Folder', documents: [{ id: 'f1', name: 'Monsters' }] }]
    });
  });

  it('guards the import against overwriting when it is not allowed', async () => {
    const { gateway, adventure } = setup();
    await gateway.importAdventure('world.adventures', 'adv1', { documentTypes: ['Actor'], allowOverwrite: false });
    const options = adventure.import.mock.calls[0]?.[0] as { importFields: string[]; preImport: FoundryAdventurePreImport[] };
    expect(options.importFields).toEqual(['actors', 'folders']);
    const [guard] = options.preImport;
    expect(() => guard?.({ toCreate: {}, toUpdate: {}, documentCount: 0 })).not.toThrow();
    expect(() => guard?.(importData)).toThrow(new AdventureOverwriteRefusedError('Lost Mine', 1, 'Folder 1'));
  });

  it('reads the array result of a hook-cancelled import as null', async () => {
    const { gateway } = setup({ created: [], updated: [] });
    expect(await gateway.importAdventure('world.adventures', 'adv1', { allowOverwrite: true })).toBeNull();
  });
});
