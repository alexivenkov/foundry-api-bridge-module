import { DomainError, ValidationError } from '@/kernel';

export class TableResultNotFoundError extends DomainError {
  constructor(
    public readonly tableId: string,
    public readonly resultId: string
  ) {
    super(`Table result not found in roll table ${tableId}: ${resultId}`);
    this.name = 'TableResultNotFoundError';
    Object.setPrototypeOf(this, TableResultNotFoundError.prototype);
  }
}

export class TableResultCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create table result');
    this.name = 'TableResultCreationFailedError';
    Object.setPrototypeOf(this, TableResultCreationFailedError.prototype);
  }
}

export class TableFolderNotFoundError extends DomainError {
  constructor(public readonly folderId: string) {
    super(`Folder not found: ${folderId}`);
    this.name = 'TableFolderNotFoundError';
    Object.setPrototypeOf(this, TableFolderNotFoundError.prototype);
  }
}

export class NotARollTableFolderError extends DomainError {
  constructor(folderId: string, folderType: string) {
    super(`Folder ${folderId} holds ${folderType} documents, not roll tables`);
    this.name = 'NotARollTableFolderError';
    Object.setPrototypeOf(this, NotARollTableFolderError.prototype);
  }
}

export class UndrawableFolderError extends DomainError {
  constructor(folderId: string, folderType: string) {
    super(`Folder ${folderId} holds ${folderType} entries, which a roll table cannot point to`);
    this.name = 'UndrawableFolderError';
    Object.setPrototypeOf(this, UndrawableFolderError.prototype);
  }
}

export class EmptyFolderError extends DomainError {
  constructor(folderId: string) {
    super(`Folder ${folderId} holds no documents to build a roll table from`);
    this.name = 'EmptyFolderError';
    Object.setPrototypeOf(this, EmptyFolderError.prototype);
  }
}

export class EmptyRollTableError extends DomainError {
  constructor(tableId: string) {
    super(`Roll table ${tableId} has no results to normalize`);
    this.name = 'EmptyRollTableError';
    Object.setPrototypeOf(this, EmptyRollTableError.prototype);
  }
}

export class TableDrawCountError extends ValidationError {
  constructor(count: number, max: number) {
    super(`count must be a whole number from 1 to ${String(max)}, got ${String(count)}`);
    this.name = 'TableDrawCountError';
    Object.setPrototypeOf(this, TableDrawCountError.prototype);
  }
}

export class TableFormulaError extends ValidationError {
  constructor(reason: string) {
    super(`Invalid roll formula: ${reason}`);
    this.name = 'TableFormulaError';
    Object.setPrototypeOf(this, TableFormulaError.prototype);
  }
}

export class TableResultReferenceError extends ValidationError {
  constructor(reason: string) {
    super(reason);
    this.name = 'TableResultReferenceError';
    Object.setPrototypeOf(this, TableResultReferenceError.prototype);
  }
}
