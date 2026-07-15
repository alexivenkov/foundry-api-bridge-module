import { ValidationError } from '@/kernel/domain/errors';

export enum Size {
  Tiny = 'tiny',
  Small = 'sm',
  Medium = 'med',
  Large = 'lg',
  Huge = 'huge',
  Gargantuan = 'grg'
}

const KNOWN: ReadonlySet<string> = new Set<string>(Object.values(Size));

export function parseSize(raw: string): Size {
  const normalized = raw.trim().toLowerCase();
  if (!KNOWN.has(normalized)) {
    throw new ValidationError(`unknown size: '${raw}'`);
  }
  return normalized as Size;
}
