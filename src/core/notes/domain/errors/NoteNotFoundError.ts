import { DomainError } from '@/kernel';

export class NoteNotFoundError extends DomainError {
  constructor(public readonly noteId: string) {
    super(`Note not found: ${noteId}`);
    this.name = 'NoteNotFoundError';
    Object.setPrototypeOf(this, NoteNotFoundError.prototype);
  }
}
