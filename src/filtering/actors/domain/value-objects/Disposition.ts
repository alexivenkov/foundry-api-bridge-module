import { ValidationError } from '@/kernel/domain/errors';

export enum Disposition {
  Hostile = 'hostile',
  Neutral = 'neutral',
  Friendly = 'friendly',
  Secret = 'secret'
}

const KNOWN: ReadonlySet<string> = new Set<string>(Object.values(Disposition));

export function parseDisposition(raw: string): Disposition {
  const normalized = raw.trim().toLowerCase();
  if (!KNOWN.has(normalized)) {
    throw new ValidationError(`unknown disposition: '${raw}'`);
  }
  return normalized as Disposition;
}
