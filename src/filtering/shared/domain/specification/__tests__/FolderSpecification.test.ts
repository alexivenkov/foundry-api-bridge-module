import { CompositeSpecification } from '../CompositeSpecification';
import { FolderSpecification } from '../FolderSpecification';

interface SampleItem {
  id: string;
  name: string;
  folderId: string | null;
}

const ITEM_IN_F1: SampleItem = { id: 'i1', name: 'In F1', folderId: 'f1' };
const ITEM_IN_F2: SampleItem = { id: 'i2', name: 'In F2', folderId: 'f2' };
const ITEM_NO_FOLDER: SampleItem = { id: 'i3', name: 'Rootless', folderId: null };

const folderIdOf = (item: SampleItem): string | null => item.folderId;

describe('FolderSpecification (generic shared kernel)', () => {
  it('matches items whose folder id is in the allowed set', () => {
    const spec = new FolderSpecification<SampleItem>(new Set(['f1']), folderIdOf);

    expect(spec.isSatisfiedBy(ITEM_IN_F1)).toBe(true);
    expect(spec.isSatisfiedBy(ITEM_IN_F2)).toBe(false);
  });

  it('multi-folder set matches members of any listed folder', () => {
    const spec = new FolderSpecification<SampleItem>(new Set(['f1', 'f2']), folderIdOf);

    expect(spec.isSatisfiedBy(ITEM_IN_F1)).toBe(true);
    expect(spec.isSatisfiedBy(ITEM_IN_F2)).toBe(true);
  });

  it('empty allowed set rejects every item', () => {
    const spec = new FolderSpecification<SampleItem>(new Set<string>(), folderIdOf);

    expect(spec.isSatisfiedBy(ITEM_IN_F1)).toBe(false);
    expect(spec.isSatisfiedBy(ITEM_IN_F2)).toBe(false);
  });

  it('silent-excludes items whose extractor returns null', () => {
    const spec = new FolderSpecification<SampleItem>(new Set(['f1', 'f2']), folderIdOf);

    expect(spec.isSatisfiedBy(ITEM_NO_FOLDER)).toBe(false);
  });

  it('uses the supplied extractor (not a hard-coded property)', () => {
    interface Doc {
      id: string;
      groupId: string | null;
    }
    const spec = new FolderSpecification<Doc>(
      new Set(['g1']),
      (d) => d.groupId
    );

    expect(spec.isSatisfiedBy({ id: 'd1', groupId: 'g1' })).toBe(true);
    expect(spec.isSatisfiedBy({ id: 'd2', groupId: 'g2' })).toBe(false);
    expect(spec.isSatisfiedBy({ id: 'd3', groupId: null })).toBe(false);
  });

  it('extractor receiving the candidate is the original object', () => {
    const seen: SampleItem[] = [];
    const spec = new FolderSpecification<SampleItem>(
      new Set(['f1']),
      (item) => {
        seen.push(item);
        return item.folderId;
      }
    );

    spec.isSatisfiedBy(ITEM_IN_F1);
    expect(seen).toEqual([ITEM_IN_F1]);
  });

  it('integrates with CompositeSpecification.and()', () => {
    const folderSpec = new FolderSpecification<SampleItem>(
      new Set(['f1']),
      folderIdOf
    );

    class NameStartsWithIn extends CompositeSpecification<SampleItem> {
      override isSatisfiedBy(item: SampleItem): boolean {
        return item.name.startsWith('In');
      }
    }

    const composed = folderSpec.and(new NameStartsWithIn());
    expect(composed.isSatisfiedBy(ITEM_IN_F1)).toBe(true);
    expect(composed.isSatisfiedBy({ ...ITEM_IN_F1, name: 'Other' })).toBe(false);
  });
});
