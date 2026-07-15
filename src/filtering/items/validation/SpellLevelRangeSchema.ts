import { makeRangeSchema } from '@/kernel/validation';
import { SpellLevel } from '@/filtering/items/domain/value-objects';

// Spell level is an integer in [SpellLevel.MIN, SpellLevel.MAX] = [0, 9].
// 0 corresponds to a cantrip; 9 to the highest D&D 5e spell tier.
const ALLOWED_SPELL_LEVELS: readonly number[] = Object.freeze(
  Array.from(
    { length: SpellLevel.MAX - SpellLevel.MIN + 1 },
    (_v, i) => SpellLevel.MIN + i
  )
);

export const spellLevelRangeSchema = makeRangeSchema({
  integerOnly: true,
  minBound: SpellLevel.MIN,
  allowedValues: ALLOWED_SPELL_LEVELS
});
