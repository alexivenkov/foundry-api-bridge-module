import { DomainError } from '@/kernel';

export class CompendiumFeatureUnavailableError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'CompendiumFeatureUnavailableError';
    Object.setPrototypeOf(this, CompendiumFeatureUnavailableError.prototype);
  }
}
