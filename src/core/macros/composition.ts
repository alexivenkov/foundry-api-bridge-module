import { HotbarService, MacroExecutionService, MacroService } from './application';
import type { ScriptMacroPolicy } from './domain';
import {
  FoundryHotbarStore,
  FoundryMacroRunner,
  FoundryMacroStore,
  moduleSettingScriptMacroPolicy,
  type HotbarGlobalsProvider,
  type MacroGlobalsProvider
} from './infrastructure';

export interface MacroWiring {
  readonly globals?: MacroGlobalsProvider;
  readonly scripts?: ScriptMacroPolicy;
}

export const defaultScriptMacroPolicy: ScriptMacroPolicy = moduleSettingScriptMacroPolicy;

// Composition root of the context. Handlers pass custom wiring only in tests.

export function createFoundryMacroService(wiring: MacroWiring = {}): MacroService {
  return new MacroService({
    macros: new FoundryMacroStore(wiring.globals),
    scripts: wiring.scripts ?? defaultScriptMacroPolicy
  });
}

export interface HotbarWiring {
  readonly globals?: HotbarGlobalsProvider;
}

/** Assigning a slot runs nothing, so the script-macro policy is not involved. */
export function createFoundryHotbarService(wiring: HotbarWiring = {}): HotbarService {
  return new HotbarService({ hotbars: new FoundryHotbarStore(wiring.globals) });
}

export function createFoundryMacroExecutionService(wiring: MacroWiring = {}): MacroExecutionService {
  return new MacroExecutionService({
    macros: new FoundryMacroStore(wiring.globals),
    scripts: wiring.scripts ?? defaultScriptMacroPolicy,
    runner: new FoundryMacroRunner(wiring.globals)
  });
}
