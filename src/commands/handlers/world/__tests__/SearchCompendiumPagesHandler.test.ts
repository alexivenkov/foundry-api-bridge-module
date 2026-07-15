import { searchCompendiumPagesHandler } from '../SearchCompendiumPagesHandler';

interface MockJournalDoc {
  id: string;
  uuid: string;
  name: string;
  pages: Map<string, Record<string, unknown>>;
}

function makeJournalDoc(): MockJournalDoc {
  return {
    id: 'j1',
    uuid: 'Compendium.dnd5e.rules.JournalEntry.j1',
    name: 'Combat Rules',
    pages: new Map([
      [
        'p1',
        { id: 'p1', name: 'Grappling', type: 'rule', text: { content: '<p>Grab rules.</p>' } }
      ],
      [
        'p2',
        {
          id: 'p2',
          name: 'Conditions',
          type: 'rule',
          text: { content: '<p>The grappled condition restrains you.</p>' }
        }
      ]
    ])
  };
}

interface MockPack {
  collection: string;
  metadata: { label: string; type: string; system?: string; packageName?: string };
  index: { size: number };
  getDocuments: jest.Mock;
}

function makePack(collection: string, type: string, docs: MockJournalDoc[]): MockPack {
  return {
    collection,
    metadata: { label: 'Rules', type, system: 'dnd5e', packageName: 'dnd5e' },
    index: { size: docs.length },
    getDocuments: jest.fn(async () => docs)
  };
}

function setGame(packs: MockPack[]): void {
  (globalThis as Record<string, unknown>)['game'] = {
    packs: {
      get: (id: string): MockPack | undefined => packs.find(p => p.collection === id),
      forEach: (fn: (p: MockPack) => void): void => {
        packs.forEach(fn);
      }
    }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('searchCompendiumPagesHandler', () => {
  afterEach(clearGame);

  it('finds pages by name and content with snippets and page uuids', async () => {
    setGame([
      makePack('dnd5e.rules', 'JournalEntry', [makeJournalDoc()]),
      makePack('dnd5e.items', 'Item', [])
    ]);

    const result = await searchCompendiumPagesHandler({ query: 'grappl' });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      packId: 'dnd5e.rules',
      packLabel: 'Rules',
      journalId: 'j1',
      journalName: 'Combat Rules',
      pageId: 'p1',
      pageName: 'Grappling',
      pageType: 'rule',
      uuid: 'Compendium.dnd5e.rules.JournalEntry.j1.JournalEntryPage.p1',
      matchedIn: 'name',
      snippet: null
    });
    expect(result[1]?.matchedIn).toBe('content');
    expect(result[1]?.snippet).toContain('grappled condition');
  });

  it('returns [] for a blank query', async () => {
    setGame([makePack('dnd5e.rules', 'JournalEntry', [makeJournalDoc()])]);
    expect(await searchCompendiumPagesHandler({ query: '  ' })).toEqual([]);
  });

  it('surfaces loud errors for explicit non-journal packs', async () => {
    setGame([makePack('dnd5e.items', 'Item', [])]);

    await expect(
      searchCompendiumPagesHandler({ query: 'x', packIds: ['dnd5e.items'] })
    ).rejects.toThrow('Compendium pack is not an JournalEntry pack: dnd5e.items');
    await expect(
      searchCompendiumPagesHandler({ query: 'x', packIds: ['ghost'] })
    ).rejects.toThrow('Pack not found: ghost');
  });

  it('throws a formatted validation error for a missing query', async () => {
    setGame([]);
    await expect(
      searchCompendiumPagesHandler({} as { query: string })
    ).rejects.toThrow(/query/);
  });
});
