import type { SettingDefinition } from '@/core/settings/domain/model/Setting';

export interface SettingRegistry {
  listDefinitions(): readonly SettingDefinition[];
  findDefinition(namespace: string, key: string): SettingDefinition | null;
  /** The current value as plain JSON; for a `user` setting, the value of the user the module runs as. */
  readValue(definition: SettingDefinition): unknown;
  /** Rejects with `InvalidSettingValueError` when the core refuses the value. */
  writeValue(definition: SettingDefinition, value: unknown): Promise<void>;
}
