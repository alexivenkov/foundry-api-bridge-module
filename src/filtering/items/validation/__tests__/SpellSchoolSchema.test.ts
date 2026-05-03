import { spellSchoolArraySchema } from '../SpellSchoolSchema';

describe('spellSchoolArraySchema', () => {
  it('accepts a valid array of full-word schools', () => {
    expect(
      spellSchoolArraySchema.safeParse(['evocation', 'necromancy']).success
    ).toBe(true);
  });

  it('normalizes case', () => {
    const result = spellSchoolArraySchema.safeParse(['EVOCATION']);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(['evocation']);
  });

  it('rejects 3-letter Foundry codes (only full words allowed)', () => {
    expect(spellSchoolArraySchema.safeParse(['evo']).success).toBe(false);
    expect(spellSchoolArraySchema.safeParse(['abj']).success).toBe(false);
  });

  it('rejects empty array', () => {
    const result = spellSchoolArraySchema.safeParse([]);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(
      'spellSchool array must not be empty'
    );
  });

  it('rejects unknown school', () => {
    const result = spellSchoolArraySchema.safeParse(['chaos']);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("unknown spellSchool: 'chaos'");
  });
});
