import { ScriptCarrierRefusedError } from '../../../../kernel';
import type { FlaggedDocument } from '../../domain';
import { DocumentFlagService } from '../DocumentFlagService';
import { DocumentTransferService } from '../DocumentTransferService';
import { FakeExporter, FakeFlagStore, FakeImporter, ref, scriptPolicy } from './fakePorts';

const sword: FlaggedDocument = {
  document: ref({ uuid: 'Item.s1', documentType: 'Item', id: 's1', name: 'Sword' }),
  flags: { 'midi-qol': { onUseMacroName: '[postActiveEffects]ItemMacro' }, world: { quest: 'x' } }
};

function flagService(allows: boolean | undefined): { store: FakeFlagStore; service: DocumentFlagService } {
  const store = new FakeFlagStore([sword], ['core', 'world', 'dnd5e', 'midi-qol', 'itemacro', 'dae']);
  const scripts = allows === undefined ? undefined : scriptPolicy(allows);
  return { store, service: new DocumentFlagService({ documents: store, scripts }) };
}

describe('DocumentFlagService — flags that automation modules run', () => {
  it('refuses a carrier without the opt-in before writing', async () => {
    const { store, service } = flagService(false);

    await expect(
      service.setFlag({ uuid: 'Item.s1', scope: 'itemacro', key: 'macro', value: { command: 'return 1' } })
    ).rejects.toThrow(
      'Script macros are disabled: flags.itemacro.macro.command makes Item Macro run a macro. ' +
        'Enable "Allow Script Macros" in module settings to write it via API.'
    );
    await expect(
      service.setFlag({ uuid: 'Item.s1', scope: 'midi-qol', key: 'advantage.attack.all', value: 'target.x' })
    ).rejects.toThrow(ScriptCarrierRefusedError);
    expect(store.setCalls).toEqual([]);
  });

  it('refuses without a policy at all', async () => {
    const { service } = flagService(undefined);

    await expect(service.setFlag({ uuid: 'Item.s1', scope: 'dae', key: 'macro.command', value: 'x' })).rejects.toThrow(
      'Script macros are disabled: flags.dae.macro.command makes DAE run a macro.'
    );
  });

  it('writes a carrier with the opt-in', async () => {
    const { store, service } = flagService(true);

    await service.setFlag({ uuid: 'Item.s1', scope: 'midi-qol', key: 'onUseMacroName', value: 'Boom' });

    expect(store.setCalls).toEqual([{ uuid: 'Item.s1', scope: 'midi-qol', key: 'onUseMacroName', value: 'Boom' }]);
  });

  it('writes ordinary flags and a stored carrier kept as it is without the opt-in', async () => {
    const { store, service } = flagService(false);

    await service.setFlag({ uuid: 'Item.s1', scope: 'midi-qol', key: 'advantage.attack.all', value: '1' });
    await service.setFlag({ uuid: 'Item.s1', scope: 'world', key: 'quest', value: 'done' });
    await service.setFlag({
      uuid: 'Item.s1',
      scope: 'midi-qol',
      key: 'onUseMacroName',
      value: '[postActiveEffects]ItemMacro'
    });

    expect(store.setCalls).toHaveLength(3);
  });

  it('refuses a stored carrier changed to another value', async () => {
    const { service } = flagService(false);

    await expect(
      service.setFlag({ uuid: 'Item.s1', scope: 'midi-qol', key: 'onUseMacroName', value: 'Other' })
    ).rejects.toThrow('Script macros are disabled: flags.midi-qol.onUseMacroName makes Midi-QOL run a macro.');
  });
});

describe('DocumentTransferService — imported data that automation modules run', () => {
  function transferService(allows: boolean): { importer: FakeImporter; service: DocumentTransferService } {
    const importer = new FakeImporter();
    return { importer, service: new DocumentTransferService({ exporter: new FakeExporter([]), importer, scripts: scriptPolicy(allows) }) };
  }

  const actorData = {
    name: 'Goblin',
    type: 'npc',
    items: [{ name: 'Club', type: 'weapon', effects: [{ name: 'Rage', changes: [{ key: 'macro.execute', value: 'Rage', mode: 0 }] }] }]
  };

  it('refuses a carrier anywhere in the data without the opt-in', async () => {
    const { importer, service } = transferService(false);

    await expect(service.importDocument({ documentType: 'Actor', data: actorData, folderId: undefined })).rejects.toThrow(
      'Script macros are disabled: items.0.effects.0.changes.0 (macro.execute) makes DAE run a macro.'
    );
    await expect(
      service.importDocument({ documentType: 'Macro', data: { name: 'm', type: 'chat', flags: { itemacro: { macro: { command: 'x' } } } }, folderId: undefined })
    ).rejects.toThrow('Script macros are disabled: flags.itemacro.macro.command makes Item Macro run a macro.');
    expect(importer.imported).toEqual([]);
  });

  it('imports carriers with the opt-in and ordinary data without it', async () => {
    const allowed = transferService(true);
    await allowed.service.importDocument({ documentType: 'Actor', data: actorData, folderId: undefined });
    expect(allowed.importer.imported).toHaveLength(1);

    const plain = transferService(false);
    await plain.service.importDocument({ documentType: 'Item', data: { name: 'Club', type: 'weapon', flags: { 'midi-qol': { advantage: { all: true } } } }, folderId: undefined });
    expect(plain.importer.imported).toHaveLength(1);
  });
});
