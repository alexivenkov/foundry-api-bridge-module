// Foundry stores price either as a plain number (treated as gp by convention)
// or as `{ value: number; denomination: 'pp' | 'gp' | 'ep' | 'sp' | 'cp' }`.
// Price.normalizeToGp converts whichever shape into a gp-denominated number;
// returns null when input is missing or unusable.
const DENOMINATION_TO_GP: ReadonlyMap<string, number> = new Map<string, number>([
  ['pp', 10],
  ['gp', 1],
  ['ep', 0.5],
  ['sp', 0.1],
  ['cp', 0.01]
]);

export const Price = Object.freeze({
  normalizeToGp(raw: unknown): number | null {
    if (raw === undefined || raw === null) {
      return null;
    }
    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? raw : null;
    }
    if (typeof raw === 'object') {
      const obj = raw as { value?: unknown; denomination?: unknown };
      if (typeof obj.value !== 'number' || !Number.isFinite(obj.value)) {
        return null;
      }
      const denom =
        typeof obj.denomination === 'string'
          ? obj.denomination.trim().toLowerCase()
          : 'gp';
      const factor = DENOMINATION_TO_GP.get(denom);
      if (factor === undefined) {
        return null;
      }
      return obj.value * factor;
    }
    return null;
  }
});
