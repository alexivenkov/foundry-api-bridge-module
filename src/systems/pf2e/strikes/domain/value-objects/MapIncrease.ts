import { ValidationError } from '@/systems/shared/domain/errors';

/** Multiple-attack-penalty step: 0 = no MAP, 1 = −5 (−4 agile), 2 = −10 (−8 agile). */
export type MapIncrease = 0 | 1 | 2;

export function parseMapIncrease(raw: number): MapIncrease {
  if (raw === 0 || raw === 1 || raw === 2) {
    return raw;
  }
  throw new ValidationError(`Invalid MAP increase: ${String(raw)}. Must be 0, 1, or 2.`);
}
