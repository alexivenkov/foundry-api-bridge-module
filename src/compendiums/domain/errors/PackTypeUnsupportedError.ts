import { DomainError } from '@/kernel';

export class PackTypeUnsupportedError extends DomainError {
  constructor(public readonly documentType: string) {
    super(`${documentType} compendium packs are not supported by this Foundry version`);
    this.name = 'PackTypeUnsupportedError';
    Object.setPrototypeOf(this, PackTypeUnsupportedError.prototype);
  }
}
