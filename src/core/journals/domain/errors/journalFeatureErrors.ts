import { DomainError } from '@/kernel';

export class JournalCategoryNotFoundError extends DomainError {
  constructor(public readonly categoryId: string) {
    super(`Journal category not found: ${categoryId}`);
    this.name = 'JournalCategoryNotFoundError';
    Object.setPrototypeOf(this, JournalCategoryNotFoundError.prototype);
  }
}

export class JournalCategoryCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create journal category');
    this.name = 'JournalCategoryCreationFailedError';
    Object.setPrototypeOf(this, JournalCategoryCreationFailedError.prototype);
  }
}

export class JournalUserNotFoundError extends DomainError {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'JournalUserNotFoundError';
    Object.setPrototypeOf(this, JournalUserNotFoundError.prototype);
  }
}

export class JournalCanvasNotReadyError extends DomainError {
  constructor() {
    super('Canvas not ready: no scene is viewed');
    this.name = 'JournalCanvasNotReadyError';
    Object.setPrototypeOf(this, JournalCanvasNotReadyError.prototype);
  }
}

export class JournalNoteNotFoundError extends DomainError {
  constructor(
    public readonly journalId: string,
    public readonly sceneId: string
  ) {
    super(`Map note not found for journal ${journalId} on the viewed scene ${sceneId}`);
    this.name = 'JournalNoteNotFoundError';
    Object.setPrototypeOf(this, JournalNoteNotFoundError.prototype);
  }
}
