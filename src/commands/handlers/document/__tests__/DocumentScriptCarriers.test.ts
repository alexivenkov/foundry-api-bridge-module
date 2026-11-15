import type { FoundryDocument, FoundryDocumentClass } from '../../../../core/documents/infrastructure';
import { fakeDocument, fakeGlobals } from '../../../../core/documents/infrastructure/__tests__/fakeFoundry';
import type { DocumentHandlerDependencies } from '../GetDocumentOwnershipHandler';
import { createImportDocumentHandler } from '../ImportDocumentHandler';
import { createSetDocumentFlagHandler } from '../SetDocumentFlagHandler';

function world(allowsScripts: boolean): {
  deps: DocumentHandlerDependencies;
  sword: ReturnType<typeof fakeDocument>;
  itemClass: jest.Mocked<FoundryDocumentClass>;
} {
  const sword = fakeDocument({
    uuid: 'Item.sw',
    documentName: 'Item',
    name: 'Sword',
    source: { name: 'Sword', type: 'weapon', folder: null, flags: { 'midi-qol': { onUseMacroName: 'Kept' } } }
  });
  const created = fakeDocument({ uuid: 'Item.new', documentName: 'Item', name: 'Imported', source: { folder: null } });
  const itemClass: jest.Mocked<FoundryDocumentClass> = {
    fromImport: jest.fn((source: Record<string, unknown>) =>
      Promise.resolve(fakeDocument({ uuid: 'Item.tmp', documentName: 'Item', source }))
    ),
    fromSource: jest.fn(),
    create: jest.fn((_data: Record<string, unknown>) => Promise.resolve<FoundryDocument | null | undefined>(created))
  };
  const globals = fakeGlobals({
    documents: [sword],
    collections: { Item: [sword] },
    documentClasses: { Item: itemClass },
    flagScopes: ['core', 'world', 'dnd5e', 'midi-qol', 'dae', 'itemacro']
  });
  return { deps: { globals: () => globals, scripts: { allowsScripts: () => allowsScripts }, generation: () => 14 }, sword, itemClass };
}

describe('document handlers — data that automation modules run', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('set-document-flag refuses a carrier without the opt-in and writes it with the opt-in', async () => {
    const off = world(false);
    await expect(
      createSetDocumentFlagHandler(off.deps)({ uuid: 'Item.sw', scope: 'midi-qol', key: 'onUseMacroName', value: 'Boom' })
    ).rejects.toThrow(
      'Script macros are disabled: flags.midi-qol.onUseMacroName makes Midi-QOL run a macro. ' +
        'Enable "Allow Script Macros" in module settings to write it via API.'
    );
    expect(off.sword.setFlag).not.toHaveBeenCalled();

    const on = world(true);
    await createSetDocumentFlagHandler(on.deps)({ uuid: 'Item.sw', scope: 'midi-qol', key: 'onUseMacroName', value: 'Boom' });
    expect(on.sword.setFlag).toHaveBeenCalledWith('midi-qol', 'onUseMacroName', 'Boom');
  });

  it('set-document-flag writes ordinary automation and the stored carrier unchanged without the opt-in', async () => {
    const { deps, sword } = world(false);
    const setFlag = createSetDocumentFlagHandler(deps);

    await setFlag({ uuid: 'Item.sw', scope: 'midi-qol', key: 'advantage.attack.all', value: '1' });
    await setFlag({ uuid: 'Item.sw', scope: 'midi-qol', key: 'onUseMacroName', value: 'Kept' });

    expect(sword.setFlag).toHaveBeenCalledTimes(2);
  });

  it('import-document refuses data with a carrier without the opt-in and imports it with the opt-in', async () => {
    const data = { name: 'Imported', type: 'weapon', system: { activities: { a1: { useConditionText: 'target.x' } } } };

    const off = world(false);
    await expect(createImportDocumentHandler(off.deps)({ documentType: 'Item', data })).rejects.toThrow(
      'Script macros are disabled: system.activities.a1.useConditionText makes Midi-QOL run JavaScript.'
    );
    expect(off.itemClass.create).not.toHaveBeenCalled();

    const on = world(true);
    await expect(createImportDocumentHandler(on.deps)({ documentType: 'Item', data })).resolves.toMatchObject({ uuid: 'Item.new' });
  });
});
