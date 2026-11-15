import { FoundryRegionMacroResolver } from '../FoundryRegionMacroResolver';
import type { FoundryRegionGlobals } from '../foundryRegionBehaviorTypes';

describe('FoundryRegionMacroResolver', () => {
  it('resolves through foundry.utils.fromUuid, compendium UUIDs included', async () => {
    const fromUuid = jest.fn((uuid: string) =>
      Promise.resolve(uuid.startsWith('Compendium.') ? { documentName: 'Macro', type: 'script' } : { documentName: 'Macro', type: 'chat' })
    );
    const resolver = new FoundryRegionMacroResolver(() => ({ foundry: { utils: { fromUuid } } }));

    await expect(resolver.findMacroType('Macro.aaaaaaaaaaaaaaaa')).resolves.toBe('chat');
    await expect(resolver.findMacroType('Compendium.world.macros.Macro.aaaaaaaaaaaaaaaa')).resolves.toBe('script');
    expect(fromUuid).toHaveBeenCalledWith('Compendium.world.macros.Macro.aaaaaaaaaaaaaaaa');
  });

  it('falls back to the global fromUuid', async () => {
    const globals: FoundryRegionGlobals = { fromUuid: () => Promise.resolve({ documentName: 'Macro', type: 'script' }) };
    await expect(new FoundryRegionMacroResolver(() => globals).findMacroType('Macro.x')).resolves.toBe('script');
  });

  it('answers null for no document, another document, a failed lookup or no resolver', async () => {
    const answer = (value: unknown): FoundryRegionMacroResolver =>
      new FoundryRegionMacroResolver(() => ({ foundry: { utils: { fromUuid: () => Promise.resolve(value) } } }));
    await expect(answer(null).findMacroType('Macro.x')).resolves.toBeNull();
    await expect(answer({ documentName: 'Actor', type: 'character' }).findMacroType('Macro.x')).resolves.toBeNull();
    const failing = new FoundryRegionMacroResolver(() => ({
      foundry: { utils: { fromUuid: () => Promise.reject(new Error('pack missing')) } }
    }));
    await expect(failing.findMacroType('Compendium.gone.pack.Macro.x')).resolves.toBeNull();
    await expect(new FoundryRegionMacroResolver(() => ({})).findMacroType('Macro.x')).resolves.toBeNull();
  });
});
