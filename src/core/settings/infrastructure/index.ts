export { FoundrySettingRegistry } from './FoundrySettingRegistry';
export { MODULE_NAMESPACE } from './moduleNamespace';
export { toSettingDefinition } from './settingMapper';
export { classifySettingType } from './settingTypeClassifier';
export type { SettingTypeTraits } from './settingTypeClassifier';
export { toPlainJson, toPlainJsonOrNull } from './plainJson';
export { coreErrorText, isCoreValidationError } from './coreErrorText';
export type {
  FoundryClass,
  FoundryClientSettings,
  FoundryDataFieldLike,
  FoundryFieldClasses,
  FoundrySettingConfig,
  FoundrySettingsGame,
  FoundrySettingsGlobals,
  SettingGlobalsProvider
} from './foundrySettingTypes';
