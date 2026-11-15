import { createImportFromCompendiumHandler } from '../ImportFromCompendiumHandler';

function setupMacroPack(source: Record<string, unknown>): jest.Mock {
  const doc = { id: 'm2', uuid: 'Compendium.world.macros.Macro.m2', name: 'Fireworks', toObject: () => ({ ...source }) };
  const pack = { metadata: { type: 'Macro', label: 'Macros' }, getDocument: jest.fn().mockResolvedValue(doc) };
  (globalThis as Record<string, unknown>)['game'] = { packs: { get: () => pack } };
  const create = jest.fn().mockResolvedValue({ id: 'wm2', uuid: 'Macro.wm2', name: 'Fireworks' });
  (globalThis as Record<string, unknown>)['Macro'] = { create };
  return create;
}

describe('import-from-compendium and script macros', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
    delete (globalThis as Record<string, unknown>)['Macro'];
  });

  it('refuses a script macro without the opt-in, with the script-macro text', async () => {
    const create = setupMacroPack({ _id: 'm2', name: 'Fireworks', type: 'script', command: 'game.togglePause()' });
    const handler = createImportFromCompendiumHandler({ scripts: { allowsScripts: () => false } });
    await expect(handler({ packId: 'world.macros', documentId: 'm2' })).rejects.toThrow(
      'Script macros are disabled. Enable "Allow Script Macros" in module settings to manage script-type macros via API.'
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('imports a script macro with the opt-in', async () => {
    const create = setupMacroPack({ _id: 'm2', name: 'Fireworks', type: 'script', command: 'game.togglePause()' });
    const handler = createImportFromCompendiumHandler({ scripts: { allowsScripts: () => true } });
    expect(await handler({ packId: 'world.macros', documentId: 'm2' })).toEqual({
      imported: true,
      worldId: 'wm2',
      uuid: 'Macro.wm2',
      name: 'Fireworks',
      documentType: 'Macro'
    });
    expect(create).toHaveBeenCalledWith({ name: 'Fireworks', type: 'script', command: 'game.togglePause()' });
  });

  it('imports a chat macro without asking for the opt-in', async () => {
    setupMacroPack({ _id: 'm1', name: 'Say', type: 'chat', command: 'Hello' });
    const allowsScripts = jest.fn(() => false);
    const result = await createImportFromCompendiumHandler({ scripts: { allowsScripts } })({ packId: 'world.macros', documentId: 'm1' });
    expect(result.documentType).toBe('Macro');
    expect(allowsScripts).not.toHaveBeenCalled();
  });
});
