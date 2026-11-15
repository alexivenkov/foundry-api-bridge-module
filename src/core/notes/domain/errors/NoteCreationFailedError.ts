import { DomainError } from '@/kernel';

export class NoteCreationFailedError extends DomainError {
  constructor() {
    super('Note creation returned no document');
    this.name = 'NoteCreationFailedError';
    Object.setPrototypeOf(this, NoteCreationFailedError.prototype);
  }
}
