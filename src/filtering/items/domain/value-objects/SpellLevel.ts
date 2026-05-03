export const SpellLevel = Object.freeze({
  MIN: 0,
  MAX: 9,
  isValid(value: number): boolean {
    if (!Number.isInteger(value)) {
      return false;
    }
    return value >= 0 && value <= 9;
  }
});
