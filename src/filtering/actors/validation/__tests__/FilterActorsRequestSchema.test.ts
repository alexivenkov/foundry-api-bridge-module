import { filterActorsRequestSchema } from '../FilterActorsRequestSchema';

describe('filterActorsRequestSchema', () => {
  describe('empty / minimal', () => {
    it('accepts an empty object (all fields optional)', () => {
      expect(filterActorsRequestSchema.safeParse({}).success).toBe(true);
    });
  });

  describe('name', () => {
    it('accepts a non-empty name', () => {
      const result = filterActorsRequestSchema.safeParse({ name: 'goblin' });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.name).toBe('goblin');
    });

    it('trims whitespace from name', () => {
      const result = filterActorsRequestSchema.safeParse({ name: '  goblin  ' });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.name).toBe('goblin');
    });

    it('rejects whitespace-only name (empty after trim)', () => {
      const result = filterActorsRequestSchema.safeParse({ name: '   ' });
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.issues[0]?.message).toBe('name must be non-empty after trim');
    });

    it('rejects empty string name', () => {
      const result = filterActorsRequestSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects non-string name', () => {
      expect(filterActorsRequestSchema.safeParse({ name: 42 }).success).toBe(false);
    });
  });

  describe('type', () => {
    it('accepts a valid type array', () => {
      expect(filterActorsRequestSchema.safeParse({ type: ['npc'] }).success).toBe(true);
    });

    it('rejects an invalid type value', () => {
      const result = filterActorsRequestSchema.safeParse({ type: ['unknown'] });
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.issues[0]?.message).toBe("unknown actorType: 'unknown'");
    });

    it('rejects empty type array', () => {
      const result = filterActorsRequestSchema.safeParse({ type: [] });
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.issues[0]?.message).toBe('type array must not be empty');
    });
  });

  describe('creatureType', () => {
    it('accepts a valid creatureType array', () => {
      expect(
        filterActorsRequestSchema.safeParse({ creatureType: ['dragon'] }).success
      ).toBe(true);
    });

    it('rejects unknown creatureType', () => {
      const result = filterActorsRequestSchema.safeParse({ creatureType: ['robot'] });
      expect(result.success).toBe(false);
    });
  });

  describe('size', () => {
    it('accepts a valid size array', () => {
      expect(filterActorsRequestSchema.safeParse({ size: ['med'] }).success).toBe(true);
    });

    it('rejects "small" (only "sm" is valid)', () => {
      const result = filterActorsRequestSchema.safeParse({ size: ['small'] });
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.issues[0]?.message).toBe("unknown size: 'small'");
    });
  });

  describe('disposition', () => {
    it('accepts a valid disposition array', () => {
      expect(
        filterActorsRequestSchema.safeParse({ disposition: ['hostile'] }).success
      ).toBe(true);
    });

    it('rejects unknown disposition', () => {
      expect(
        filterActorsRequestSchema.safeParse({ disposition: ['evil'] }).success
      ).toBe(false);
    });
  });

  describe('hasPlayerOwner', () => {
    it('accepts true', () => {
      expect(
        filterActorsRequestSchema.safeParse({ hasPlayerOwner: true }).success
      ).toBe(true);
    });

    it('accepts false', () => {
      expect(
        filterActorsRequestSchema.safeParse({ hasPlayerOwner: false }).success
      ).toBe(true);
    });

    it('rejects a non-boolean value', () => {
      expect(
        filterActorsRequestSchema.safeParse({ hasPlayerOwner: 'yes' }).success
      ).toBe(false);
    });
  });

  describe('cr', () => {
    it('accepts a valid CR range', () => {
      expect(
        filterActorsRequestSchema.safeParse({ cr: { min: 0.25, max: 1 } }).success
      ).toBe(true);
    });

    it('rejects a CR not in the allowed list', () => {
      expect(
        filterActorsRequestSchema.safeParse({ cr: { min: 0.7 } }).success
      ).toBe(false);
    });
  });

  describe('level', () => {
    it('accepts a valid level range', () => {
      expect(
        filterActorsRequestSchema.safeParse({ level: { min: 1, max: 20 } }).success
      ).toBe(true);
    });

    it('accepts level === 0 (minBound: 0)', () => {
      expect(
        filterActorsRequestSchema.safeParse({ level: { min: 0 } }).success
      ).toBe(true);
    });

    it('rejects a fractional level', () => {
      expect(
        filterActorsRequestSchema.safeParse({ level: { min: 1.5 } }).success
      ).toBe(false);
    });

    it('rejects a negative level', () => {
      expect(
        filterActorsRequestSchema.safeParse({ level: { min: -1 } }).success
      ).toBe(false);
    });
  });

  describe('maxHp / currentHp / ac', () => {
    it('accepts valid maxHp range', () => {
      expect(
        filterActorsRequestSchema.safeParse({ maxHp: { min: 1, max: 500 } }).success
      ).toBe(true);
    });

    it('accepts valid currentHp range', () => {
      expect(
        filterActorsRequestSchema.safeParse({ currentHp: { min: 0, max: 100 } }).success
      ).toBe(true);
    });

    it('accepts valid ac range', () => {
      expect(
        filterActorsRequestSchema.safeParse({ ac: { min: 10, max: 30 } }).success
      ).toBe(true);
    });

    it('rejects negative maxHp', () => {
      expect(
        filterActorsRequestSchema.safeParse({ maxHp: { min: -1 } }).success
      ).toBe(false);
    });

    it('rejects fractional ac', () => {
      expect(
        filterActorsRequestSchema.safeParse({ ac: { min: 12.5 } }).success
      ).toBe(false);
    });
  });

  describe('abilities', () => {
    it('accepts a valid abilities object', () => {
      expect(
        filterActorsRequestSchema.safeParse({
          abilities: { str: { min: 12 }, dex: { max: 18 } }
        }).success
      ).toBe(true);
    });

    it('rejects an empty abilities object', () => {
      const result = filterActorsRequestSchema.safeParse({ abilities: {} });
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.issues[0]?.message).toBe(
        'abilities must specify at least one ability range'
      );
    });
  });

  describe('folder', () => {
    it('accepts a valid folder reference with id', () => {
      expect(
        filterActorsRequestSchema.safeParse({ folder: { id: 'folder-1' } }).success
      ).toBe(true);
    });

    it('accepts a valid folder reference with name and recursive', () => {
      expect(
        filterActorsRequestSchema.safeParse({
          folder: { name: 'Monsters', recursive: true }
        }).success
      ).toBe(true);
    });

    it('rejects an empty folder object', () => {
      const result = filterActorsRequestSchema.safeParse({ folder: {} });
      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error.issues[0]?.message).toBe(
        "folder must specify at least 'id' or 'name'"
      );
    });
  });

  describe('limit', () => {
    it('accepts limit at lower bound (1)', () => {
      expect(filterActorsRequestSchema.safeParse({ limit: 1 }).success).toBe(true);
    });

    it('accepts limit at upper bound (200)', () => {
      expect(filterActorsRequestSchema.safeParse({ limit: 200 }).success).toBe(true);
    });

    it('rejects limit === 0', () => {
      expect(filterActorsRequestSchema.safeParse({ limit: 0 }).success).toBe(false);
    });

    it('rejects limit > 200', () => {
      expect(filterActorsRequestSchema.safeParse({ limit: 201 }).success).toBe(false);
    });

    it('rejects fractional limit', () => {
      expect(filterActorsRequestSchema.safeParse({ limit: 50.5 }).success).toBe(false);
    });

    it('rejects non-number limit', () => {
      expect(filterActorsRequestSchema.safeParse({ limit: '50' }).success).toBe(false);
    });
  });

  describe('offset', () => {
    it('accepts offset === 0', () => {
      expect(filterActorsRequestSchema.safeParse({ offset: 0 }).success).toBe(true);
    });

    it('accepts a positive offset', () => {
      expect(filterActorsRequestSchema.safeParse({ offset: 100 }).success).toBe(true);
    });

    it('rejects negative offset', () => {
      expect(filterActorsRequestSchema.safeParse({ offset: -1 }).success).toBe(false);
    });

    it('rejects fractional offset', () => {
      expect(filterActorsRequestSchema.safeParse({ offset: 1.5 }).success).toBe(false);
    });
  });

  describe('full request', () => {
    it('accepts a request that uses every supported field', () => {
      const result = filterActorsRequestSchema.safeParse({
        name: 'goblin',
        type: ['npc'],
        creatureType: ['humanoid'],
        size: ['sm'],
        disposition: ['hostile'],
        hasPlayerOwner: false,
        cr: { min: 0.25, max: 1 },
        level: { min: 1, max: 5 },
        maxHp: { min: 1, max: 100 },
        currentHp: { min: 0, max: 100 },
        ac: { min: 10, max: 18 },
        abilities: { str: { min: 8, max: 14 }, dex: { min: 10 } },
        folder: { name: 'Monsters', recursive: true },
        limit: 25,
        offset: 0
      });
      expect(result.success).toBe(true);
    });
  });

  describe('unknown fields (permissive)', () => {
    it('silently ignores unknown top-level fields', () => {
      const result = filterActorsRequestSchema.safeParse({
        name: 'goblin',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        creature_type: ['humanoid']
      });
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect((result.data as Record<string, unknown>)['creature_type']).toBeUndefined();
    });
  });
});
