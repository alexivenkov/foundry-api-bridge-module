// Foundry stores weight either as a plain number (legacy dnd5e) or as an
// object `{ value: number; units?: string }` (dnd5e v3+). Weight.normalize
// extracts a finite number from either shape, returning null when the input
// is missing or unusable.
export const Weight = Object.freeze({
  normalize(raw: unknown): number | null {
    if (raw === undefined || raw === null) {
      return null;
    }
    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? raw : null;
    }
    if (typeof raw === 'object') {
      const candidate = (raw as { value?: unknown }).value;
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }
    }
    return null;
  }
});
