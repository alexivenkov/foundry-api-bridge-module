import { itemTypeArraySchema } from '../ItemTypeSchema';

describe('itemTypeArraySchema', () => {
  it('accepts a single valid type', () => {
    expect(itemTypeArraySchema.safeParse(['weapon']).success).toBe(true);
  });

  it('accepts multiple valid types', () => {
    expect(itemTypeArraySchema.safeParse(['weapon', 'spell']).success).toBe(true);
  });

  it('normalizes case', () => {
    const result = itemTypeArraySchema.safeParse(['WEAPON', 'Spell']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['weapon', 'spell']);
  });

  it('trims whitespace', () => {
    const result = itemTypeArraySchema.safeParse(['  weapon  ']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['weapon']);
  });

  it('rejects empty array', () => {
    const result = itemTypeArraySchema.safeParse([]);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe('type array must not be empty');
  });

  it('rejects unknown type', () => {
    const result = itemTypeArraySchema.safeParse(['unknown-type']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(
      "unknown itemType: 'unknown-type'"
    );
  });

  it('rejects non-string entries', () => {
    expect(itemTypeArraySchema.safeParse([123]).success).toBe(false);
  });
});
