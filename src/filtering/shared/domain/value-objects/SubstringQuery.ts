import { ValidationError } from '../errors/ValidationError';

export class SubstringQuery {
  public readonly normalized: string;

  constructor(raw: string) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new ValidationError('SubstringQuery must be non-empty after trim');
    }
    this.normalized = trimmed.toLowerCase();
  }

  matches(target: string): boolean {
    const normalizedTarget = target.trim().toLowerCase();
    if (normalizedTarget.length === 0) {
      return false;
    }
    return normalizedTarget.includes(this.normalized);
  }
}
