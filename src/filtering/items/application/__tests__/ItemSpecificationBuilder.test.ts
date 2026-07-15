import {
  EnumSet,
  FolderReference,
  PaginationParams,
  Range,
  SubstringQuery
} from '@/kernel/domain/value-objects';
import type { FolderResolver } from '@/kernel/domain/repository';
import {
  ItemRarity,
  ItemType,
  SpellSchool
} from '@/filtering/items/domain/value-objects';
import type { ItemSnapshot } from '@/filtering/items/domain/snapshot';
import {
  ALL_FIXTURES,
  ARTIFACT_OF_DEAD,
  CANTRIP_LIGHT,
  CASK,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING,
  RING_OF_PROTECTION,
  UNKNOWN_RING
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';

import { ItemSpecificationBuilder } from '../ItemSpecificationBuilder';
import type { FilterItemsQuery } from '../FilterItemsQuery';

const makeFolderResolver = (
  ids: readonly string[] = []
): FolderResolver & { resolve: jest.Mock } => ({
  resolve: jest.fn().mockReturnValue(new Set<string>(ids))
});

const baseQuery = (overrides: Partial<FilterItemsQuery> = {}): FilterItemsQuery => ({
  pagination: PaginationParams.default(),
  ...overrides
});

const filterFixtures = (
  spec: { isSatisfiedBy(i: ItemSnapshot): boolean },
  fixtures: readonly ItemSnapshot[] = ALL_FIXTURES
): ItemSnapshot[] => fixtures.filter((i) => spec.isSatisfiedBy(i));

describe('ItemSpecificationBuilder', () => {
  describe('empty query', () => {
    it('returns spec satisfied by every fixture (AlwaysTrue-equivalent)', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery());

      expect(filterFixtures(spec)).toEqual(ALL_FIXTURES);
    });

    it('does not invoke folder resolver when query.folder is absent', () => {
      const resolver = makeFolderResolver();
      const builder = new ItemSpecificationBuilder(resolver);
      builder.build(baseQuery());
      expect(resolver.resolve).not.toHaveBeenCalled();
    });
  });

  describe('name filter', () => {
    it('matches only items whose name contains the substring (case-insensitive)', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ name: new SubstringQuery('LONG') }));
      expect(filterFixtures(spec)).toEqual([LONGSWORD]);
    });

    it('returns empty when no item matches', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ name: new SubstringQuery('xyz123') }));
      expect(filterFixtures(spec)).toEqual([]);
    });
  });

  describe('type filter', () => {
    it('returns only spells when types=[Spell]', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({ types: new EnumSet<ItemType>([ItemType.Spell]) })
      );
      expect(filterFixtures(spec)).toEqual([FIREBALL, CANTRIP_LIGHT]);
    });

    it('combines weapon and equipment', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({
          types: new EnumSet<ItemType>([ItemType.Weapon, ItemType.Equipment])
        })
      );
      expect(filterFixtures(spec)).toEqual([
        LONGSWORD,
        RING_OF_PROTECTION,
        ARTIFACT_OF_DEAD,
        UNKNOWN_RING
      ]);
    });
  });

  describe('rarities filter', () => {
    it('matches rare or artifact items', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({
          rarities: new EnumSet<ItemRarity>([
            ItemRarity.Rare,
            ItemRarity.Artifact
          ])
        })
      );
      expect(filterFixtures(spec)).toEqual([
        RING_OF_PROTECTION,
        ARTIFACT_OF_DEAD,
        UNKNOWN_RING
      ]);
    });
  });

  describe('spellSchools filter', () => {
    it('matches all evocation spells', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({
          spellSchools: new EnumSet<SpellSchool>([SpellSchool.Evocation])
        })
      );
      expect(filterFixtures(spec)).toEqual([FIREBALL, CANTRIP_LIGHT]);
    });
  });

  describe('boolean filters', () => {
    it('requiresAttunement=true', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ requiresAttunement: true }));
      expect(filterFixtures(spec)).toEqual([
        RING_OF_PROTECTION,
        ARTIFACT_OF_DEAD,
        UNKNOWN_RING
      ]);
    });

    it('identified=false', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ identified: false }));
      expect(filterFixtures(spec)).toEqual([UNKNOWN_RING]);
    });

    it('hasActivities=false', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ hasActivities: false }));
      expect(filterFixtures(spec)).toEqual([
        RING_OF_PROTECTION,
        CANTRIP_LIGHT,
        CASK,
        UNKNOWN_RING
      ]);
    });

    it('isContainer=true', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ isContainer: true }));
      expect(filterFixtures(spec)).toEqual([CASK]);
    });
  });

  describe('range filters', () => {
    it('weight in [0, 1]', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ weight: new Range(0, 1) }));
      expect(filterFixtures(spec)).toEqual([
        POTION_OF_HEALING,
        RING_OF_PROTECTION,
        UNKNOWN_RING
      ]);
    });

    it('price >= 1000', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ price: new Range(1000, undefined) }));
      expect(filterFixtures(spec)).toEqual([RING_OF_PROTECTION, ARTIFACT_OF_DEAD]);
    });

    it('spellLevel >= 1 (excludes cantrips and non-spells)', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(baseQuery({ spellLevel: new Range(1, 9) }));
      expect(filterFixtures(spec)).toEqual([FIREBALL]);
    });
  });

  describe('folder filter', () => {
    it('uses ids returned by folderResolver to match by folderId', () => {
      const resolver = makeFolderResolver(['folder-spells']);
      const builder = new ItemSpecificationBuilder(resolver);
      const folderRef = new FolderReference('folder-spells', undefined, false);
      const spec = builder.build(baseQuery({ folder: folderRef }));

      expect(resolver.resolve).toHaveBeenCalledTimes(1);
      expect(resolver.resolve).toHaveBeenCalledWith(folderRef);
      expect(filterFixtures(spec)).toEqual([FIREBALL, CANTRIP_LIGHT]);
    });

    it('excludes items with null folderId regardless of resolver output', () => {
      const resolver = makeFolderResolver(['folder-weapons']);
      const builder = new ItemSpecificationBuilder(resolver);
      const folderRef = new FolderReference('folder-weapons', undefined, false);
      const spec = builder.build(baseQuery({ folder: folderRef }));

      expect(filterFixtures(spec)).not.toContain(CASK);
    });
  });

  describe('composite query', () => {
    it('type=[Spell] AND spellLevel>=3 → only FIREBALL', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({
          types: new EnumSet<ItemType>([ItemType.Spell]),
          spellLevel: new Range(3, 9)
        })
      );
      expect(filterFixtures(spec)).toEqual([FIREBALL]);
    });

    it('type=[Equipment] AND requiresAttunement=true AND price>=1000', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({
          types: new EnumSet<ItemType>([ItemType.Equipment]),
          requiresAttunement: true,
          price: new Range(1000, undefined)
        })
      );
      expect(filterFixtures(spec)).toEqual([RING_OF_PROTECTION, ARTIFACT_OF_DEAD]);
    });

    it('returns empty when no item satisfies the composite filter', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());
      const spec = builder.build(
        baseQuery({
          types: new EnumSet<ItemType>([ItemType.Spell]),
          rarities: new EnumSet<ItemRarity>([ItemRarity.Legendary])
        })
      );
      expect(filterFixtures(spec)).toEqual([]);
    });
  });

  describe('folder resolver invocation', () => {
    it('calls resolver.resolve once per build() with a folder query', () => {
      const resolver = makeFolderResolver(['folder-magic']);
      const builder = new ItemSpecificationBuilder(resolver);
      const folderRef = new FolderReference('folder-magic', undefined, false);

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
        .mockReturnValueOnce(new Set<string>(['folder-weapons']))
        .mockReturnValueOnce(new Set<string>(['folder-spells']));

      const builder = new ItemSpecificationBuilder(resolver);
      const folderRef = new FolderReference('folder-x', undefined, false);

      const spec1 = builder.build(baseQuery({ folder: folderRef }));
      const spec2 = builder.build(baseQuery({ folder: folderRef }));

      expect(filterFixtures(spec1)).toEqual([LONGSWORD]);
      expect(filterFixtures(spec2)).toEqual([FIREBALL, CANTRIP_LIGHT]);
    });
  });

  describe('immutability between builds', () => {
    it('different queries produce independent specs', () => {
      const builder = new ItemSpecificationBuilder(makeFolderResolver());

      const spec1 = builder.build(
        baseQuery({ types: new EnumSet<ItemType>([ItemType.Weapon]) })
      );
      const spec2 = builder.build(
        baseQuery({ types: new EnumSet<ItemType>([ItemType.Spell]) })
      );

      expect(filterFixtures(spec1)).toEqual([LONGSWORD]);
      expect(filterFixtures(spec2)).toEqual([FIREBALL, CANTRIP_LIGHT]);
    });
  });
});
