import { itemRarityArraySchema } from '../ItemRaritySchema';

describe('itemRarityArraySchema', () => {
  it('accepts canonical lowercase rarity', () => {
    const result = itemRarityArraySchema.safeParse(['common', 'rare']);
    expect(result.success).toBe(true);
  });

  it('accepts camelCase "veryRare" via lowercased "veryrare"', () => {
    const result = itemRarityArraySchema.safeParse(['veryRare']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['veryrare']);
  });

  it('accepts spaced "very rare"', () => {
    const result = itemRarityArraySchema.safeParse(['very rare']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['very rare']);
  });

  it('accepts "Very Rare" (mixed case + space)', () => {
    const result = itemRarityArraySchema.safeParse(['Very Rare']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['very rare']);
  });

  it('accepts every documented rarity', () => {
    const all = ['common', 'uncommon', 'rare', 'veryRare', 'legendary', 'artifact'];
    expect(itemRarityArraySchema.safeParse(all).success).toBe(true);
  });

  it('rejects empty array', () => {
    const result = itemRarityArraySchema.safeParse([]);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe('rarity array must not be empty');
  });

  it('rejects unknown rarity', () => {
    const result = itemRarityArraySchema.safeParse(['mythic']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("unknown itemRarity: 'mythic'");
  });
});
