import { ValidationError } from '@/filtering/shared/domain/errors';
import {
  EnumSet,
  PaginationParams,
  Range,
  SubstringQuery
} from '@/filtering/shared/domain/value-objects';
import {
  ActorType,
  CreatureType,
  Disposition,
  FolderReference,
  Size
} from '@/filtering/actors/domain/value-objects';
import { filterActorsRequestSchema } from '../FilterActorsRequestSchema';
import type { FilterActorsRequest } from '../FilterActorsRequestSchema';
import { RequestToQueryMapper } from '../RequestToQueryMapper';

function parse(input: unknown): FilterActorsRequest {
  const result = filterActorsRequestSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`fixture failed to parse: ${JSON.stringify(result.error.issues)}`);
  }
  return result.data;
}

describe('RequestToQueryMapper', () => {
  describe('empty request', () => {
    it('produces a query with only the default pagination filled in', () => {
      const query = RequestToQueryMapper.toQuery(parse({}));
      expect(query.name).toBeUndefined();
      expect(query.types).toBeUndefined();
      expect(query.creatureTypes).toBeUndefined();
      expect(query.sizes).toBeUndefined();
      expect(query.dispositions).toBeUndefined();
      expect(query.hasPlayerOwner).toBeUndefined();
      expect(query.cr).toBeUndefined();
      expect(query.level).toBeUndefined();
      expect(query.maxHp).toBeUndefined();
      expect(query.currentHp).toBeUndefined();
      expect(query.ac).toBeUndefined();
      expect(query.abilities).toBeUndefined();
      expect(query.folder).toBeUndefined();
      expect(query.pagination).toBeInstanceOf(PaginationParams);
      expect(query.pagination.limit).toBe(PaginationParams.DEFAULT_LIMIT);
      expect(query.pagination.offset).toBe(PaginationParams.DEFAULT_OFFSET);
    });
  });

  describe('name', () => {
    it('maps a name string to a SubstringQuery', () => {
      const query = RequestToQueryMapper.toQuery(parse({ name: 'goblin' }));
      expect(query.name).toBeInstanceOf(SubstringQuery);
      expect(query.name?.normalized).toBe('goblin');
    });

    it('preserves trim+lowercase semantics', () => {
      const query = RequestToQueryMapper.toQuery(parse({ name: '  Goblin  ' }));
      expect(query.name?.normalized).toBe('goblin');
    });
  });

  describe('type / creatureType / size / disposition', () => {
    it('maps a type array to an EnumSet<ActorType>', () => {
      const query = RequestToQueryMapper.toQuery(parse({ type: ['npc', 'character'] }));
      expect(query.types).toBeInstanceOf(EnumSet);
      expect(query.types?.has(ActorType.Npc)).toBe(true);
      expect(query.types?.has(ActorType.Character)).toBe(true);
    });

    it('maps a creatureType array to an EnumSet<CreatureType>', () => {
      const query = RequestToQueryMapper.toQuery(parse({ creatureType: ['dragon'] }));
      expect(query.creatureTypes).toBeInstanceOf(EnumSet);
      expect(query.creatureTypes?.has(CreatureType.Dragon)).toBe(true);
    });

    it('maps a size array to an EnumSet<Size>', () => {
      const query = RequestToQueryMapper.toQuery(parse({ size: ['sm', 'med'] }));
      expect(query.sizes).toBeInstanceOf(EnumSet);
      expect(query.sizes?.has(Size.Small)).toBe(true);
      expect(query.sizes?.has(Size.Medium)).toBe(true);
    });

    it('maps a disposition array to an EnumSet<Disposition>', () => {
      const query = RequestToQueryMapper.toQuery(parse({ disposition: ['hostile'] }));
      expect(query.dispositions).toBeInstanceOf(EnumSet);
      expect(query.dispositions?.has(Disposition.Hostile)).toBe(true);
    });
  });

  describe('hasPlayerOwner', () => {
    it('maps true through unchanged', () => {
      const query = RequestToQueryMapper.toQuery(parse({ hasPlayerOwner: true }));
      expect(query.hasPlayerOwner).toBe(true);
    });

    it('maps false through unchanged', () => {
      const query = RequestToQueryMapper.toQuery(parse({ hasPlayerOwner: false }));
      expect(query.hasPlayerOwner).toBe(false);
    });
  });

  describe('numeric ranges', () => {
    it('maps cr to a Range', () => {
      const query = RequestToQueryMapper.toQuery(parse({ cr: { min: 0.25, max: 1 } }));
      expect(query.cr).toBeInstanceOf(Range);
      expect(query.cr?.min).toBe(0.25);
      expect(query.cr?.max).toBe(1);
    });

    it('maps level to a Range', () => {
      const query = RequestToQueryMapper.toQuery(parse({ level: { min: 1, max: 20 } }));
      expect(query.level).toBeInstanceOf(Range);
      expect(query.level?.min).toBe(1);
      expect(query.level?.max).toBe(20);
    });

    it('maps maxHp to a Range', () => {
      const query = RequestToQueryMapper.toQuery(parse({ maxHp: { min: 10 } }));
      expect(query.maxHp).toBeInstanceOf(Range);
      expect(query.maxHp?.min).toBe(10);
      expect(query.maxHp?.max).toBeUndefined();
    });

    it('maps currentHp to a Range', () => {
      const query = RequestToQueryMapper.toQuery(parse({ currentHp: { max: 50 } }));
      expect(query.currentHp).toBeInstanceOf(Range);
      expect(query.currentHp?.min).toBeUndefined();
      expect(query.currentHp?.max).toBe(50);
    });

    it('maps ac to a Range', () => {
      const query = RequestToQueryMapper.toQuery(parse({ ac: { min: 10, max: 30 } }));
      expect(query.ac).toBeInstanceOf(Range);
      expect(query.ac?.min).toBe(10);
      expect(query.ac?.max).toBe(30);
    });
  });

  describe('abilities', () => {
    it('maps a partial abilities object to an AbilityRangeMap', () => {
      const query = RequestToQueryMapper.toQuery(
        parse({ abilities: { str: { min: 12 }, dex: { min: 14, max: 18 } } })
      );
      expect(query.abilities).toBeDefined();
      expect(query.abilities?.str).toBeInstanceOf(Range);
      expect(query.abilities?.str?.min).toBe(12);
      expect(query.abilities?.dex).toBeInstanceOf(Range);
      expect(query.abilities?.dex?.min).toBe(14);
      expect(query.abilities?.dex?.max).toBe(18);
      expect(query.abilities?.con).toBeUndefined();
      expect(query.abilities?.int).toBeUndefined();
      expect(query.abilities?.wis).toBeUndefined();
      expect(query.abilities?.cha).toBeUndefined();
    });

    it('maps all six abilities when all are provided', () => {
      const query = RequestToQueryMapper.toQuery(
        parse({
          abilities: {
            str: { min: 1 },
            dex: { min: 2 },
            con: { min: 3 },
            int: { min: 4 },
            wis: { min: 5 },
            cha: { min: 6 }
          }
        })
      );
      expect(query.abilities?.str?.min).toBe(1);
      expect(query.abilities?.dex?.min).toBe(2);
      expect(query.abilities?.con?.min).toBe(3);
      expect(query.abilities?.int?.min).toBe(4);
      expect(query.abilities?.wis?.min).toBe(5);
      expect(query.abilities?.cha?.min).toBe(6);
    });
  });

  describe('folder', () => {
    it('maps an id-only reference with default recursive=false', () => {
      const query = RequestToQueryMapper.toQuery(parse({ folder: { id: 'folder-1' } }));
      expect(query.folder).toBeInstanceOf(FolderReference);
      expect(query.folder?.id).toBe('folder-1');
      expect(query.folder?.name).toBeUndefined();
      expect(query.folder?.recursive).toBe(false);
    });

    it('maps a name-only reference with recursive=true preserved', () => {
      const query = RequestToQueryMapper.toQuery(
        parse({ folder: { name: 'Monsters', recursive: true } })
      );
      expect(query.folder?.name).toBe('Monsters');
      expect(query.folder?.recursive).toBe(true);
    });

    it('maps explicit recursive=false', () => {
      const query = RequestToQueryMapper.toQuery(
        parse({ folder: { id: 'folder-1', recursive: false } })
      );
      expect(query.folder?.recursive).toBe(false);
    });
  });

  describe('pagination', () => {
    it('uses defaults when limit/offset omitted', () => {
      const query = RequestToQueryMapper.toQuery(parse({}));
      expect(query.pagination.limit).toBe(PaginationParams.DEFAULT_LIMIT);
      expect(query.pagination.offset).toBe(PaginationParams.DEFAULT_OFFSET);
    });

    it('respects an explicit limit', () => {
      const query = RequestToQueryMapper.toQuery(parse({ limit: 25 }));
      expect(query.pagination.limit).toBe(25);
      expect(query.pagination.offset).toBe(PaginationParams.DEFAULT_OFFSET);
    });

    it('respects an explicit offset', () => {
      const query = RequestToQueryMapper.toQuery(parse({ offset: 100 }));
      expect(query.pagination.offset).toBe(100);
      expect(query.pagination.limit).toBe(PaginationParams.DEFAULT_LIMIT);
    });

    it('respects both explicit limit and offset', () => {
      const query = RequestToQueryMapper.toQuery(parse({ limit: 10, offset: 5 }));
      expect(query.pagination.limit).toBe(10);
      expect(query.pagination.offset).toBe(5);
    });
  });

  describe('full request integration', () => {
    it('maps every supported field correctly', () => {
      const request = parse({
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
      const query = RequestToQueryMapper.toQuery(request);

      expect(query.name?.normalized).toBe('goblin');
      expect(query.types?.has(ActorType.Npc)).toBe(true);
      expect(query.creatureTypes?.has(CreatureType.Humanoid)).toBe(true);
      expect(query.sizes?.has(Size.Small)).toBe(true);
      expect(query.dispositions?.has(Disposition.Hostile)).toBe(true);
      expect(query.hasPlayerOwner).toBe(false);
      expect(query.cr?.min).toBe(0.25);
      expect(query.cr?.max).toBe(1);
      expect(query.level?.min).toBe(1);
      expect(query.level?.max).toBe(5);
      expect(query.maxHp?.min).toBe(1);
      expect(query.maxHp?.max).toBe(100);
      expect(query.currentHp?.min).toBe(0);
      expect(query.currentHp?.max).toBe(100);
      expect(query.ac?.min).toBe(10);
      expect(query.ac?.max).toBe(18);
      expect(query.abilities?.str?.min).toBe(8);
      expect(query.abilities?.str?.max).toBe(14);
      expect(query.abilities?.dex?.min).toBe(10);
      expect(query.folder?.name).toBe('Monsters');
      expect(query.folder?.recursive).toBe(true);
      expect(query.pagination.limit).toBe(25);
      expect(query.pagination.offset).toBe(0);
    });
  });

  describe('defensive: invalid input bypassing Zod', () => {
    it('propagates ValidationError when an invalid type slips through', () => {
      // Manually construct an "as-if-parsed" request with an invalid actor type
      // — Zod would reject this in normal flow, but we guarantee VO constructors will throw.
      const malformed = {
        type: ['unknown-type'] as unknown as ['character', ...string[]]
      } satisfies Partial<FilterActorsRequest>;
      expect(() => RequestToQueryMapper.toQuery(malformed)).toThrow(ValidationError);
    });
  });
});
