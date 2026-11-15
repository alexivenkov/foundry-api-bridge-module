import { DomainError } from '@/kernel';

export class WallNotFoundError extends DomainError {
  constructor(public readonly wallId: string) {
    super(`Wall not found: ${wallId}`);
    this.name = 'WallNotFoundError';
    Object.setPrototypeOf(this, WallNotFoundError.prototype);
  }
}
