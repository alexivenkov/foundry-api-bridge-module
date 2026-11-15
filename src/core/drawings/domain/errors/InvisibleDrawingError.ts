import { DomainError } from '@/kernel';

/** The drawing would show nothing: the core refuses such a drawing. */
export class InvisibleDrawingError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvisibleDrawingError';
    Object.setPrototypeOf(this, InvisibleDrawingError.prototype);
  }
}
