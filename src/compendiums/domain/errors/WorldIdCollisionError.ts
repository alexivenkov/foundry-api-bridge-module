import { DomainError } from '@/kernel';

export class WorldIdCollisionError extends DomainError {
  constructor(public readonly packId: string, public readonly collisionCount: number) {
    super(`${String(collisionCount)} document(s) of ${packId} already exist in the world with the same id; import without keepId or delete them first`);
    this.name = 'WorldIdCollisionError';
    Object.setPrototypeOf(this, WorldIdCollisionError.prototype);
  }
}
