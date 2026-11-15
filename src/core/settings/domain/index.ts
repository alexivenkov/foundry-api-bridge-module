export { SETTING_SCOPES, SETTING_VALUE_TYPES } from './model/Setting';
export type {
  SettingAccess,
  SettingChoice,
  SettingDefinition,
  SettingEntry,
  SettingRange,
  SettingScope,
  SettingValueEntry,
  SettingValueType
} from './model/Setting';
export {
  CredentialSettingError,
  InvalidSettingValueError,
  ProtectedSettingNamespaceError,
  ReadOnlySettingError,
  SettingNotFoundError,
  SettingValueNotRepresentableError,
  SettingWriteFailedError
} from './errors/settingErrors';
export { findCredentialPath, looksLikeCredential } from './rules/credentials';
export {
  requireAddressableSetting,
  requireReadableValue,
  requireWritableValue,
  settingAccess
} from './rules/settingAccess';
export { checkSettingValue, sameSettingValue } from './rules/settingValue';
export type { SettingRegistry } from './ports/SettingRegistry';
