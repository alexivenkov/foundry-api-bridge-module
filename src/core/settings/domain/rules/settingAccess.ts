import {
  CredentialSettingError,
  ProtectedSettingNamespaceError,
  ReadOnlySettingError
} from '@/core/settings/domain/errors/settingErrors';
import type { SettingAccess, SettingDefinition } from '@/core/settings/domain/model/Setting';
import { findCredentialPath, looksLikeCredential } from './credentials';

/** The world permission table: who may do what is decided in Foundry, never by the API. */
const READ_ONLY_SETTING_IDS: readonly string[] = ['core.permissions'];

/**
 * Checks that need only the address, made before the registry is asked, so a
 * refused setting is refused whether it is registered or not.
 */
export function requireAddressableSetting(namespace: string, key: string, protectedNamespace: string): void {
  if (namespace === protectedNamespace) {
    throw new ProtectedSettingNamespaceError(namespace);
  }
  if (looksLikeCredential(key)) {
    throw new CredentialSettingError(`${namespace}.${key}`, null);
  }
}

export function settingAccess(definition: SettingDefinition): SettingAccess {
  if (looksLikeCredential(definition.key) || findCredentialPath(definition.defaultValue) !== null) {
    return 'none';
  }
  return READ_ONLY_SETTING_IDS.includes(definition.id) ? 'read-only' : 'read-write';
}

/** The default reveals a credential field before it is ever set; the current value covers what a package stored. */
export function requireReadableValue(definition: SettingDefinition, value: unknown): void {
  if (looksLikeCredential(definition.key)) {
    throw new CredentialSettingError(definition.id, null);
  }
  const credentialPath = findCredentialPath(definition.defaultValue) ?? findCredentialPath(value);
  if (credentialPath !== null) {
    throw new CredentialSettingError(definition.id, credentialPath);
  }
}

export function requireWritableValue(definition: SettingDefinition, currentValue: unknown, newValue: unknown): void {
  requireReadableValue(definition, currentValue);
  if (READ_ONLY_SETTING_IDS.includes(definition.id)) {
    throw new ReadOnlySettingError(definition.id);
  }
  const credentialPath = findCredentialPath(newValue);
  if (credentialPath !== null) {
    throw new CredentialSettingError(definition.id, credentialPath);
  }
}
