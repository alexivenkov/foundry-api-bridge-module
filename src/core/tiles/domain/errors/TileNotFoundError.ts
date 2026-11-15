import { DomainError } from '@/kernel';

export class TileNotFoundError extends DomainError {
  constructor(public readonly tileId: string) {
    super(`Tile not found: ${tileId}`);
    this.name = 'TileNotFoundError';
    Object.setPrototypeOf(this, TileNotFoundError.prototype);
  }
}
