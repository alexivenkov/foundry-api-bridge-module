import { filterItemsRequestSchema } from '../FilterItemsRequestSchema';

describe('filterItemsRequestSchema', () => {
  describe('empty / minimal', () => {
    it('accepts an empty object (all fields optional)', () => {
      expect(filterItemsRequestSchema.safeParse({}).success).toBe(true);
    });
  });

  describe('name', () => {
    it('accepts a non-empty name', () => {
      const result = filterItemsRequestSchema.safeParse({ name: 'sword' });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.name).toBe('sword');
    });

    it('trims whitespace', () => {
      const result = filterItemsRequestSchema.safeParse({ name: '  sword  ' });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.name).toBe('sword');
    });

    it('rejects whitespace-only', () => {
      const result = filterItemsRequestSchema.safeParse({ name: '   ' });
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.issues[0]?.message).toBe(
        'name must be non-empty after trim'
      );
    });

    it('rejects empty string', () => {
      expect(filterItemsRequestSchema.safeParse({ name: '' }).success).toBe(false);
    });

    it('rejects non-string', () => {
      expect(filterItemsRequestSchema.safeParse({ name: 42 }).success).toBe(false);
    });
  });

  describe('type', () => {
    it('accepts valid type array', () => {
      expect(
        filterItemsRequestSchema.safeParse({ type: ['weapon'] }).success
      ).toBe(true);
    });

    it('rejects unknown type', () => {
      expect(
        filterItemsRequestSchema.safeParse({ type: ['unknown'] }).success
      ).toBe(false);
    });
  });

  describe('rarity', () => {
    it('accepts canonical rarity values', () => {
      expect(
        filterItemsRequestSchema.safeParse({ rarity: ['common', 'rare'] }).success
      ).toBe(true);
    });

    it('accepts "very rare" alias', () => {
      expect(
        filterItemsRequestSchema.safeParse({ rarity: ['very rare'] }).success
      ).toBe(true);
    });

    it('accepts "veryRare" camelCase', () => {
      expect(
        filterItemsRequestSchema.safeParse({ rarity: ['veryRare'] }).success
      ).toBe(true);
    });

    it('rejects unknown rarity', () => {
      expect(
        filterItemsRequestSchema.safeParse({ rarity: ['mythic'] }).success
      ).toBe(false);
    });
  });

  describe('spellSchool', () => {
    it('accepts valid schools', () => {
      expect(
        filterItemsRequestSchema.safeParse({ spellSchool: ['evocation'] }).success
      ).toBe(true);
    });

    it('rejects 3-letter codes', () => {
      expect(
        filterItemsRequestSchema.safeParse({ spellSchool: ['evo'] }).success
      ).toBe(false);
    });
  });

  describe('boolean filters', () => {
    it.each([
      ['requiresAttunement', true],
      ['requiresAttunement', false],
      ['identified', true],
      ['identified', false],
      ['hasActivities', true],
      ['hasActivities', false],
      ['isContainer', true],
      ['isContainer', false]
    ])('accepts %s = %s', (key, val) => {
      expect(
        filterItemsRequestSchema.safeParse({ [key]: val }).success
      ).toBe(true);
    });

    it('rejects non-boolean for requiresAttunement', () => {
      expect(
        filterItemsRequestSchema.safeParse({ requiresAttunement: 'yes' }).success
      ).toBe(false);
    });
  });

  describe('weight', () => {
    it('accepts valid weight range', () => {
      expect(
        filterItemsRequestSchema.safeParse({ weight: { min: 0, max: 100 } }).success
      ).toBe(true);
    });

    it('accepts fractional weight', () => {
      expect(
        filterItemsRequestSchema.safeParse({ weight: { min: 0.5 } }).success
      ).toBe(true);
    });

    it('rejects negative weight', () => {
      expect(
        filterItemsRequestSchema.safeParse({ weight: { min: -1 } }).success
      ).toBe(false);
    });
  });

  describe('price', () => {
    it('accepts valid price range', () => {
      expect(
        filterItemsRequestSchema.safeParse({ price: { min: 0, max: 1000 } }).success
      ).toBe(true);
    });

    it('rejects negative price', () => {
      expect(
        filterItemsRequestSchema.safeParse({ price: { min: -1 } }).success
      ).toBe(false);
    });
  });

  describe('spellLevel', () => {
    it('accepts level 0 (cantrip)', () => {
      expect(
        filterItemsRequestSchema.safeParse({ spellLevel: { min: 0 } }).success
      ).toBe(true);
    });

    it('accepts level 9', () => {
      expect(
        filterItemsRequestSchema.safeParse({ spellLevel: { max: 9 } }).success
      ).toBe(true);
    });

    it('rejects level 10', () => {
      expect(
        filterItemsRequestSchema.safeParse({ spellLevel: { max: 10 } }).success
      ).toBe(false);
    });

    it('rejects fractional level', () => {
      expect(
        filterItemsRequestSchema.safeParse({ spellLevel: { min: 1.5 } }).success
      ).toBe(false);
    });
  });

  describe('folder', () => {
    it('accepts a valid folder reference', () => {
      expect(
        filterItemsRequestSchema.safeParse({ folder: { id: 'f1' } }).success
      ).toBe(true);
    });

    it('rejects an empty folder', () => {
      expect(
        filterItemsRequestSchema.safeParse({ folder: {} }).success
      ).toBe(false);
    });
  });

  describe('limit / offset', () => {
    it('accepts limit at lower bound (1)', () => {
      expect(filterItemsRequestSchema.safeParse({ limit: 1 }).success).toBe(true);
    });

    it('accepts limit at upper bound (200)', () => {
      expect(filterItemsRequestSchema.safeParse({ limit: 200 }).success).toBe(true);
    });

    it('rejects limit > 200', () => {
      expect(filterItemsRequestSchema.safeParse({ limit: 201 }).success).toBe(false);
    });

    it('rejects negative offset', () => {
      expect(filterItemsRequestSchema.safeParse({ offset: -1 }).success).toBe(false);
    });

    it('rejects fractional limit', () => {
      expect(filterItemsRequestSchema.safeParse({ limit: 50.5 }).success).toBe(false);
    });
  });

  describe('full request', () => {
    it('accepts a request that uses every supported field', () => {
      const result = filterItemsRequestSchema.safeParse({
        name: 'sword',
        type: ['weapon'],
        rarity: ['rare'],
        spellSchool: ['evocation'],
        requiresAttunement: false,
        identified: true,
        hasActivities: true,
        isContainer: false,
        weight: { min: 0, max: 100 },
        price: { min: 1, max: 5000 },
        spellLevel: { min: 0, max: 9 },
        folder: { name: 'Treasure', recursive: true },
        limit: 25,
        offset: 0
      });
      expect(result.success).toBe(true);
    });
  });
});
