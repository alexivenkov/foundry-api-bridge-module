import { DomainError } from '@/kernel';

export class SettingNotFoundError extends DomainError {
  constructor(public readonly settingId: string) {
    super(`Setting not found: ${settingId}`);
    this.name = 'SettingNotFoundError';
    Object.setPrototypeOf(this, SettingNotFoundError.prototype);
  }
}

/** The settings of the API bridge itself: the API key, the connection URLs and the script macro switch. */
export class ProtectedSettingNamespaceError extends DomainError {
  constructor(public readonly namespace: string) {
    super(`The settings of '${namespace}' belong to the API bridge itself and cannot be read or changed through the API`);
    this.name = 'ProtectedSettingNamespaceError';
    Object.setPrototypeOf(this, ProtectedSettingNamespaceError.prototype);
  }
}

export class CredentialSettingError extends DomainError {
  constructor(
    public readonly settingId: string,
    public readonly credentialPath: string | null
  ) {
    super(
      credentialPath === null
        ? `Setting ${settingId} looks like a credential and cannot be read or changed through the API`
        : `Setting ${settingId} holds a credential (${credentialPath}) and cannot be read or changed through the API`
    );
    this.name = 'CredentialSettingError';
    Object.setPrototypeOf(this, CredentialSettingError.prototype);
  }
}

export class ReadOnlySettingError extends DomainError {
  constructor(public readonly settingId: string) {
    super(`Setting ${settingId} is read-only through the API`);
    this.name = 'ReadOnlySettingError';
    Object.setPrototypeOf(this, ReadOnlySettingError.prototype);
  }
}

/** Refused by the API's own check or by the core's validation of the registered type. */
export class InvalidSettingValueError extends DomainError {
  constructor(
    public readonly settingId: string,
    public readonly reason: string
  ) {
    super(`Invalid value for setting ${settingId}: ${reason}`);
    this.name = 'InvalidSettingValueError';
    Object.setPrototypeOf(this, InvalidSettingValueError.prototype);
  }
}

/** The core accepted the value but could not store it (e.g. the server refused the write). */
export class SettingWriteFailedError extends DomainError {
  constructor(
    public readonly settingId: string,
    public readonly reason: string
  ) {
    super(`Failed to set setting ${settingId}: ${reason}`);
    this.name = 'SettingWriteFailedError';
    Object.setPrototypeOf(this, SettingWriteFailedError.prototype);
  }
}

export class SettingValueNotRepresentableError extends DomainError {
  constructor(public readonly settingId: string) {
    super(`Setting ${settingId} holds a value that cannot be represented as JSON`);
    this.name = 'SettingValueNotRepresentableError';
    Object.setPrototypeOf(this, SettingValueNotRepresentableError.prototype);
  }
}
