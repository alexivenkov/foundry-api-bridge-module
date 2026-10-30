/**
 * Damage bonus terms as `CoC7ChatDamage#damageFormula` builds them: the full
 * bonus is the sheet's `attribs.db.value` with its sign normalized, the half
 * bonus is `CoC7Utilities.halfDB` (every `±N` and `±NdM` term halved, floor
 * for `+` and ceil for `−`, numbers and die faces alike).
 */

function normalizeDb(db: string | number | null | undefined): string {
  const text = (db ?? '').toString().trim();
  return (text === '' ? '0' : text).replace(/\s+/g, '');
}

export function fullDamageBonus(db: string | number | null | undefined): string {
  const formula = normalizeDb(db);
  return (formula.startsWith('-') ? '' : '+') + formula;
}

export function halfDamageBonus(db: string | number | null | undefined): string {
  let formula = normalizeDb(db);
  if (!formula.startsWith('-')) {
    formula = '+' + formula;
  }
  const matches = [...formula.matchAll(/([+-])(\d+)(d(\d+))?/gi)];
  let lastPosition = 0;
  for (const match of matches) {
    const whole = match[0];
    const sign = match[1] ?? '+';
    const count = Number(match[2]);
    const faces = match[4];
    const found = formula.indexOf(whole, lastPosition);
    if (found > -1) {
      const half = (value: number): number => (sign === '-' ? Math.ceil(value / 2) : Math.floor(value / 2));
      const replacement =
        faces === undefined ? sign + String(half(count)) : sign + String(count) + 'D' + String(half(Number(faces)));
      formula = formula.slice(0, found) + replacement + formula.slice(found + whole.length);
      lastPosition = found + 1;
    }
  }
  return formula;
}

export interface DamageBonusProperties {
  readonly addb: boolean;
  readonly ahdb: boolean;
}

/** The term appended to a weapon's damage: `+1d4`, `+1D2`, `-1`, or nothing. */
export function damageBonusTerm(db: string | number | null | undefined, properties: DamageBonusProperties): string {
  if (properties.addb) {
    return fullDamageBonus(db);
  }
  if (properties.ahdb) {
    return halfDamageBonus(db);
  }
  return '';
}

export function weaponDamageFormula(damage: string | null | undefined, bonus: string): string {
  const base = (damage ?? '').trim();
  return (base === '' ? '0' : base) + bonus;
}
