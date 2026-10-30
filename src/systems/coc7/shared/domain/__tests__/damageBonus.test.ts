import { damageBonusTerm, fullDamageBonus, halfDamageBonus, weaponDamageFormula } from '../damageBonus';

describe('halfDamageBonus (CoC7Utilities.halfDB port)', () => {
  it.each([
    ['1d4', '+1D2'],
    ['1D6', '+1D3'],
    ['2d6', '+2D3'],
    ['1d4+2', '+1D2+1'],
    ['-1', '-1'],
    ['-2', '-1'],
    ['0', '+0'],
    ['', '+0'],
    [' 1d6 ', '+1D3'],
    [null, '+0'],
    [1, '+0'],
    [3, '+1']
  ])('halves %j into %s', (db, expected) => {
    expect(halfDamageBonus(db)).toBe(expected);
  });
});

describe('fullDamageBonus', () => {
  it.each([
    ['1d4', '+1d4'],
    ['-1', '-1'],
    ['', '+0'],
    [' 1d6 ', '+1d6'],
    [0, '+0'],
    [undefined, '+0']
  ])('normalizes %j into %s', (db, expected) => {
    expect(fullDamageBonus(db)).toBe(expected);
  });
});

describe('damageBonusTerm and weaponDamageFormula', () => {
  it('adds the full bonus, the half bonus, or nothing', () => {
    expect(damageBonusTerm('1d4', { addb: true, ahdb: false })).toBe('+1d4');
    expect(damageBonusTerm('1d4', { addb: false, ahdb: true })).toBe('+1D2');
    expect(damageBonusTerm('1d4', { addb: false, ahdb: false })).toBe('');
    expect(damageBonusTerm('1d4', { addb: true, ahdb: true })).toBe('+1d4');
  });

  it('treats an empty weapon damage as 0', () => {
    expect(weaponDamageFormula('1d6', '+1d4')).toBe('1d6+1d4');
    expect(weaponDamageFormula('', '+1d4')).toBe('0+1d4');
    expect(weaponDamageFormula(undefined, '')).toBe('0');
  });
});
