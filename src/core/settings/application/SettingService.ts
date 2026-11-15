import {
  SettingNotFoundError,
  checkSettingValue,
  requireAddressableSetting,
  requireReadableValue,
  requireWritableValue,
  sameSettingValue,
  settingAccess,
  type SettingDefinition,
  type SettingEntry,
  type SettingRegistry,
  type SettingValueEntry
} from '@/core/settings/domain';
import type { GetSettingQuery, ListSettingsQuery, SetSettingCommand, SettingChangeResult } from './commands';

export interface SettingServiceDependencies {
  readonly settings: SettingRegistry;
  /** The namespace of the module itself, kept out of the API entirely. */
  readonly protectedNamespace: string;
}

/**
 * Lists, reads and writes registered game settings, inside the limits of the
 * access rules. It never triggers a reload, even when a setting asks for one.
 */
export class SettingService {
  constructor(private readonly deps: SettingServiceDependencies) {}

  listSettings(query: ListSettingsQuery): readonly SettingEntry[] {
    return this.deps.settings
      .listDefinitions()
      .filter((definition) => definition.namespace !== this.deps.protectedNamespace)
      .filter((definition) => query.namespace === undefined || definition.namespace === query.namespace)
      .filter((definition) => query.scope === undefined || definition.scope === query.scope)
      .map((definition) => ({ definition, access: settingAccess(definition) }));
  }

  getSetting(query: GetSettingQuery): SettingValueEntry {
    const definition = this.requireDefinition(query.namespace, query.key);
    const value = this.deps.settings.readValue(definition);
    requireReadableValue(definition, value);
    return { definition, access: settingAccess(definition), value };
  }

  async setSetting(command: SetSettingCommand): Promise<SettingChangeResult> {
    const { settings } = this.deps;
    const definition = this.requireDefinition(command.namespace, command.key);
    const previousValue = settings.readValue(definition);
    requireWritableValue(definition, previousValue, command.value);
    checkSettingValue(definition, command.value);

    await settings.writeValue(definition, command.value);
    const value = settings.readValue(definition);
    return {
      definition,
      access: settingAccess(definition),
      value,
      previousValue,
      changed: !sameSettingValue(previousValue, value)
    };
  }

  private requireDefinition(namespace: string, key: string): SettingDefinition {
    requireAddressableSetting(namespace, key, this.deps.protectedNamespace);
    const definition = this.deps.settings.findDefinition(namespace, key);
    if (definition === null) {
      throw new SettingNotFoundError(`${namespace}.${key}`);
    }
    return definition;
  }
}
