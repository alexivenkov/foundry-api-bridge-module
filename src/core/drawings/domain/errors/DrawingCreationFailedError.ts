import { DomainError } from '@/kernel';

export class DrawingCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create drawing');
    this.name = 'DrawingCreationFailedError';
    Object.setPrototypeOf(this, DrawingCreationFailedError.prototype);
  }
}
