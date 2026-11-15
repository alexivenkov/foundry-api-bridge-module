import { DomainError } from '@/kernel';

/** A shape change that does not describe a complete shape. */
export class DrawingShapeError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'DrawingShapeError';
    Object.setPrototypeOf(this, DrawingShapeError.prototype);
  }
}
