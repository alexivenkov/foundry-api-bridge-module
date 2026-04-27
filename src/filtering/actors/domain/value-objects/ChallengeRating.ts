function buildValidValues(): readonly number[] {
  const values: number[] = [0, 0.125, 0.25, 0.5];
  for (let cr = 1; cr <= 30; cr += 1) {
    values.push(cr);
  }
  return Object.freeze(values);
}

const VALID_VALUES: readonly number[] = buildValidValues();
const LOOKUP: ReadonlySet<number> = new Set<number>(VALID_VALUES);

export const ChallengeRating = Object.freeze({
  VALID_VALUES,
  isValid(value: number): boolean {
    if (!Number.isFinite(value)) {
      return false;
    }
    return LOOKUP.has(value);
  }
});
