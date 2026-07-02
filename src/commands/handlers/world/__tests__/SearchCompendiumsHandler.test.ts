import { searchCompendiumsHandler } from '../SearchCompendiumsHandler';

interface MockEntry {
  _id?: string;
  id?: string;
  name?: string;
  type?: string | null;
}

interface MockPack {
  collection: string;
  metadata: { label: string; type: string; system?: string | undefined };
  entries: MockEntry[];
}

function createPack(overrides: Partial<MockPack> = {}): MockPack {
  return {
    collection: 'dnd5e.monsters',
    metadata: { label: 'Monsters', type: 'Actor', system: 'dnd5e' },
    entries: [],
    ...overrides
  };
}

function setGame(packs: MockPack[] | undefined): void {
  (globalThis as Record<string, unknown>)['game'] = {
    packs: packs === undefined
      ? undefined
      : {
          forEach: (fn: (pack: unknown) => void): void => {
            packs.forEach(p => fn({
              collection: p.collection,
              metadata: p.metadata,
              getIndex: (): Promise<{ forEach(cb: (e: MockEntry) => void): void }> =>
                Promise.resolve({
                  forEach: (cb: (e: MockEntry) => void): void => { p.entries.forEach(cb); }
                })
            }));
          }
        }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('searchCompendiumsHandler', () => {
  afterEach(clearGame);

  it('matches by name substring across packs, case-insensitively', async () => {
    setGame([
      createPack({
        collection: 'dnd5e.monsters',
        metadata: { label: 'Monsters', type: 'Actor', system: 'dnd5e' },
        entries: [
          { _id: 'g1', name: 'Goblin', type: 'npc' },
          { _id: 'h1', name: 'Hobgoblin', type: 'npc' },
          { _id: 'o1', name: 'Orc', type: 'npc' }
        ]
      }),
      createPack({
        collection: 'dnd5e.items',
        metadata: { label: 'Items', type: 'Item', system: 'dnd5e' },
        entries: [{ _id: 'gc1', name: 'Goblin Charm', type: 'wondrous' }]
      })
    ]);

    const result = await searchCompendiumsHandler({ query: 'GOBLIN' });

    expect(result.map(r => r.name)).toEqual(['Goblin', 'Hobgoblin', 'Goblin Charm']);
    expect(result[0]).toEqual({
      packId: 'dnd5e.monsters',
      packLabel: 'Monsters',
      packType: 'Actor',
      system: 'dnd5e',
      id: 'g1',
      name: 'Goblin',
      documentType: 'npc'
    });
  });

  it('returns [] for empty/whitespace query without touching packs', async () => {
    setGame([createPack({ entries: [{ _id: 'g1', name: 'Goblin' }] })]);

    expect(await searchCompendiumsHandler({ query: '' })).toEqual([]);
    expect(await searchCompendiumsHandler({ query: '   ' })).toEqual([]);
  });

  it('returns [] when there are no packs', async () => {
    setGame(undefined);

    expect(await searchCompendiumsHandler({ query: 'goblin' })).toEqual([]);
  });

  it('filters by document type of the pack', async () => {
    setGame([
      createPack({ collection: 'dnd5e.monsters', metadata: { label: 'Monsters', type: 'Actor', system: 'dnd5e' }, entries: [{ _id: 'g1', name: 'Goblin' }] }),
      createPack({ collection: 'dnd5e.items', metadata: { label: 'Items', type: 'Item', system: 'dnd5e' }, entries: [{ _id: 'gc1', name: 'Goblin Charm' }] })
    ]);

    const result = await searchCompendiumsHandler({ query: 'goblin', type: 'Actor' });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('g1');
    expect(result[0]?.packType).toBe('Actor');
  });

  it('filters by system', async () => {
    setGame([
      createPack({ collection: 'dnd5e.monsters', metadata: { label: 'Monsters', type: 'Actor', system: 'dnd5e' }, entries: [{ _id: 'g1', name: 'Goblin' }] }),
      createPack({ collection: 'pf2e.creatures', metadata: { label: 'Creatures', type: 'Actor', system: 'pf2e' }, entries: [{ _id: 'g2', name: 'Goblin Warrior' }] })
    ]);

    const result = await searchCompendiumsHandler({ query: 'goblin', system: 'pf2e' });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('g2');
    expect(result[0]?.system).toBe('pf2e');
  });

  it('caps results at the limit, including across packs', async () => {
    setGame([
      createPack({ collection: 'p.a', metadata: { label: 'A', type: 'Item', system: 'dnd5e' }, entries: [{ _id: 'a1', name: 'aardvark' }, { _id: 'a2', name: 'apple' }] }),
      createPack({ collection: 'p.b', metadata: { label: 'B', type: 'Item', system: 'dnd5e' }, entries: [{ _id: 'b1', name: 'axe' }] })
    ]);

    const result = await searchCompendiumsHandler({ query: 'a', limit: 2 });

    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(['a1', 'a2']);
  });

  it('defaults limit to 100', async () => {
    const entries: MockEntry[] = Array.from({ length: 150 }, (_, i) => ({ _id: `e${i}`, name: `alpha-${i}` }));
    setGame([createPack({ collection: 'p.big', metadata: { label: 'Big', type: 'Item', system: 'dnd5e' }, entries })]);

    const result = await searchCompendiumsHandler({ query: 'alpha' });

    expect(result).toHaveLength(100);
  });

  it('omits documentType when the index entry has no type', async () => {
    setGame([createPack({ collection: 'world.journals', metadata: { label: 'Journals', type: 'JournalEntry', system: undefined }, entries: [{ _id: 'j1', name: 'Goblin Lore' }] })]);

    const result = await searchCompendiumsHandler({ query: 'goblin' });

    expect(result[0]).not.toHaveProperty('documentType');
    expect(result[0]?.system).toBe('');
  });

  it('falls back to entry.id when _id is absent, and skips entries with no id', async () => {
    setGame([createPack({ entries: [
      { id: 'alt1', name: 'Goblin Scout' },
      { name: 'Goblin Ghost' }
    ] })]);

    const result = await searchCompendiumsHandler({ query: 'goblin' });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('alt1');
  });
});
