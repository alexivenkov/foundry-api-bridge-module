import { computeDamage, type SwadeDamageRuleInput } from '../damageRule';

const base: SwadeDamageRuleInput = {
  damage: 0,
  ap: 0,
  toughness: 7,
  armor: 2,
  alreadyShaken: false,
  hardy: false,
  woundCap: false,
  woundsBefore: 0,
  woundsMax: 3,
  isVehicle: false
};

describe('SWADE damage rule (Toughness 7, Armor 2)', () => {
  it.each([
    // damage, ap, outcome, wounds, excess
    [5, 0, 'none', 0, -2],
    [7, 0, 'shaken', 0, 0],
    [10, 0, 'shaken', 0, 3],
    [11, 0, 'wounded', 1, 4],
    [14, 0, 'wounded', 1, 7],
    [15, 0, 'wounded', 2, 8],
    [18, 0, 'wounded', 2, 11],
    [5, 2, 'shaken', 0, 0],
    [7, 2, 'shaken', 0, 2],
    [10, 2, 'wounded', 1, 5],
    [11, 2, 'wounded', 1, 6],
    [14, 2, 'wounded', 2, 9],
    [15, 2, 'wounded', 2, 10],
    [18, 2, 'wounded', 3, 13],
    [5, 4, 'shaken', 0, 0],
    [7, 4, 'shaken', 0, 2],
    [10, 4, 'wounded', 1, 5],
    [18, 4, 'wounded', 3, 13]
  ])('damage %i with AP %i → %s, %i wound(s), excess %i', (damage, ap, outcome, wounds, excess) => {
    const preview = computeDamage({ ...base, damage, ap });
    expect(preview.outcome).toBe(outcome);
    expect(preview.woundsInflicted).toBe(wounds);
    expect(preview.excess).toBe(excess);
    expect(preview.apApplied).toBe(Math.min(ap, 2));
    expect(preview.effectiveToughness).toBe(7 - Math.min(ap, 2));
    expect(preview.doubleShaken).toBe(false);
  });

  it('never applies more AP than there is armor', () => {
    expect(computeDamage({ ...base, damage: 9, ap: 10 }).apApplied).toBe(2);
    expect(computeDamage({ ...base, damage: 9, ap: 10 }).excess).toBe(4);
  });

  it('turns a second Shaken into a Wound', () => {
    const preview = computeDamage({ ...base, damage: 8, alreadyShaken: true });
    expect(preview).toMatchObject({ outcome: 'wounded', woundsInflicted: 1, doubleShaken: true });
  });

  it('keeps a Hardy target Shaken instead of wounding it twice', () => {
    const preview = computeDamage({ ...base, damage: 8, alreadyShaken: true, hardy: true });
    expect(preview).toMatchObject({ outcome: 'shaken', woundsInflicted: 0, doubleShaken: false });
  });

  it('does not double-shake when the hit already wounds', () => {
    const preview = computeDamage({ ...base, damage: 11, alreadyShaken: true });
    expect(preview).toMatchObject({ outcome: 'wounded', woundsInflicted: 1, doubleShaken: false });
  });

  it('caps Wounds at 4 only when the Wound Cap setting is on', () => {
    expect(computeDamage({ ...base, damage: 30 }).woundsInflicted).toBe(5);
    expect(computeDamage({ ...base, damage: 30, woundCap: true }).woundsInflicted).toBe(4);
  });

  it('never Shakes a vehicle', () => {
    expect(computeDamage({ ...base, damage: 8, isVehicle: true })).toMatchObject({ outcome: 'none', woundsInflicted: 0 });
    expect(computeDamage({ ...base, damage: 8, isVehicle: true, alreadyShaken: true }).doubleShaken).toBe(false);
    expect(computeDamage({ ...base, damage: 12, isVehicle: true })).toMatchObject({ outcome: 'wounded', woundsInflicted: 1 });
  });

  it('flags incapacitation when the Wounds would exceed the maximum', () => {
    expect(computeDamage({ ...base, damage: 11, woundsBefore: 3 }).wouldIncapacitate).toBe(true);
    expect(computeDamage({ ...base, damage: 11, woundsBefore: 2 }).wouldIncapacitate).toBe(false);
    expect(computeDamage({ ...base, damage: 8, alreadyShaken: true, woundsBefore: 3 }).wouldIncapacitate).toBe(true);
  });

  it('echoes Toughness and armor', () => {
    expect(computeDamage({ ...base, damage: 1 })).toMatchObject({ toughness: 7, armor: 2 });
  });
});
