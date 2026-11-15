import { DomainError } from '@/kernel';

export class AdventureOverwriteRefusedError extends DomainError {
  constructor(public readonly adventureName: string, public readonly overwriteCount: number, summary: string) {
    super(`Importing adventure ${adventureName} would overwrite ${String(overwriteCount)} existing world document(s) (${summary}); pass overwrite: true to replace them`);
    this.name = 'AdventureOverwriteRefusedError';
    Object.setPrototypeOf(this, AdventureOverwriteRefusedError.prototype);
  }
}
