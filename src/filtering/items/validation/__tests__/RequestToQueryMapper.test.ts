import { ValidationError } from '@/kernel/domain/errors';
import {
  EnumSet,
  FolderReference,
  PaginationParams,
  Range,
  SubstringQuery
} from '@/kernel/domain/value-objects';
import {
  ItemRarity,
  ItemType,
  SpellSchool
} from '@/filtering/items/domain/value-objects';
import { filterItemsRequestSchema } from '../FilterItemsRequestSchema';
import type { FilterItemsRequest } from '../FilterItemsRequestSchema';
import { RequestToQueryMapper } from '../RequestToQueryMapper';

function parse(input: unknown): FilterItemsRequest {
  const result = filterItemsRequestSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`fixture failed to parse: ${JSON.stringify(result.error.issues)}`);
  }
  return result.data;
}

describe('RequestToQueryMapper (items)', () => {
  describe('empty request', () => {
    it('produces a query with only the default pagination', () => {
      const query = RequestToQueryMapper.toQuery(parse({}));
      expect(query.name).toBeUndefined();
      expect(query.types).toBeUndefined();
      expect(query.rarities).toBeUndefined();
      expect(query.spellSchools).toBeUndefined();
      expect(query.requiresAttunement).toBeUndefined();
      expect(query.identified).toBeUndefined();
      expect(query.hasActivities).toBeUndefined();
      expect(query.isContainer).toBeUndefined();
      expect(query.weight).toBeUndefined();
      expect(query.price).toBeUndefined();
      expect(query.spellLevel).toBeUndefined();
      expect(query.folder).toBeUndefined();
      expect(query.pagination).toBeInstanceOf(PaginationParams);
      expect(query.pagination.limit).toBe(PaginationParams.DEFAULT_LIMIT);
      expect(query.pagination.offset).toBe(PaginationParams.DEFAULT_OFFSET);
    });
  });

  describe('name', () => {
    it('maps name to SubstringQuery', () => {
      const q = RequestToQueryMapper.toQuery(parse({ name: 'sword' }));
      expect(q.name).toBeInstanceOf(SubstringQuery);
      expect(q.name?.normalized).toBe('sword');
    });

    it('preserves trim+lowercase', () => {
      const q = RequestToQueryMapper.toQuery(parse({ name: '  Sword  ' }));
      expect(q.name?.normalized).toBe('sword');
    });
  });

  describe('type / rarity / spellSchool', () => {
    it('maps type array to EnumSet<ItemType>', () => {
      const q = RequestToQueryMapper.toQuery(parse({ type: ['weapon', 'spell'] }));
      expect(q.types).toBeInstanceOf(EnumSet);
      expect(q.types?.has(ItemType.Weapon)).toBe(true);
      expect(q.types?.has(ItemType.Spell)).toBe(true);
    });

    it('maps rarity array to EnumSet<ItemRarity>', () => {
      const q = RequestToQueryMapper.toQuery(parse({ rarity: ['rare', 'legendary'] }));
      expect(q.rarities).toBeInstanceOf(EnumSet);
      expect(q.rarities?.has(ItemRarity.Rare)).toBe(true);
      expect(q.rarities?.has(ItemRarity.Legendary)).toBe(true);
    });

    it('rarity "veryRare" maps to ItemRarity.VeryRare', () => {
      const q = RequestToQueryMapper.toQuery(parse({ rarity: ['veryRare'] }));
      expect(q.rarities?.has(ItemRarity.VeryRare)).toBe(true);
    });

    it('rarity "very rare" (spaced) maps to ItemRarity.VeryRare', () => {
      const q = RequestToQueryMapper.toQuery(parse({ rarity: ['very rare'] }));
      expect(q.rarities?.has(ItemRarity.VeryRare)).toBe(true);
    });

    it('maps spellSchool array to EnumSet<SpellSchool>', () => {
      const q = RequestToQueryMapper.toQuery(parse({ spellSchool: ['evocation'] }));
      expect(q.spellSchools).toBeInstanceOf(EnumSet);
      expect(q.spellSchools?.has(SpellSchool.Evocation)).toBe(true);
    });
  });

  describe('boolean filters', () => {
    it('requiresAttunement true', () => {
      const q = RequestToQueryMapper.toQuery(parse({ requiresAttunement: true }));
      expect(q.requiresAttunement).toBe(true);
    });

    it('identified false', () => {
      const q = RequestToQueryMapper.toQuery(parse({ identified: false }));
      expect(q.identified).toBe(false);
    });

    it('hasActivities true', () => {
      const q = RequestToQueryMapper.toQuery(parse({ hasActivities: true }));
      expect(q.hasActivities).toBe(true);
    });

    it('isContainer true', () => {
      const q = RequestToQueryMapper.toQuery(parse({ isContainer: true }));
      expect(q.isContainer).toBe(true);
    });
  });

  describe('range filters', () => {
    it('maps weight to Range', () => {
      const q = RequestToQueryMapper.toQuery(parse({ weight: { min: 0, max: 5 } }));
      expect(q.weight).toBeInstanceOf(Range);
      expect(q.weight?.min).toBe(0);
      expect(q.weight?.max).toBe(5);
    });

    it('maps price to Range', () => {
      const q = RequestToQueryMapper.toQuery(parse({ price: { min: 0, max: 100 } }));
      expect(q.price).toBeInstanceOf(Range);
      expect(q.price?.min).toBe(0);
      expect(q.price?.max).toBe(100);
    });

    it('maps spellLevel to Range', () => {
      const q = RequestToQueryMapper.toQuery(parse({ spellLevel: { min: 1, max: 5 } }));
      expect(q.spellLevel).toBeInstanceOf(Range);
      expect(q.spellLevel?.min).toBe(1);
      expect(q.spellLevel?.max).toBe(5);
    });
  });

  describe('folder', () => {
    it('maps id-only with default recursive=false', () => {
      const q = RequestToQueryMapper.toQuery(parse({ folder: { id: 'f1' } }));
      expect(q.folder).toBeInstanceOf(FolderReference);
      expect(q.folder?.id).toBe('f1');
      expect(q.folder?.recursive).toBe(false);
    });

    it('maps name-only with recursive=true preserved', () => {
      const q = RequestToQueryMapper.toQuery(
        parse({ folder: { name: 'Treasure', recursive: true } })
      );
      expect(q.folder?.name).toBe('Treasure');
      expect(q.folder?.recursive).toBe(true);
    });
  });

  describe('pagination', () => {
    it('uses defaults when limit/offset omitted', () => {
      const q = RequestToQueryMapper.toQuery(parse({}));
      expect(q.pagination.limit).toBe(PaginationParams.DEFAULT_LIMIT);
      expect(q.pagination.offset).toBe(PaginationParams.DEFAULT_OFFSET);
    });

    it('respects explicit limit and offset', () => {
      const q = RequestToQueryMapper.toQuery(parse({ limit: 10, offset: 5 }));
      expect(q.pagination.limit).toBe(10);
      expect(q.pagination.offset).toBe(5);
    });
  });

  describe('full integration', () => {
    it('maps every supported field correctly', () => {
      const request = parse({
        name: 'fire',
        type: ['spell'],
        rarity: ['rare'],
        spellSchool: ['evocation'],
        requiresAttunement: false,
        identified: true,
        hasActivities: true,
        isContainer: false,
        weight: { min: 0, max: 10 },
        price: { min: 0, max: 5000 },
        spellLevel: { min: 1, max: 9 },
        folder: { name: 'Spells', recursive: true },
        limit: 25,
        offset: 0
      });
      const q = RequestToQueryMapper.toQuery(request);

      expect(q.name?.normalized).toBe('fire');
      expect(q.types?.has(ItemType.Spell)).toBe(true);
      expect(q.rarities?.has(ItemRarity.Rare)).toBe(true);
      expect(q.spellSchools?.has(SpellSchool.Evocation)).toBe(true);
      expect(q.requiresAttunement).toBe(false);
      expect(q.identified).toBe(true);
      expect(q.hasActivities).toBe(true);
      expect(q.isContainer).toBe(false);
      expect(q.weight?.min).toBe(0);
      expect(q.weight?.max).toBe(10);
      expect(q.price?.max).toBe(5000);
      expect(q.spellLevel?.min).toBe(1);
      expect(q.folder?.name).toBe('Spells');
      expect(q.folder?.recursive).toBe(true);
      expect(q.pagination.limit).toBe(25);
    });
  });

  describe('defensive: invalid input bypassing Zod', () => {
    it('propagates ValidationError when an invalid type slips through', () => {
      const malformed = {
        type: ['unknown-type'] as unknown as ['weapon', ...string[]]
      } satisfies Partial<FilterItemsRequest>;
      expect(() => RequestToQueryMapper.toQuery(malformed)).toThrow(ValidationError);
    });
  });
});
