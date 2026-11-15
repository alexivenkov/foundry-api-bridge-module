import { DomainError, ValidationError } from '@/kernel';

export class DocumentNotFoundError extends DomainError {
  constructor(public readonly uuid: string) {
    super(`Document not found: ${uuid}`);
    this.name = 'DocumentNotFoundError';
    Object.setPrototypeOf(this, DocumentNotFoundError.prototype);
  }
}

export class CompendiumDocumentReadOnlyError extends DomainError {
  constructor(public readonly uuid: string) {
    super(`Compendium documents are read-only here: ${uuid}`);
    this.name = 'CompendiumDocumentReadOnlyError';
    Object.setPrototypeOf(this, CompendiumDocumentReadOnlyError.prototype);
  }
}

export class DocumentHasNoOwnershipError extends DomainError {
  constructor(
    public readonly documentType: string,
    public readonly uuid: string
  ) {
    super(`${documentType} documents have no ownership: ${uuid}`);
    this.name = 'DocumentHasNoOwnershipError';
    Object.setPrototypeOf(this, DocumentHasNoOwnershipError.prototype);
  }
}

export class InheritOwnershipNotAllowedError extends DomainError {
  constructor(public readonly documentType: string) {
    super(
      `Ownership level 'inherit' applies only to embedded documents (such as journal pages); ${documentType} is a primary document`
    );
    this.name = 'InheritOwnershipNotAllowedError';
    Object.setPrototypeOf(this, InheritOwnershipNotAllowedError.prototype);
  }
}

export class OwnershipUserNotFoundError extends DomainError {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'OwnershipUserNotFoundError';
    Object.setPrototypeOf(this, OwnershipUserNotFoundError.prototype);
  }
}

export class NoOwnershipChangesError extends ValidationError {
  constructor() {
    super('Nothing to change: give defaultLevel and/or users');
    this.name = 'NoOwnershipChangesError';
    Object.setPrototypeOf(this, NoOwnershipChangesError.prototype);
  }
}

export class DocumentHasNoFlagsError extends DomainError {
  constructor(
    public readonly documentType: string,
    public readonly uuid: string
  ) {
    super(`${documentType} documents have no flags: ${uuid}`);
    this.name = 'DocumentHasNoFlagsError';
    Object.setPrototypeOf(this, DocumentHasNoFlagsError.prototype);
  }
}

/** The core's own refusal text (`Document#setFlag`), with the scopes that would be accepted. */
export class FlagScopeUnavailableError extends DomainError {
  constructor(
    public readonly scope: string,
    public readonly validScopes: readonly string[]
  ) {
    super(`Flag scope "${scope}" is not valid or not currently active (valid scopes: ${validScopes.join(', ')})`);
    this.name = 'FlagScopeUnavailableError';
    Object.setPrototypeOf(this, FlagScopeUnavailableError.prototype);
  }
}

export class InvalidFlagKeyError extends ValidationError {
  constructor(
    public readonly key: string,
    reason: string
  ) {
    super(`Invalid flag key "${key}": ${reason}`);
    this.name = 'InvalidFlagKeyError';
    Object.setPrototypeOf(this, InvalidFlagKeyError.prototype);
  }
}

export class PayloadTooLargeError extends ValidationError {
  constructor(
    public readonly what: string,
    public readonly bytes: number,
    public readonly limit: number
  ) {
    super(`${what} is ${String(bytes)} bytes as JSON, over the limit of ${String(limit)} bytes`);
    this.name = 'PayloadTooLargeError';
    Object.setPrototypeOf(this, PayloadTooLargeError.prototype);
  }
}

export class DocumentNotSortableError extends DomainError {
  constructor(
    public readonly documentType: string,
    public readonly uuid: string
  ) {
    super(`${documentType} documents have no sort order: ${uuid}`);
    this.name = 'DocumentNotSortableError';
    Object.setPrototypeOf(this, DocumentNotSortableError.prototype);
  }
}

export class SortTargetIsSelfError extends ValidationError {
  constructor() {
    super('A document cannot be sorted relative to itself');
    this.name = 'SortTargetIsSelfError';
    Object.setPrototypeOf(this, SortTargetIsSelfError.prototype);
  }
}

export class DocumentsNotSiblingsError extends DomainError {
  constructor(
    public readonly uuid: string,
    public readonly targetUuid: string
  ) {
    super(
      `${uuid} and ${targetUuid} are not siblings: sort relative to a document of the same type in the same folder or parent`
    );
    this.name = 'DocumentsNotSiblingsError';
    Object.setPrototypeOf(this, DocumentsNotSiblingsError.prototype);
  }
}

export class DocumentTypeNotTransferableError extends DomainError {
  constructor(
    public readonly documentType: string,
    allowed: readonly string[]
  ) {
    super(`${documentType} documents cannot be exported or imported (allowed: ${allowed.join(', ')})`);
    this.name = 'DocumentTypeNotTransferableError';
    Object.setPrototypeOf(this, DocumentTypeNotTransferableError.prototype);
  }
}

export class ScriptImportDisabledError extends DomainError {
  constructor(public readonly found: readonly string[]) {
    super(
      `Script macros are disabled. Enable "Allow Script Macros" in module settings to import documents that run scripts (found: ${found.join(', ')}).`
    );
    this.name = 'ScriptImportDisabledError';
    Object.setPrototypeOf(this, ScriptImportDisabledError.prototype);
  }
}

export class DocumentImportRejectedError extends DomainError {
  constructor(
    public readonly documentType: string,
    public readonly detail: string
  ) {
    super(`Could not import ${documentType}: ${detail}`);
    this.name = 'DocumentImportRejectedError';
    Object.setPrototypeOf(this, DocumentImportRejectedError.prototype);
  }
}

export class DocumentCreationFailedError extends DomainError {
  constructor(public readonly documentType: string) {
    super(`Failed to create ${documentType}`);
    this.name = 'DocumentCreationFailedError';
    Object.setPrototypeOf(this, DocumentCreationFailedError.prototype);
  }
}

export class ImportFolderNotFoundError extends DomainError {
  constructor(public readonly folderId: string) {
    super(`Folder not found: ${folderId}`);
    this.name = 'ImportFolderNotFoundError';
    Object.setPrototypeOf(this, ImportFolderNotFoundError.prototype);
  }
}

export class ImportFolderTypeMismatchError extends DomainError {
  constructor(
    public readonly folderId: string,
    public readonly folderType: string,
    public readonly documentType: string
  ) {
    super(`Folder ${folderId} holds ${folderType} documents, not ${documentType}`);
    this.name = 'ImportFolderTypeMismatchError';
    Object.setPrototypeOf(this, ImportFolderTypeMismatchError.prototype);
  }
}
