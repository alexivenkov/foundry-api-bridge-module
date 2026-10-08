import { Dnd5eActivationDialogGateway, classifyDialog } from '../Dnd5eActivationDialogGateway';

function appOf(...chain: string[]): unknown {
  // Build a prototype chain whose constructors carry the given names, most specific first.
  let ctor: ((...args: never[]) => unknown) | undefined;
  for (const name of [...chain].reverse()) {
    const parent = ctor;
    const cls = { [name]: class {} }[name] as unknown as (...args: never[]) => unknown;
    if (parent) Object.setPrototypeOf(cls, parent);
    ctor = cls;
  }
  return { constructor: ctor };
}

describe('classifyDialog', () => {
  it('names dnd5e attack, damage and usage dialogs by their class chain', () => {
    expect(classifyDialog(appOf('AttackRollConfigurationDialog', 'D20RollConfigurationDialog', 'RollConfigurationDialog', 'Dialog5e', 'ApplicationV2'))).toBe('attack-roll');
    expect(classifyDialog(appOf('DamageRollConfigurationDialog', 'RollConfigurationDialog', 'Dialog5e', 'ApplicationV2'))).toBe('damage');
    expect(classifyDialog(appOf('MidiActivityUsageDialog', 'ActivityUsageDialog', 'Dialog5e', 'ApplicationV2'))).toBe('consume');
  });

  it('reports any other dialog as other and ignores non-dialog windows', () => {
    expect(classifyDialog(appOf('TargetConfirmationDialog', 'ApplicationV2'))).toBe('other');
    expect(classifyDialog(appOf('MidiRollChoiceDialog', 'D20RollConfigurationDialog', 'RollConfigurationDialog', 'Dialog5e', 'ApplicationV2'))).toBe('other');
    expect(classifyDialog(appOf('DialogV2', 'ApplicationV2'))).toBe('other');
    expect(classifyDialog(appOf('Dialog', 'Application'))).toBe('other');
    expect(classifyDialog(appOf('ActorSheet5eCharacter2', 'ActorSheet5e', 'Application5e', 'ApplicationV2'))).toBeUndefined();
    expect(classifyDialog(appOf('ChatLog', 'ApplicationV2'))).toBeUndefined();
    expect(classifyDialog(null)).toBeUndefined();
  });
});

describe('Dnd5eActivationDialogGateway', () => {
  const listeners = new Map<number, { hook: string; cb: (app: unknown) => void }>();
  let next = 1;
  const hooks = {
    on: jest.fn((hook: string, cb: (app: unknown) => void) => {
      listeners.set(next, { hook, cb });
      return next++;
    }),
    once: jest.fn(),
    off: jest.fn((_hook: string, id: number) => {
      listeners.delete(id);
    })
  };

  beforeEach(() => {
    jest.clearAllMocks();
    listeners.clear();
    (globalThis as Record<string, unknown>)['Hooks'] = hooks;
  });

  it('resolves on the first dialog render, skipping sheets, and cancel() removes both hooks', async () => {
    const watch = new Dnd5eActivationDialogGateway().watch();
    expect(hooks.on).toHaveBeenCalledWith('renderApplicationV2', expect.any(Function));
    expect(hooks.on).toHaveBeenCalledWith('renderDialog', expect.any(Function));

    const render = [...listeners.values()].find((l) => l.hook === 'renderApplicationV2');
    render?.cb(appOf('ActorSheet5eCharacter2', 'Application5e', 'ApplicationV2'));
    render?.cb(appOf('AttackRollConfigurationDialog', 'Dialog5e', 'ApplicationV2'));

    expect(await watch.awaitDialog()).toBe('attack-roll');
    watch.cancel();
    expect(listeners.size).toBe(0);
  });
});
