import {
  ADVENTURE_CONTENT_TYPES,
  COMPENDIUM_PACK_TYPES,
  PACK_OWNERSHIP_LEVELS,
  adventureContents,
  countDocuments,
  defaultDuplicateLabel,
  isWorldDocumentPackType,
  mergePackOwnership,
  packFolderSubtree,
  summarizeGroups
} from '..';

describe('mergePackOwnership', () => {
  const current = { player: 'observer', trusted: 'inherit', assistant: 'owner' } as const;

  it('changes only the given roles', () => {
    expect(mergePackOwnership(current, { trusted: 'owner' })).toEqual({
      player: 'observer',
      trusted: 'owner',
      assistant: 'owner'
    });
  });

  it('keeps everything for an empty change', () => {
    expect(mergePackOwnership(current, {})).toEqual(current);
  });

  it('lists the five core levels', () => {
    expect(PACK_OWNERSHIP_LEVELS).toEqual(['inherit', 'none', 'limited', 'observer', 'owner']);
  });
});

describe('pack document types', () => {
  it('treats only types with a world collection as world document packs', () => {
    expect(isWorldDocumentPackType('Actor')).toBe(true);
    expect(isWorldDocumentPackType('Scene')).toBe(true);
    expect(isWorldDocumentPackType('Adventure')).toBe(false);
    expect(isWorldDocumentPackType('ActiveEffect')).toBe(false);
  });

  it('knows every v14 compendium type and every adventure content type', () => {
    expect(COMPENDIUM_PACK_TYPES).toHaveLength(10);
    expect(ADVENTURE_CONTENT_TYPES).toEqual([
      'Actor', 'Combat', 'Item', 'JournalEntry', 'Scene', 'RollTable', 'Macro', 'Cards', 'Playlist', 'Folder'
    ]);
  });

  it('labels a copy the way the core UI does in English', () => {
    expect(defaultDuplicateLabel('Monsters')).toBe('Copy of Monsters');
  });
});

describe('packFolderSubtree', () => {
  const folders = [
    { id: 'a', name: 'A', parentId: null },
    { id: 'b', name: 'B', parentId: 'a' },
    { id: 'c', name: 'C', parentId: 'b' },
    { id: 'd', name: 'D', parentId: null },
    { id: 'e', name: 'E', parentId: 'a' }
  ];

  it('returns the folder and its descendants, parents first', () => {
    expect(packFolderSubtree(folders, 'a')).toEqual(['a', 'b', 'e', 'c']);
  });

  it('returns only the folder for a leaf', () => {
    expect(packFolderSubtree(folders, 'd')).toEqual(['d']);
  });

  it('stops on a cycle', () => {
    const cyclic = [
      { id: 'x', name: 'X', parentId: 'y' },
      { id: 'y', name: 'Y', parentId: 'x' }
    ];
    expect(packFolderSubtree(cyclic, 'x')).toEqual(['x', 'y']);
  });
});

describe('adventure contents', () => {
  const plan = {
    toCreate: [
      { documentType: 'Actor', documents: [{ id: 'a1', name: 'Goblin' }] },
      { documentType: 'Scene', documents: [{ id: 's1', name: 'Cave' }] }
    ],
    toUpdate: [{ documentType: 'Actor', documents: [{ id: 'a2', name: 'Boss' }] }]
  };

  it('merges created and replaced documents per type', () => {
    expect(adventureContents(plan)).toEqual([
      {
        documentType: 'Actor',
        entries: [
          { id: 'a1', name: 'Goblin', existsInWorld: false },
          { id: 'a2', name: 'Boss', existsInWorld: true }
        ]
      },
      { documentType: 'Scene', entries: [{ id: 's1', name: 'Cave', existsInWorld: false }] }
    ]);
  });

  it('counts and summarizes groups', () => {
    expect(countDocuments(plan.toCreate)).toBe(2);
    expect(summarizeGroups([...plan.toCreate, { documentType: 'Item', documents: [] }])).toBe('Actor 1, Scene 1');
  });
});
