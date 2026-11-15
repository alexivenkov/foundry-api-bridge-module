import { MacroCreationCancelledError, MacroNotFoundError, ScriptMacrosDisabledError } from '../../domain';
import { MacroService } from '../MacroService';
import { FakeMacroStore, FakeScriptPolicy, macro } from './fakePorts';

function setup(options: { allowed?: boolean; store?: FakeMacroStore } = {}): {
  service: MacroService;
  store: FakeMacroStore;
  scripts: FakeScriptPolicy;
} {
  const store =
    options.store ??
    new FakeMacroStore([
      macro({ id: 'hello', name: 'Hello', type: 'chat' }),
      macro({ id: 'strike', name: 'Strike', type: 'script', command: 'return 1' }),
      macro({ id: 'bye', name: 'Bye', type: 'chat' })
    ]);
  const scripts = new FakeScriptPolicy(options.allowed ?? false);
  return { service: new MacroService({ macros: store, scripts }), store, scripts };
}

describe('MacroService', () => {
  describe('listMacros', () => {
    it('lists every macro when no type is asked for', () => {
      expect(setup().service.listMacros({ type: undefined }).map((m) => m.id)).toEqual(['hello', 'strike', 'bye']);
    });

    it('keeps the macros of the asked type, in directory order', () => {
      const { service } = setup();

      expect(service.listMacros({ type: 'chat' }).map((m) => m.id)).toEqual(['hello', 'bye']);
      expect(service.listMacros({ type: 'script' }).map((m) => m.id)).toEqual(['strike']);
    });

    it('lists nothing for a type no macro has', () => {
      expect(setup().service.listMacros({ type: 'dance' })).toEqual([]);
      expect(setup().service.listMacros({ type: '' })).toEqual([]);
    });

    it('lists script macros without asking for the script permission', () => {
      const { service, scripts } = setup({ allowed: false });

      expect(service.listMacros({ type: undefined })).toHaveLength(3);
      expect(scripts.asked).toBe(0);
    });
  });

  describe('getMacro', () => {
    it('returns the macro, a script one included, without the script permission', () => {
      const { service, scripts } = setup({ allowed: false });

      expect(service.getMacro({ macroId: 'strike' })).toMatchObject({ id: 'strike', command: 'return 1' });
      expect(scripts.asked).toBe(0);
    });

    it('rejects an unknown macro', () => {
      const act = (): void => {
        setup().service.getMacro({ macroId: 'missing' });
      };

      expect(act).toThrow(MacroNotFoundError);
      expect(act).toThrow('Macro not found: missing');
    });
  });

  describe('createMacro', () => {
    it('creates a chat macro whatever the script permission says, without asking', async () => {
      const { service, store, scripts } = setup({ allowed: false });
      const draft = { name: 'Roll', type: 'chat' as const, command: '/r 1d6' };

      const created = await service.createMacro({ draft });

      expect(store.created).toEqual([draft]);
      expect(created.name).toBe('Roll');
      expect(scripts.asked).toBe(0);
    });

    it('creates a macro of unstated type without asking: the core makes it a chat macro', async () => {
      const { service, store, scripts } = setup({ allowed: false });

      await service.createMacro({ draft: { name: 'Bare' } });

      expect(store.created).toEqual([{ name: 'Bare' }]);
      expect(scripts.asked).toBe(0);
    });

    it('refuses a script macro while script macros are disabled, creating nothing', async () => {
      const { service, store } = setup({ allowed: false });

      await expect(service.createMacro({ draft: { name: 'Evil', type: 'script', command: 'x()' } }))
        .rejects.toThrow(ScriptMacrosDisabledError);
      expect(store.created).toEqual([]);
    });

    it('creates a script macro once script macros are allowed', async () => {
      const { service, store } = setup({ allowed: true });

      const created = await service.createMacro({ draft: { name: 'Fine', type: 'script', command: 'x()' } });

      expect(store.created).toHaveLength(1);
      expect(created.type).toBe('script');
    });

    it('reports a creation the core cancelled', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      await expect(service.createMacro({ draft: { name: 'Vetoed' } })).rejects.toThrow(MacroCreationCancelledError);
    });
  });

  describe('updateMacro', () => {
    it('changes a chat macro without asking for the script permission', async () => {
      const { service, store, scripts } = setup({ allowed: false });

      const updated = await service.updateMacro({ macroId: 'hello', changes: { name: 'Hi' } });

      expect(store.updated).toEqual([{ macroId: 'hello', changes: { name: 'Hi' } }]);
      expect(updated.name).toBe('Hi');
      expect(scripts.asked).toBe(0);
    });

    it('passes an empty change set on: the core decides it is a no-op', async () => {
      const { service, store } = setup();

      await service.updateMacro({ macroId: 'hello', changes: {} });

      expect(store.updated).toEqual([{ macroId: 'hello', changes: {} }]);
    });

    it.each([
      ['a script macro, even only to rename it', 'strike', { name: 'Slash' }],
      ['a script macro on its way to becoming a chat macro', 'strike', { type: 'chat' as const }],
      ['a chat macro on its way to becoming a script', 'hello', { type: 'script' as const }]
    ])('refuses to change %s while script macros are disabled', async (_case, macroId, changes) => {
      const { service, store } = setup({ allowed: false });

      await expect(service.updateMacro({ macroId, changes })).rejects.toThrow(ScriptMacrosDisabledError);
      expect(store.updated).toEqual([]);
    });

    it('changes script macros in either direction once they are allowed', async () => {
      const { service, store } = setup({ allowed: true });

      await service.updateMacro({ macroId: 'strike', changes: { type: 'chat' } });
      await service.updateMacro({ macroId: 'hello', changes: { type: 'script' } });

      expect(store.updated.map((u) => u.macroId)).toEqual(['strike', 'hello']);
    });

    it('looks the macro up before the permission: an unknown macro is unknown either way', async () => {
      const { service, scripts } = setup({ allowed: false });

      await expect(service.updateMacro({ macroId: 'missing', changes: { type: 'script' } }))
        .rejects.toThrow('Macro not found: missing');
      expect(scripts.asked).toBe(0);
    });

    it('reports the macro as missing when it vanished during the update', async () => {
      const { service, store } = setup();
      store.losesMacroOnUpdate = true;

      await expect(service.updateMacro({ macroId: 'hello', changes: { name: 'Hi' } }))
        .rejects.toThrow(MacroNotFoundError);
    });
  });

  describe('deleteMacro', () => {
    it('deletes a script macro without the script permission: deleting runs nothing', async () => {
      const { service, store, scripts } = setup({ allowed: false });

      await service.deleteMacro({ macroId: 'strike' });

      expect(store.deleted).toEqual(['strike']);
      expect(scripts.asked).toBe(0);
    });

    it('rejects an unknown macro without deleting anything', async () => {
      const { service, store } = setup();

      await expect(service.deleteMacro({ macroId: 'missing' })).rejects.toThrow('Macro not found: missing');
      expect(store.deleted).toEqual([]);
    });
  });
});
