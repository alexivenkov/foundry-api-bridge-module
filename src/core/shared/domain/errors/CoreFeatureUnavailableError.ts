import { DomainError } from '@/kernel';

/**
 * A core feature the running Foundry generation does not have. The message is
 * the whole wire text: "Regions require Foundry 12 or newer",
 * "Measured templates are not available in Foundry 14 or newer".
 */
export class CoreFeatureUnavailableError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'CoreFeatureUnavailableError';
    Object.setPrototypeOf(this, CoreFeatureUnavailableError.prototype);
  }
}
