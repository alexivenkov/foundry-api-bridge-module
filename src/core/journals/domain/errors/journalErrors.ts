import { DomainError } from '@/kernel';

export class JournalNotFoundError extends DomainError {
  constructor(public readonly journalId: string) {
    super(`Journal not found: ${journalId}`);
    this.name = 'JournalNotFoundError';
    Object.setPrototypeOf(this, JournalNotFoundError.prototype);
  }
}

export class JournalPageNotFoundError extends DomainError {
  constructor(public readonly pageId: string) {
    super(`Page not found: ${pageId}`);
    this.name = 'JournalPageNotFoundError';
    Object.setPrototypeOf(this, JournalPageNotFoundError.prototype);
  }
}

export class JournalCreationCancelledError extends DomainError {
  constructor() {
    super('Journal creation was cancelled by Foundry (a module hook may have vetoed it)');
    this.name = 'JournalCreationCancelledError';
    Object.setPrototypeOf(this, JournalCreationCancelledError.prototype);
  }
}

export class JournalPageCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create journal page');
    this.name = 'JournalPageCreationFailedError';
    Object.setPrototypeOf(this, JournalPageCreationFailedError.prototype);
  }
}
