import {
  InvalidSettingValueError,
  SettingValueNotRepresentableError,
  SettingWriteFailedError,
  type SettingDefinition,
  type SettingRegistry
} from '@/core/settings/domain';
import { coreErrorText, isCoreValidationError } from './coreErrorText';
import type { FoundrySettingConfig, FoundrySettingsGlobals, SettingGlobalsProvider } from './foundrySettingTypes';
import { toPlainJson } from './plainJson';
import { toSettingDefinition } from './settingMapper';

const fromGlobalThis: SettingGlobalsProvider = () => globalThis as unknown as FoundrySettingsGlobals;

function isWellFormed(config: FoundrySettingConfig): boolean {
  return typeof config.namespace === 'string' && typeof config.key === 'string';
}

/** Anti-corruption layer over `game.settings` (`ClientSettings`). */
export class FoundrySettingRegistry implements SettingRegistry {
  constructor(private readonly globals: SettingGlobalsProvider = fromGlobalThis) {}

  listDefinitions(): readonly SettingDefinition[] {
    const globals = this.globals();
    return Array.from(globals.game.settings.settings.values())
      .filter(isWellFormed)
      .map((config) => toSettingDefinition(config, globals));
  }

  findDefinition(namespace: string, key: string): SettingDefinition | null {
    const globals = this.globals();
    const config = globals.game.settings.settings.get(`${namespace}.${key}`);
    return config !== undefined && isWellFormed(config) ? toSettingDefinition(config, globals) : null;
  }

  readValue(definition: SettingDefinition): unknown {
    const value = this.globals().game.settings.get(definition.namespace, definition.key);
    try {
      return toPlainJson(value);
    } catch {
      throw new SettingValueNotRepresentableError(definition.id);
    }
  }

  async writeValue(definition: SettingDefinition, value: unknown): Promise<void> {
    const globals = this.globals();
    try {
      await globals.game.settings.set(definition.namespace, definition.key, value);
    } catch (error) {
      const reason = coreErrorText(error);
      throw isCoreValidationError(error, globals.foundry)
        ? new InvalidSettingValueError(definition.id, reason)
        : new SettingWriteFailedError(definition.id, reason);
    }
  }
}
