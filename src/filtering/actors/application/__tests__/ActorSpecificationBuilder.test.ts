import {
  EnumSet,
  PaginationParams,
  Range,
  SubstringQuery
} from '@/kernel/domain/value-objects';
import {
  ActorType,
  CreatureType,
  Disposition,
  FolderReference,
  Size
} from '@/filtering/actors/domain/value-objects';
import type { ActorSnapshot } from '@/filtering/actors/domain/snapshot';
import {
  ALL_FIXTURES,
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';

import { ActorSpecificationBuilder } from '../ActorSpecificationBuilder';
import type { FolderResolver } from '../ActorSpecificationBuilder';
import type { FilterActorsQuery } from '../FilterActorsQuery';

const makeFolderResolver = (
  ids: readonly string[] = []
): FolderResolver & { resolve: jest.Mock } => ({
  resolve: jest.fn().mockReturnValue(new Set<string>(ids))
});

const baseQuery = (overrides: Partial<FilterActorsQuery> = {}): FilterActorsQuery => ({
  pagination: PaginationParams.default(),
  ...overrides
});

const filterFixtures = (
  spec: { isSatisfiedBy(a: ActorSnapshot): boolean },
  fixtures: readonly ActorSnapshot[] = ALL_FIXTURES
): ActorSnapshot[] => fixtures.filter((a) => spec.isSatisfiedBy(a));

describe('ActorSpecificationBuilder', () => {
  describe('empty query', () => {
    it('returns spec satisfied by every fixture (AlwaysTrue-equivalent)', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery());

      const matched = filterFixtures(spec);
      expect(matched).toEqual(ALL_FIXTURES);
    });

    it('does not invoke folder resolver when query.folder is absent', () => {
      const resolver = makeFolderResolver();
      const builder = new ActorSpecificationBuilder(resolver);

      builder.build(baseQuery());

      expect(resolver.resolve).not.toHaveBeenCalled();
    });
  });

  describe('name filter', () => {
    it('matches only actors whose name contains the substring (case-insensitive)', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ name: new SubstringQuery('GAN') }));

      const matched = filterFixtures(spec);
      expect(matched).toEqual([GANDALF]);
    });

    it('returns empty when no actor matches the name substring', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ name: new SubstringQuery('xyzzy') }));

      expect(filterFixtures(spec)).toEqual([]);
    });
  });

  describe('type filter', () => {
    it('returns only NPCs when types=[Npc]', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({ types: new EnumSet<ActorType>([ActorType.Npc]) })
      );

      const matched = filterFixtures(spec);
      expect(matched).toEqual([GOBLIN, ANCIENT_RED_DRAGON]);
    });

    it('returns Characters and Vehicles when types=[Character, Vehicle]', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({
          types: new EnumSet<ActorType>([ActorType.Character, ActorType.Vehicle])
        })
      );

      const matched = filterFixtures(spec);
      expect(matched).toEqual([GANDALF, FRODO, WAGON]);
    });
  });

  describe('creatureTypes filter', () => {
    it('matches only the dragon when creatureTypes=[Dragon]', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({ creatureTypes: new EnumSet<CreatureType>([CreatureType.Dragon]) })
      );

      expect(filterFixtures(spec)).toEqual([ANCIENT_RED_DRAGON]);
    });
  });

  describe('sizes filter', () => {
    it('matches only Gargantuan-sized actors', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({ sizes: new EnumSet<Size>([Size.Gargantuan]) })
      );

      expect(filterFixtures(spec)).toEqual([ANCIENT_RED_DRAGON]);
    });
  });

  describe('dispositions filter', () => {
    it('matches only Hostile actors', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({ dispositions: new EnumSet<Disposition>([Disposition.Hostile]) })
      );

      expect(filterFixtures(spec)).toEqual([GOBLIN, ANCIENT_RED_DRAGON]);
    });
  });

  describe('hasPlayerOwner filter', () => {
    it('returns only player-owned actors when hasPlayerOwner=true', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ hasPlayerOwner: true }));

      expect(filterFixtures(spec)).toEqual([GANDALF, FRODO, PARTY_GROUP]);
    });

    it('returns only non-player-owned actors when hasPlayerOwner=false', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ hasPlayerOwner: false }));

      expect(filterFixtures(spec)).toEqual([GOBLIN, ANCIENT_RED_DRAGON, WAGON]);
    });
  });

  describe('cr range filter', () => {
    it('returns only actors with cr in [20, +inf)', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ cr: new Range(20, undefined) }));

      expect(filterFixtures(spec)).toEqual([ANCIENT_RED_DRAGON]);
    });

    it('excludes actors with null cr (PCs, vehicles, groups)', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ cr: new Range(0, 100) }));

      expect(filterFixtures(spec)).toEqual([GOBLIN, ANCIENT_RED_DRAGON]);
    });
  });

  describe('level range filter', () => {
    it('returns only actors with level in [10, 20]', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ level: new Range(10, 20) }));

      expect(filterFixtures(spec)).toEqual([GANDALF]);
    });
  });

  describe('maxHp range filter', () => {
    it('returns only actors with maxHp >= 100', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ maxHp: new Range(100, undefined) }));

      expect(filterFixtures(spec)).toEqual([GANDALF, ANCIENT_RED_DRAGON]);
    });
  });

  describe('currentHp range filter', () => {
    it('returns only actors with currentHp <= 30', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ currentHp: new Range(undefined, 30) }));

      expect(filterFixtures(spec)).toEqual([FRODO, GOBLIN]);
    });
  });

  describe('ac range filter', () => {
    it('returns only actors with ac >= 17', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ ac: new Range(17, undefined) }));

      expect(filterFixtures(spec)).toEqual([GANDALF, ANCIENT_RED_DRAGON]);
    });
  });

  describe('abilities range filter', () => {
    it('returns only actors with str >= 20', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({ abilities: { str: new Range(20, undefined) } })
      );

      expect(filterFixtures(spec)).toEqual([ANCIENT_RED_DRAGON]);
    });

    it('combines multiple ability ranges (int >= 18 AND wis >= 15)', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({
          abilities: {
            int: new Range(18, undefined),
            wis: new Range(15, undefined)
          }
        })
      );

      expect(filterFixtures(spec)).toEqual([GANDALF, ANCIENT_RED_DRAGON]);
    });
  });

  describe('folder filter', () => {
    it('uses ids returned by folderResolver to match by folderId', () => {
      const resolver = makeFolderResolver(['folder-pcs']);
      const builder = new ActorSpecificationBuilder(resolver);
      const folderRef = new FolderReference('folder-pcs', undefined, false);
      const spec = builder.build(baseQuery({ folder: folderRef }));

      expect(resolver.resolve).toHaveBeenCalledTimes(1);
      expect(resolver.resolve).toHaveBeenCalledWith(folderRef);
      expect(filterFixtures(spec)).toEqual([GANDALF, FRODO]);
    });

    it('includes multiple folders when resolver returns a multi-id set', () => {
      const resolver = makeFolderResolver(['folder-pcs', 'folder-npcs']);
      const builder = new ActorSpecificationBuilder(resolver);
      const folderRef = new FolderReference(undefined, 'roots', true);
      const spec = builder.build(baseQuery({ folder: folderRef }));

      expect(filterFixtures(spec)).toEqual([GANDALF, FRODO, GOBLIN]);
    });

    it('excludes actors with null folderId regardless of resolver output', () => {
      const resolver = makeFolderResolver(['folder-pcs']);
      const builder = new ActorSpecificationBuilder(resolver);
      const folderRef = new FolderReference('folder-pcs', undefined, false);
      const spec = builder.build(baseQuery({ folder: folderRef }));

      // ANCIENT_RED_DRAGON has folderId=null — must not be included even
      // if folder-pcs is in the resolver output.
      expect(filterFixtures(spec)).not.toContain(ANCIENT_RED_DRAGON);
    });
  });

  describe('composite query', () => {
    it('combines type=[Npc] AND cr>=20 AND sizes=[Gargantuan] → only the dragon', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({
          types: new EnumSet<ActorType>([ActorType.Npc]),
          cr: new Range(20, undefined),
          sizes: new EnumSet<Size>([Size.Gargantuan])
        })
      );

      expect(filterFixtures(spec)).toEqual([ANCIENT_RED_DRAGON]);
    });

    it('combines name + type + cr → narrows down progressively', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({
          name: new SubstringQuery('dragon'),
          types: new EnumSet<ActorType>([ActorType.Npc]),
          cr: new Range(0, 30)
        })
      );

      expect(filterFixtures(spec)).toEqual([ANCIENT_RED_DRAGON]);
    });

    it('returns empty array when no actor satisfies the composite filter', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({
          types: new EnumSet<ActorType>([ActorType.Character]),
          cr: new Range(10, 20)
        })
      );

      expect(filterFixtures(spec)).toEqual([]);
    });
  });

  describe('folder resolver invocation', () => {
    it('calls resolver.resolve once per build() with a folder query', () => {
      const resolver = makeFolderResolver(['folder-pcs']);
      const builder = new ActorSpecificationBuilder(resolver);
      const folderRef = new FolderReference('folder-pcs', undefined, false);

      builder.build(baseQuery({ folder: folderRef }));
      builder.build(baseQuery({ folder: folderRef }));
      builder.build(baseQuery({ folder: folderRef }));

      expect(resolver.resolve).toHaveBeenCalledTimes(3);
    });

    it('does not cache resolver output between build() calls', () => {
      const resolver: FolderResolver & { resolve: jest.Mock } = {
        resolve: jest.fn()
      };
      resolver.resolve
        .mockReturnValueOnce(new Set<string>(['folder-pcs']))
        .mockReturnValueOnce(new Set<string>(['folder-npcs']));

      const builder = new ActorSpecificationBuilder(resolver);
      const folderRef = new FolderReference('folder-x', undefined, false);

      const spec1 = builder.build(baseQuery({ folder: folderRef }));
      const spec2 = builder.build(baseQuery({ folder: folderRef }));

      expect(filterFixtures(spec1)).toEqual([GANDALF, FRODO]);
      expect(filterFixtures(spec2)).toEqual([GOBLIN]);
    });
  });

  describe('immutability between builds', () => {
    it('builds with different queries are independent', () => {
      const builder = new ActorSpecificationBuilder(makeFolderResolver());

      const spec1 = builder.build(
        baseQuery({ types: new EnumSet<ActorType>([ActorType.Npc]) })
      );
      const spec2 = builder.build(
        baseQuery({ types: new EnumSet<ActorType>([ActorType.Character]) })
      );

      expect(filterFixtures(spec1)).toEqual([GOBLIN, ANCIENT_RED_DRAGON]);
      expect(filterFixtures(spec2)).toEqual([GANDALF, FRODO]);
    });
  });
});
