import { creatureTypeArraySchema } from '../CreatureTypeSchema';

describe('creatureTypeArraySchema', () => {
  it('accepts a single valid creature type', () => {
    const result = creatureTypeArraySchema.safeParse(['humanoid']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['humanoid']);
  });

  it('accepts multiple valid creature types', () => {
    const result = creatureTypeArraySchema.safeParse(['dragon', 'beast', 'undead']);
    expect(result.success).toBe(true);
  });

  it('accepts all 14 SRD creature types', () => {
    const all = [
      'aberration', 'beast', 'celestial', 'construct', 'dragon', 'elemental',
      'fey', 'fiend', 'giant', 'humanoid', 'monstrosity', 'ooze', 'plant', 'undead'
    ];
    const result = creatureTypeArraySchema.safeParse(all);
    expect(result.success).toBe(true);
  });

  it('normalizes uppercase to lowercase', () => {
    const result = creatureTypeArraySchema.safeParse(['DRAGON']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['dragon']);
  });

  it('normalizes mixed case', () => {
    const result = creatureTypeArraySchema.safeParse(['Humanoid']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['humanoid']);
  });

  it('trims surrounding whitespace', () => {
    const result = creatureTypeArraySchema.safeParse(['  beast  ']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['beast']);
  });

  it('rejects an empty array', () => {
    const result = creatureTypeArraySchema.safeParse([]);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe('creatureType array must not be empty');
  });

  it('rejects an unknown creature type with a descriptive message', () => {
    const result = creatureTypeArraySchema.safeParse(['robot']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("unknown creatureType: 'robot'");
  });

  it('rejects a non-array input', () => {
    expect(creatureTypeArraySchema.safeParse('humanoid').success).toBe(false);
  });

  it('rejects an array with non-string element', () => {
    expect(creatureTypeArraySchema.safeParse([123]).success).toBe(false);
  });

  it('attaches index path to invalid element', () => {
    const result = creatureTypeArraySchema.safeParse(['dragon', 'robot']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual([1]);
  });
});
