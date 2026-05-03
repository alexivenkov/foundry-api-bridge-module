import {
  ALL_FIXTURES,
  CASK,
  FIREBALL,
  LONGSWORD,
  POTION_OF_HEALING,
  RING_OF_PROTECTION
} from '@/filtering/items/domain/__tests__/fixtures/itemSnapshots';
import { FolderSpecification } from '../FolderSpecification';

describe('FolderSpecification (items)', () => {
  it('matches items whose folderId is in the allowed set', () => {
    const spec = new FolderSpecification(new Set(['folder-weapons']));
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(true);
    expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(false);
  });

  it('multi-folder set matches members of any listed folder', () => {
    const spec = new FolderSpecification(new Set(['folder-magic', 'folder-spells']));
    expect(spec.isSatisfiedBy(RING_OF_PROTECTION)).toBe(true);
    expect(spec.isSatisfiedBy(FIREBALL)).toBe(true);
    expect(spec.isSatisfiedBy(LONGSWORD)).toBe(false);
  });

  it('empty allowed set rejects every item', () => {
    const spec = new FolderSpecification(new Set<string>());
    for (const item of ALL_FIXTURES) {
      expect(spec.isSatisfiedBy(item)).toBe(false);
    }
  });

  it('silent-excludes CASK (folderId=null, root-level)', () => {
    const spec = new FolderSpecification(new Set(['folder-weapons']));
    expect(spec.isSatisfiedBy(CASK)).toBe(false);
  });

  it('silent-excludes a root-level item even with all-permissive set', () => {
    const spec = new FolderSpecification(
      new Set([
        'folder-weapons',
        'folder-potions',
        'folder-magic',
        'folder-spells'
      ])
    );
    expect(spec.isSatisfiedBy(CASK)).toBe(false);
    expect(spec.isSatisfiedBy(POTION_OF_HEALING)).toBe(true);
  });
});
