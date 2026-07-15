import { NameNeedle } from '../NameNeedle';

describe('NameNeedle', () => {
  it('normalizes to lowercase and trims', () => {
    expect(new NameNeedle('  GobLin ').value).toBe('goblin');
  });

  it('is empty for blank input instead of throwing', () => {
    expect(new NameNeedle('').isEmpty).toBe(true);
    expect(new NameNeedle('   ').isEmpty).toBe(true);
  });

  it('is not empty for real input', () => {
    expect(new NameNeedle('x').isEmpty).toBe(false);
  });

  it('matches case-insensitively by substring', () => {
    const needle = new NameNeedle('gobl');
    expect(needle.matches('Hobgoblin Captain')).toBe(true);
    expect(needle.matches('GOBLIN')).toBe(true);
    expect(needle.matches('Orc')).toBe(false);
  });

  it('does not trim the target name (only lowercases it)', () => {
    expect(new NameNeedle('goblin').matches('  Goblin  ')).toBe(true);
  });

  it('empty needle matches any name (guarded by isEmpty at call sites)', () => {
    expect(new NameNeedle('').matches('anything')).toBe(true);
  });
});
