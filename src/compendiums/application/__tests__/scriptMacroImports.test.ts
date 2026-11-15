import { ScriptCarrierRefusedError } from '../../../kernel';
import type {
  AdventureImportPlan,
  ScriptMacroImportPolicy,
  WorldDocumentRef
} from '../../domain';
import { AdventureOverwriteRefusedError, ScriptMacroImportDisabledError, WorldIdCollisionError } from '../../domain';
import { AdventureImportService } from '../AdventureImportService';
import { CompendiumBulkImportService } from '../CompendiumBulkImportService';
import { CompendiumImportService } from '../CompendiumImportService';
import { CompendiumWritingService } from '../CompendiumWritingService';
import { FakeActorInventory, FakeCatalog, FakeDocumentReader, FakeWorldImporter, descriptor } from './fakePorts';
import {
  FakeAdventureGateway,
  FakeBulkImporter,
  FakePackContentWriter,
  FakePackManager,
  FakeWorldDirectory,
  documentRef,
  packInfo
} from './managementFakes';

function policy(allows: boolean): ScriptMacroImportPolicy & { allowsScripts: jest.Mock } {
  return { allowsScripts: jest.fn(() => allows) };
}

class MacroPackImporter extends FakeBulkImporter {
  scriptMacros: WorldDocumentRef[] = [{ id: 'm2', name: 'Fireworks' }];
  readonly listed: string[] = [];

  listScriptMacros(packId: string): Promise<readonly WorldDocumentRef[]> {
    this.listed.push(packId);
    return Promise.resolve(this.scriptMacros);
  }
}

const macroFolders = [
  { id: 'mf1', name: 'Tricks', parentId: null },
  { id: 'mf2', name: 'Other', parentId: null }
];

function bulkSetup(scripts?: ScriptMacroImportPolicy): {
  service: CompendiumBulkImportService;
  importer: MacroPackImporter;
  world: FakeWorldDirectory;
} {
  const packs = new FakePackManager(
    packInfo({ id: 'world.macros', type: 'Macro', folders: macroFolders }),
    packInfo({ id: 'world.monsters', type: 'Actor', folders: [{ id: 'pf1', name: 'Undead', parentId: null }] })
  );
  const world = new FakeWorldDirectory().addFolder('wf1', 'Macro');
  const importer = new MacroPackImporter();
  importer.placements = [
    { id: 'm1', folderId: 'mf1' },
    { id: 'm2', folderId: 'mf1' },
    { id: 'm3', folderId: 'mf2' }
  ];
  return { service: new CompendiumBulkImportService({ packs, world, importer, scripts }), importer, world };
}

describe('script macros in bulk imports', () => {
  it('leaves the script macros of a Macro pack out without the opt-in and reports them', async () => {
    const scripts = policy(false);
    const { service, importer } = bulkSetup(scripts);
    const outcome = await service.importPack({ packId: 'world.macros', keepId: false });
    expect(importer.packImports).toEqual([
      { packId: 'world.macros', options: { folderId: undefined, folderName: undefined, keepId: false, skipDocumentIds: ['m2'] } }
    ]);
    expect(outcome.skippedScriptMacros).toEqual([{ id: 'm2', name: 'Fireworks' }]);
    expect(scripts.allowsScripts).toHaveBeenCalled();
  });

  it('reports an empty list for a Macro pack without script macros', async () => {
    const { service, importer } = bulkSetup(policy(false));
    importer.scriptMacros = [];
    const outcome = await service.importPack({ packId: 'world.macros', keepId: false });
    expect(importer.packImports[0]?.options).not.toHaveProperty('skipDocumentIds');
    expect(outcome.skippedScriptMacros).toEqual([]);
  });

  it('imports everything unchanged with the opt-in', async () => {
    const { service, importer } = bulkSetup(policy(true));
    const outcome = await service.importPack({ packId: 'world.macros', keepId: false });
    expect(importer.listed).toEqual([]);
    expect(importer.packImports[0]?.options).not.toHaveProperty('skipDocumentIds');
    expect(outcome).not.toHaveProperty('skippedScriptMacros');
  });

  it('does not ask for the opt-in when the pack cannot hold macros', async () => {
    const scripts = policy(false);
    const { service, importer } = bulkSetup(scripts);
    const outcome = await service.importPack({ packId: 'world.monsters', keepId: false });
    expect(scripts.allowsScripts).not.toHaveBeenCalled();
    expect(importer.listed).toEqual([]);
    expect(outcome).not.toHaveProperty('skippedScriptMacros');
  });

  it('skips script macros when built without a policy', async () => {
    const { service } = bulkSetup();
    expect((await service.importPack({ packId: 'world.macros', keepId: false })).skippedScriptMacros).toEqual([
      { id: 'm2', name: 'Fireworks' }
    ]);
  });

  it('does not count a skipped script macro as an id collision', async () => {
    const { service, world } = bulkSetup(policy(false));
    world.addDocument('Macro', 'm2');
    await expect(service.importPack({ packId: 'world.macros', keepId: true })).resolves.toMatchObject({
      skippedScriptMacros: [{ id: 'm2', name: 'Fireworks' }]
    });
    world.addDocument('Macro', 'm1');
    await expect(service.importPack({ packId: 'world.macros', keepId: true })).rejects.toThrow(WorldIdCollisionError);
  });

  it('drops the script macros of a pack folder from the folder import', async () => {
    const { service, importer } = bulkSetup(policy(false));
    importer.scriptMacros = [
      { id: 'm2', name: 'Fireworks' },
      { id: 'm3', name: 'Elsewhere' }
    ];
    const outcome = await service.importPackFolder({ packId: 'world.macros', packFolderId: 'mf1', keepId: false });
    expect(importer.folderImports[0]?.plan.documentIds).toEqual(['m1']);
    expect(outcome.skippedScriptMacros).toEqual([{ id: 'm2', name: 'Fireworks' }]);
  });

  it('imports a pack folder unchanged with the opt-in', async () => {
    const { service, importer } = bulkSetup(policy(true));
    const outcome = await service.importPackFolder({ packId: 'world.macros', packFolderId: 'mf1', keepId: false });
    expect(importer.folderImports[0]?.plan.documentIds).toEqual(['m1', 'm2']);
    expect(outcome).not.toHaveProperty('skippedScriptMacros');
  });
});

const macroPlan: AdventureImportPlan = {
  toCreate: [
    { documentType: 'Actor', documents: [{ id: 'a1', name: 'Goblin' }] },
    { documentType: 'Macro', documents: [{ id: 'm1', name: 'Light' }] }
  ],
  toUpdate: [{ documentType: 'Macro', documents: [{ id: 'm2', name: 'Fireworks' }] }],
  scriptMacros: [{ id: 'm2', name: 'Fireworks' }]
};

function adventureSetup(scripts?: ScriptMacroImportPolicy, plan: AdventureImportPlan = macroPlan): {
  service: AdventureImportService;
  adventures: FakeAdventureGateway;
} {
  const packs = new FakePackManager(packInfo({ id: 'world.adventures', type: 'Adventure' }));
  const adventures = new FakeAdventureGateway();
  adventures.plan = plan;
  return { service: new AdventureImportService({ packs, adventures, scripts }), adventures };
}

describe('script macros in adventure imports', () => {
  it('asks the gateway to skip them, does not count them as overwrites and reports what it skipped', async () => {
    const { service, adventures } = adventureSetup(policy(false));
    adventures.outcome = {
      created: [{ documentType: 'Actor', documents: [{ id: 'a1', name: 'Goblin' }] }],
      updated: [],
      skippedScriptMacros: [{ id: 'm2', name: 'Fireworks' }]
    };
    const imported = await service.importAdventure({ packId: 'world.adventures', adventureId: 'adv1', overwrite: false });
    expect(adventures.imports).toEqual([{ documentTypes: undefined, allowOverwrite: false, skipScriptMacros: true }]);
    expect(imported.skippedScriptMacros).toEqual([{ id: 'm2', name: 'Fireworks' }]);
  });

  it('still refuses to overwrite the documents it does import', async () => {
    const { service } = adventureSetup(policy(false), {
      ...macroPlan,
      toUpdate: [...macroPlan.toUpdate, { documentType: 'Scene', documents: [{ id: 's1', name: 'Cave' }] }]
    });
    await expect(
      service.importAdventure({ packId: 'world.adventures', adventureId: 'adv1', overwrite: false })
    ).rejects.toThrow(new AdventureOverwriteRefusedError('Lost Mine', 1, 'Scene 1'));
  });

  it('reports an empty list when its macros are chat macros', async () => {
    const { service, adventures } = adventureSetup(policy(false), { ...macroPlan, toUpdate: [], scriptMacros: undefined });
    const imported = await service.importAdventure({ packId: 'world.adventures', adventureId: 'adv1', overwrite: false });
    expect(adventures.imports).toEqual([{ documentTypes: undefined, allowOverwrite: false }]);
    expect(imported.skippedScriptMacros).toEqual([]);
  });

  it('imports unchanged with the opt-in', async () => {
    const { service, adventures } = adventureSetup(policy(true));
    await expect(
      service.importAdventure({ packId: 'world.adventures', adventureId: 'adv1', overwrite: false })
    ).rejects.toThrow(AdventureOverwriteRefusedError);
    const imported = await service.importAdventure({ packId: 'world.adventures', adventureId: 'adv1', overwrite: true });
    expect(adventures.imports).toEqual([{ documentTypes: undefined, allowOverwrite: true }]);
    expect(imported).not.toHaveProperty('skippedScriptMacros');
  });

  it('does not ask for the opt-in when the adventure brings no macros', async () => {
    const scripts = policy(false);
    const { service } = adventureSetup(scripts, {
      toCreate: [{ documentType: 'Actor', documents: [{ id: 'a1', name: 'Goblin' }] }],
      toUpdate: []
    });
    const imported = await service.importAdventure({ packId: 'world.adventures', adventureId: 'adv1', overwrite: false });
    expect(scripts.allowsScripts).not.toHaveBeenCalled();
    expect(imported).not.toHaveProperty('skippedScriptMacros');
  });
});

function importSetup(source: Record<string, unknown>, scripts?: ScriptMacroImportPolicy): {
  service: CompendiumImportService;
  worldImporter: FakeWorldImporter;
} {
  const documentReader = new FakeDocumentReader();
  documentReader.source = source;
  const worldImporter = new FakeWorldImporter();
  const service = new CompendiumImportService({
    catalog: new FakeCatalog([descriptor({ id: 'world.macros', type: 'Macro' }), descriptor({ id: 'world.items', type: 'Item' })]),
    documentReader,
    worldImporter,
    actorInventory: new FakeActorInventory(),
    scripts
  });
  return { service, worldImporter };
}

describe('script macros in import-from-compendium', () => {
  it('refuses a script macro without the opt-in, before creating anything', async () => {
    const { service, worldImporter } = importSetup({ _id: 'm2', name: 'Fireworks', type: 'script' }, policy(false));
    await expect(service.importDocument({ packId: 'world.macros', documentId: 'm2' })).rejects.toThrow(
      new ScriptMacroImportDisabledError()
    );
    expect(worldImporter.importedType).toBeNull();
    expect(new ScriptMacroImportDisabledError().message).toBe(
      'Script macros are disabled. Enable "Allow Script Macros" in module settings to manage script-type macros via API.'
    );
  });

  it('refuses one when built without a policy and imports it with the opt-in', async () => {
    await expect(
      importSetup({ name: 'Fireworks', type: 'script' }).service.importDocument({ packId: 'world.macros', documentId: 'm2' })
    ).rejects.toThrow(ScriptMacroImportDisabledError);
    const { service, worldImporter } = importSetup({ name: 'Fireworks', type: 'script' }, policy(true));
    await service.importDocument({ packId: 'world.macros', documentId: 'm2' });
    expect(worldImporter.importedData).toEqual({ name: 'Fireworks', type: 'script' });
  });

  it('imports a chat macro and a macro without a type without asking', async () => {
    const scripts = policy(false);
    for (const source of [{ name: 'Say', type: 'chat' }, { name: 'Old' }]) {
      const { service, worldImporter } = importSetup(source, scripts);
      await service.importDocument({ packId: 'world.macros', documentId: 'm1' });
      expect(worldImporter.importedType).toBe('Macro');
    }
    expect(scripts.allowsScripts).not.toHaveBeenCalled();
  });

  it('does not treat a non-Macro document typed "script" as a macro', async () => {
    const { service, worldImporter } = importSetup({ name: 'Scroll', type: 'script' }, policy(false));
    await service.importDocument({ packId: 'world.items', documentId: 'i1' });
    expect(worldImporter.importedType).toBe('Item');
  });
});

class StoredPackContentWriter extends FakePackContentWriter {
  stored: Record<string, unknown> | null = null;
  readonly reads: string[] = [];

  readDocumentSource(packId: string, documentId: string): Promise<Readonly<Record<string, unknown>> | null> {
    this.reads.push(`${packId}/${documentId}`);
    return Promise.resolve(this.stored);
  }
}

function writingSetup(scripts?: ScriptMacroImportPolicy): {
  service: CompendiumWritingService;
  writer: StoredPackContentWriter;
} {
  const packs = new FakePackManager(packInfo({ id: 'world.items', type: 'Item' }));
  const writer = new StoredPackContentWriter();
  writer.documents.set('world.items/i1', documentRef({ id: 'i1', uuid: 'Compendium.world.items.Item.i1', name: 'Bow' }));
  return { service: new CompendiumWritingService({ packs, world: new FakeWorldDirectory(), writer, scripts }), writer };
}

describe('script carriers in update-compendium-document', () => {
  const carrierChanges = { 'flags.midi-qol.onUseMacroName': '[postActiveEffects]Boom' };

  it('refuses a carrier without the opt-in before writing', async () => {
    const { service, writer } = writingSetup(policy(false));
    await expect(
      service.updateDocument({ packId: 'world.items', documentId: 'i1', changes: carrierChanges })
    ).rejects.toThrow(
      'Script macros are disabled: flags.midi-qol.onUseMacroName makes Midi-QOL run a macro. ' +
        'Enable "Allow Script Macros" in module settings to write it via API.'
    );
    await expect(
      service.updateDocument({ packId: 'world.items', documentId: 'i1', changes: { system: { activities: { a: { macroData: { command: 'x' } } } } } })
    ).rejects.toThrow(ScriptCarrierRefusedError);
    expect(writer.updates).toEqual([]);
  });

  it('refuses dae.eval in the name as well', async () => {
    const { service } = writingSetup(policy(false));
    await expect(
      service.updateDocument({ packId: 'world.items', documentId: 'i1', name: '[[dae.eval(1)]]' })
    ).rejects.toThrow(ScriptCarrierRefusedError);
  });

  it('lets a carrier the pack document already holds with the same value through', async () => {
    const { service, writer } = writingSetup(policy(false));
    writer.stored = { name: 'Bow', flags: { 'midi-qol': { onUseMacroName: '[postActiveEffects]Boom' } } };
    await service.updateDocument({ packId: 'world.items', documentId: 'i1', name: 'Longbow', changes: carrierChanges });
    expect(writer.updates).toHaveLength(1);
    writer.stored = { name: 'Bow', flags: { 'midi-qol': { onUseMacroName: 'Other' } } };
    await expect(
      service.updateDocument({ packId: 'world.items', documentId: 'i1', changes: carrierChanges })
    ).rejects.toThrow(ScriptCarrierRefusedError);
  });

  it('writes a carrier with the opt-in', async () => {
    const { service, writer } = writingSetup(policy(true));
    await service.updateDocument({ packId: 'world.items', documentId: 'i1', changes: carrierChanges });
    expect(writer.updates).toHaveLength(1);
  });

  it('reads neither the stored document nor the opt-in for an ordinary write', async () => {
    const scripts = policy(false);
    const { service, writer } = writingSetup(scripts);
    await service.updateDocument({
      packId: 'world.items',
      documentId: 'i1',
      name: 'Longbow',
      changes: { 'flags.midi-qol.advantage.attack.all': '1', system: { damage: '1d8' } }
    });
    expect(writer.reads).toEqual([]);
    expect(scripts.allowsScripts).not.toHaveBeenCalled();
    expect(writer.updates).toHaveLength(1);
  });
});

describe('script macros in update-compendium-document', () => {
  function macroPackSetup(scripts?: ScriptMacroImportPolicy): { service: CompendiumWritingService; writer: StoredPackContentWriter } {
    const packs = new FakePackManager(packInfo({ id: 'world.macros', type: 'Macro' }));
    const writer = new StoredPackContentWriter();
    writer.documents.set('world.macros/m1', documentRef({ id: 'm1', uuid: 'Compendium.world.macros.Macro.m1', name: 'Roll' }));
    return { service: new CompendiumWritingService({ packs, world: new FakeWorldDirectory(), writer, scripts }), writer };
  }

  it('refuses turning a pack macro into a script macro or touching a stored one without the opt-in', async () => {
    const { service, writer } = macroPackSetup(policy(false));
    await expect(
      service.updateDocument({ packId: 'world.macros', documentId: 'm1', changes: { type: 'script', command: 'x' } })
    ).rejects.toThrow(ScriptMacroImportDisabledError);
    writer.stored = { name: 'Roll', type: 'script', command: 'return 1' };
    await expect(service.updateDocument({ packId: 'world.macros', documentId: 'm1', name: 'Renamed' })).rejects.toThrow(
      'Script macros are disabled. Enable "Allow Script Macros" in module settings to manage script-type macros via API.'
    );
    expect(writer.updates).toEqual([]);
  });

  it('edits a chat macro without the opt-in and a script macro with it', async () => {
    const off = macroPackSetup(policy(false));
    off.writer.stored = { name: 'Roll', type: 'chat', command: '/r 1d20' };
    await off.service.updateDocument({ packId: 'world.macros', documentId: 'm1', changes: { command: '/r 1d12' } });
    expect(off.writer.updates).toHaveLength(1);

    const on = macroPackSetup(policy(true));
    on.writer.stored = { name: 'Roll', type: 'script', command: 'return 1' };
    await on.service.updateDocument({ packId: 'world.macros', documentId: 'm1', changes: { command: 'return 2' } });
    expect(on.writer.updates).toHaveLength(1);
  });
});
