import { DomainError } from '@/kernel';

export class NotADoorError extends DomainError {
  constructor(public readonly wallId: string) {
    super(`Wall ${wallId} is not a door`);
    this.name = 'NotADoorError';
    Object.setPrototypeOf(this, NotADoorError.prototype);
  }
}
