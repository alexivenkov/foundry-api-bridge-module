import { DomainError } from '@/kernel';

export class AdventureImportPreventedError extends DomainError {
  constructor(public readonly adventureName: string) {
    super(`Adventure import was cancelled by a preImportAdventure hook: ${adventureName}`);
    this.name = 'AdventureImportPreventedError';
    Object.setPrototypeOf(this, AdventureImportPreventedError.prototype);
  }
}
