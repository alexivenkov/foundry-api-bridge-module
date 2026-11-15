import { ScriptCarrierRefusedError } from '../../../../kernel';
import { MacroService } from '../MacroService';
import { FakeMacroStore, FakeScriptPolicy, macro } from './fakePorts';

function setup(allowed: boolean): { service: MacroService; store: FakeMacroStore } {
  const store = new FakeMacroStore([
    macro({ id: 'hello', name: 'Hello', type: 'chat', command: '/r 1d20 + [[dae.eval(1)]]' }),
    macro({ id: 'plain', name: 'Plain', type: 'chat', command: '/r 1d20' })
  ]);
  return { service: new MacroService({ macros: store, scripts: new FakeScriptPolicy(allowed) }), store };
}

describe('MacroService — chat macros whose rolls DAE evaluates', () => {
  it('refuses dae.eval in a chat macro command without the opt-in', async () => {
    const { service, store } = setup(false);

    await expect(
      service.createMacro({ draft: { name: 'Sneaky', type: 'chat', command: '/r dae.eval(globalThis.x)' } })
    ).rejects.toThrow('Script macros are disabled: command makes DAE run JavaScript.');
    await expect(
      service.updateMacro({ macroId: 'plain', changes: { command: '/r [[dae.eval(1)]]' } })
    ).rejects.toThrow(ScriptCarrierRefusedError);
    expect(store.created).toEqual([]);
    expect(store.updated).toEqual([]);
  });

  it('keeps a stored command editable and writes it with the opt-in', async () => {
    const off = setup(false);
    await off.service.updateMacro({ macroId: 'hello', changes: { name: 'Hi', command: '/r 1d20 + [[dae.eval(1)]]' } });
    await off.service.createMacro({ draft: { name: 'Roll', type: 'chat', command: '/r 1d20' } });
    expect(off.store.updated).toHaveLength(1);
    expect(off.store.created).toHaveLength(1);

    const on = setup(true);
    await on.service.createMacro({ draft: { name: 'Sneaky', type: 'chat', command: '/r dae.eval(1)' } });
    expect(on.store.created).toHaveLength(1);
  });
});
