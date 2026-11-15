import { SETTING_SCOPES, type SettingDefinition, type SettingScope } from '@/core/settings/domain';
import type { FoundrySettingConfig, FoundrySettingsGlobals } from './foundrySettingTypes';
import { toPlainJsonOrNull } from './plainJson';
import { classifySettingType } from './settingTypeClassifier';

// `register` falls back to `client` for a scope it does not know.
function toScope(scope: unknown): SettingScope {
  return SETTING_SCOPES.find((known) => known === scope) ?? 'client';
}

function localizer(globals: FoundrySettingsGlobals): (text: unknown) => string | null {
  const i18n = globals.game.i18n;
  return (text) => {
    if (typeof text !== 'string' || text === '') {
      return null;
    }
    return i18n !== undefined ? i18n.localize(text) : text;
  };
}

export function toSettingDefinition(config: FoundrySettingConfig, globals: FoundrySettingsGlobals): SettingDefinition {
  const localize = localizer(globals);
  const traits = classifySettingType(config, globals.foundry);
  return {
    id: `${config.namespace}.${config.key}`,
    namespace: config.namespace,
    key: config.key,
    name: localize(config.name) ?? localize(traits.label),
    hint: localize(config.hint),
    scope: toScope(config.scope),
    config: config.config === true,
    valueType: traits.valueType,
    choices: traits.choices?.map((choice) => ({ value: choice.value, label: localize(choice.label) ?? choice.label })) ?? null,
    range: traits.range,
    acceptsNull: traits.acceptsNull,
    requiresReload: config.requiresReload === true,
    defaultValue: toPlainJsonOrNull(config.default)
  };
}
