import { ValidationError } from '@/kernel';

export class UnknownNoteLevelError extends ValidationError {
  constructor(public readonly levelId: string) {
    super(`Unknown scene level: ${levelId}`);
    this.name = 'UnknownNoteLevelError';
    Object.setPrototypeOf(this, UnknownNoteLevelError.prototype);
  }
}
