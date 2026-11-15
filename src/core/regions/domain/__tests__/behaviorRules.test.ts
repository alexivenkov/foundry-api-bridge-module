import { CoreFeatureUnavailableError } from '../../../shared';
import { ValidationError } from '../../../../kernel';
import {
  RegionMacroNotFoundError,
  ScriptBehaviorsDisabledError,
  ScriptMacroTargetDisabledError,
  UnregisteredBehaviorTypeError
} from '../errors';
import type { RegionBehavior } from '../model';
import type { RegionBehaviorCatalog } from '../ports/ports';
import {
  assertBehaviorConfigSupported,
  assertBehaviorTypeRegistered,
  assertMacroTargetAllowed,
  assertScriptBehaviorAllowed,
  macroTargetToCheck
} from '../rules/behaviorRules';

function catalog(overrides: Partial<{ types: string[] | null; events: string[] | null; actions: string[] | null; extended: boolean }> = {}): RegionBehaviorCatalog {
  const { types = ['pauseGame'], events = ['tokenEnter'], actions = ['walk'], extended = false } = overrides;
  return {
    registeredTypes: () => types,
    regionEvents: () => events,
    movementCostActions: () => actions,
    extendedTeleport: () => extended
  };
}

describe('behavior rules', () => {
  it('lists the registered types in the refusal', () => {
    expect(() => assertBehaviorTypeRegistered('nope', catalog({ types: ['a', 'b'] }))).toThrow(
      new UnregisteredBehaviorTypeError('nope', ['a', 'b'])
    );
    expect(new UnregisteredBehaviorTypeError('nope', ['a', 'b']).message).toBe(
      "Region behavior type 'nope' is not registered in this world (registered: a, b)"
    );
    expect(() => assertBehaviorTypeRegistered('anything', catalog({ types: null }))).not.toThrow();
  });

  it('asks the script policy only for executeScript', () => {
    const policy = { allowsScripts: jest.fn(() => false) };
    expect(() => assertScriptBehaviorAllowed('pauseGame', policy)).not.toThrow();
    expect(() => assertScriptBehaviorAllowed(undefined, policy)).not.toThrow();
    expect(policy.allowsScripts).not.toHaveBeenCalled();
    expect(() => assertScriptBehaviorAllowed('executeScript', policy)).toThrow(ScriptBehaviorsDisabledError);
    expect(new ScriptBehaviorsDisabledError().message).toMatch(/^Script macros are disabled\. Enable "Allow Script Macros"/);
  });

  it('checks events against the running core', () => {
    expect(() =>
      assertBehaviorConfigSupported({ kind: 'executeScript', settings: { events: ['tokenEnter', 'regionAnimation'] } }, catalog())
    ).toThrow(CoreFeatureUnavailableError);
    expect(() =>
      assertBehaviorConfigSupported({ kind: 'toggleBehavior', settings: { events: ['tokenEnter'] } }, catalog())
    ).not.toThrow();
    expect(() =>
      assertBehaviorConfigSupported({ kind: 'executeMacro', settings: { events: ['x'] } }, catalog({ events: null }))
    ).not.toThrow();
  });

  it('checks movement-cost actions against the schema', () => {
    expect(() =>
      assertBehaviorConfigSupported({ kind: 'modifyMovementCost', settings: { difficulties: { fly: 2 } } }, catalog())
    ).toThrow(ValidationError);
    expect(() =>
      assertBehaviorConfigSupported({ kind: 'modifyMovementCost', settings: { difficulties: { walk: null } } }, catalog())
    ).not.toThrow();
  });

  it('limits teleports before Foundry 14', () => {
    const settings = { destinationUuids: ['a', 'b'] };
    expect(() => assertBehaviorConfigSupported({ kind: 'teleportToken', settings }, catalog())).toThrow(
      'Teleporting to several destination regions requires Foundry 14 or newer'
    );
    expect(() =>
      assertBehaviorConfigSupported({ kind: 'teleportToken', settings: { snap: false, transition: {} } }, catalog())
    ).toThrow('Teleport option snap, transition requires Foundry 14 or newer');
    expect(() =>
      assertBehaviorConfigSupported({ kind: 'teleportToken', settings: { destinationUuids: ['a'], choice: true } }, catalog())
    ).not.toThrow();
    expect(() => assertBehaviorConfigSupported({ kind: 'teleportToken', settings }, catalog({ extended: true }))).not.toThrow();
  });

  it('leaves opaque configs to the core', () => {
    expect(() => assertBehaviorConfigSupported({ kind: 'opaque', data: { events: ['zzz'] } }, catalog())).not.toThrow();
  });
});

describe('executeMacro target rules', () => {
  const macroBehavior: RegionBehavior = {
    id: 'b',
    name: '',
    type: 'executeMacro',
    disabled: false,
    config: { kind: 'executeMacro', settings: { events: [], macroUuid: 'Macro.old', everyone: false } }
  };
  const pause: RegionBehavior = { id: 'p', name: '', type: 'pauseGame', disabled: false, config: { kind: 'pauseGame', settings: { once: false } } };
  const target = (macroUuid: string | null | undefined) =>
    ({ kind: 'executeMacro', settings: macroUuid === undefined ? {} : { macroUuid } }) as const;

  it('names the target of a new, switched or retargeted executeMacro behavior', () => {
    expect(macroTargetToCheck(undefined, 'executeMacro', target('Macro.new'))).toBe('Macro.new');
    expect(macroTargetToCheck(pause, 'executeMacro', target('Macro.new'))).toBe('Macro.new');
    expect(macroTargetToCheck(macroBehavior, 'executeMacro', target('Macro.new'))).toBe('Macro.new');
  });

  it('skips other types, no target and an unchanged target', () => {
    expect(macroTargetToCheck(undefined, 'pauseGame', { kind: 'pauseGame', settings: {} })).toBeNull();
    expect(macroTargetToCheck(undefined, 'executeMacro', target(null))).toBeNull();
    expect(macroTargetToCheck(pause, 'executeMacro', target(undefined))).toBeNull();
    expect(macroTargetToCheck(macroBehavior, 'executeMacro', undefined)).toBeNull();
    expect(macroTargetToCheck(macroBehavior, 'executeMacro', target(undefined))).toBeNull();
    expect(macroTargetToCheck(macroBehavior, 'executeMacro', target('Macro.old'))).toBeNull();
    expect(macroTargetToCheck(macroBehavior, 'executeMacro', target(null))).toBeNull();
  });

  it('refuses a missing macro and a script macro without consent', async () => {
    const macros = { findMacroType: (uuid: string) => Promise.resolve(({ 'Macro.c': 'chat', 'Macro.s': 'script' } as Record<string, string>)[uuid] ?? null) };
    const denied = { allowsScripts: () => false };
    await expect(assertMacroTargetAllowed('Macro.x', macros, denied)).rejects.toThrow(new RegionMacroNotFoundError('Macro.x'));
    await expect(assertMacroTargetAllowed('Macro.s', macros, denied)).rejects.toThrow(ScriptMacroTargetDisabledError);
    await expect(assertMacroTargetAllowed('Macro.c', macros, denied)).resolves.toBeUndefined();
    await expect(assertMacroTargetAllowed('Macro.s', macros, { allowsScripts: () => true })).resolves.toBeUndefined();
  });
});

