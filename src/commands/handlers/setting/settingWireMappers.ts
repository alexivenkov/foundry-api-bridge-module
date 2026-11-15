import type { SetSettingResult, SettingDetails, SettingSummary } from '@/commands/types';
import type { SettingChangeResult, SettingEntry, SettingValueEntry } from '@/core/settings';

export function toWireSettingSummary({ definition, access }: SettingEntry): SettingSummary {
  return {
    id: definition.id,
    namespace: definition.namespace,
    key: definition.key,
    name: definition.name,
    hint: definition.hint,
    scope: definition.scope,
    config: definition.config,
    valueType: definition.valueType,
    choices: definition.choices !== null ? definition.choices.map((choice) => ({ ...choice })) : null,
    range: definition.range !== null ? { ...definition.range } : null,
    nullable: definition.acceptsNull,
    requiresReload: definition.requiresReload,
    access
  };
}

export function toWireSettingDetails(entry: SettingValueEntry): SettingDetails {
  return { ...toWireSettingSummary(entry), value: entry.value, default: entry.definition.defaultValue };
}

export function toWireSettingChange(result: SettingChangeResult): SetSettingResult {
  return { ...toWireSettingDetails(result), previousValue: result.previousValue, changed: result.changed };
}
