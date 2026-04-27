import {
  ANCIENT_RED_DRAGON,
  FRODO,
  GANDALF,
  GOBLIN,
  PARTY_GROUP,
  WAGON
} from '@/filtering/actors/domain/__tests__/fixtures/actorSnapshots';
import { FolderSpecification } from '../FolderSpecification';

describe('FolderSpecification', () => {
  it('matches actors whose folderId is in the allowed set', () => {
    const spec = new FolderSpecification(new Set(['folder-pcs']));
    expect(spec.isSatisfiedBy(GANDALF)).toBe(true);
    expect(spec.isSatisfiedBy(FRODO)).toBe(true);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
  });

  it('multi-folder set matches members of any listed folder', () => {
    const spec = new FolderSpecification(new Set(['folder-npcs', 'folder-vehicles']));
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(true);
    expect(spec.isSatisfiedBy(WAGON)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
  });

  it('empty allowed set rejects every actor', () => {
    const spec = new FolderSpecification(new Set<string>());
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
    expect(spec.isSatisfiedBy(FRODO)).toBe(false);
    expect(spec.isSatisfiedBy(GOBLIN)).toBe(false);
    expect(spec.isSatisfiedBy(WAGON)).toBe(false);
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(false);
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(false);
  });

  it('silent-excludes ANCIENT_RED_DRAGON (folderId=null, root-level)', () => {
    const spec = new FolderSpecification(new Set(['folder-npcs']));
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(false);
  });

  it('silent-excludes a root-level actor even when its allowed-set includes everything', () => {
    const spec = new FolderSpecification(
      new Set(['folder-pcs', 'folder-npcs', 'folder-vehicles', 'folder-groups'])
    );
    expect(spec.isSatisfiedBy(ANCIENT_RED_DRAGON)).toBe(false);
  });

  it('matches PARTY_GROUP via folder-groups', () => {
    const spec = new FolderSpecification(new Set(['folder-groups']));
    expect(spec.isSatisfiedBy(PARTY_GROUP)).toBe(true);
    expect(spec.isSatisfiedBy(GANDALF)).toBe(false);
  });
});
