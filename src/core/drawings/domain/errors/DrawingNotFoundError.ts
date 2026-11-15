import { DomainError } from '@/kernel';

export class DrawingNotFoundError extends DomainError {
  constructor(public readonly drawingId: string) {
    super(`Drawing not found: ${drawingId}`);
    this.name = 'DrawingNotFoundError';
    Object.setPrototypeOf(this, DrawingNotFoundError.prototype);
  }
}
