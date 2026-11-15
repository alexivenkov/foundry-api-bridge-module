import { FoundryRollTableStore } from '../FoundryRollTableStore';
import type {
  FoundryRollTableDocument,
  FoundryRollTableGame,
  FoundryTableResultDocument
} from '../foundryRollTableTypes';

/** A result stored the pre-13 way: `text`, `documentCollection` and `documentId` are its own fields. */
function resultDocument(overrides: Partial<FoundryTableResultDocument> = {}): FoundryTableResultDocument {
  return {
    _id: 'r1',
    type: 'text',
    text: 'Goblin ambush',
    name: undefined,
    img: undefined,
    range: [1, 3],
    weight: 1,
    drawn: false,
    documentCollection: undefined,
    documentId: undefined,
    ...overrides
  };
}

/**
 * A result as Foundry 13.351 and 14.368 build it — the layout the real data
 * model shows: `name`, `description`, `documentUuid` and a nullable `img` are
 * own members, the pre-13 fields are deprecated accessors on the prototype.
 * Here the accessors throw, so a read that touches them fails the test.
 */
class CurrentResult {
  _id = 'r1';
  type: 'text' | 'document' = 'text';
  name = '';
  img: string | null = null;
  description = '';
  documentUuid: string | null | undefined = undefined;
  weight = 1;
  range: [number, number] = [1, 3];
  drawn = false;

  constructor(fields: Partial<CurrentResult> = {}) {
    Object.assign(this, fields);
  }

  get text(): never {
    throw new Error('TableResult#text is deprecated');
  }

  get documentCollection(): never {
    throw new Error('TableResult#documentCollection is deprecated');
  }

  get documentId(): never {
    throw new Error('TableResult#documentId is deprecated');
  }
}

function currentResult(fields: Partial<CurrentResult> = {}): FoundryTableResultDocument {
  return new CurrentResult(fields);
}

function tableDocument(
  results: FoundryTableResultDocument[] = [],
  overrides: Partial<FoundryRollTableDocument> = {}
): FoundryRollTableDocument {
  const doc: FoundryRollTableDocument = {
    id: 'encounters',
    name: 'Encounters',
    img: 'icons/d20.svg',
    description: '<p>Roadside</p>',
    formula: '1d6',
    replacement: true,
    displayRoll: true,
    results: { contents: results },
    roll: jest.fn(),
    draw: jest.fn(),
    resetResults: jest.fn().mockResolvedValue(undefined),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
  (doc.update as jest.Mock).mockImplementation((data: Partial<FoundryRollTableDocument>) => {
    Object.assign(doc, data);
    return Promise.resolve(doc);
  });
  return doc;
}

function storeFor(
  documents: FoundryRollTableDocument[],
  create: jest.Mock = jest.fn()
): FoundryRollTableStore {
  const game: FoundryRollTableGame = {
    tables: {
      get: (id) => documents.find((doc) => doc.id === id),
      forEach: (fn) => {
        documents.forEach(fn);
      },
      documentClass: { create }
    }
  };
  return new FoundryRollTableStore({ getGame: () => game });
}

function runningFoundry(generation: number): void {
  (globalThis as Record<string, unknown>)['game'] = { release: { generation } };
}

describe('FoundryRollTableStore', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  describe('reading a table', () => {
    it('maps the table and its rows', () => {
      const document = tableDocument([
        resultDocument({ _id: 'a', img: 'icons/goblin.webp' }),
        resultDocument({
          _id: 'b',
          type: 'document',
          text: 'Dragon',
          range: [4, 6],
          weight: 2,
          drawn: true,
          documentCollection: 'Actor',
          documentId: 'actor-1'
        })
      ]);

      expect(storeFor([document]).findTable('encounters')).toEqual({
        id: 'encounters',
        name: 'Encounters',
        img: 'icons/d20.svg',
        description: '<p>Roadside</p>',
        formula: '1d6',
        replacement: true,
        displayRoll: true,
        results: [
          {
            id: 'a',
            kind: 'text',
            text: 'Goblin ambush',
            img: 'icons/goblin.webp',
            range: [1, 3],
            weight: 1,
            drawn: false,
            documentCollection: null,
            documentId: null
          },
          {
            id: 'b',
            kind: 'document',
            text: 'Dragon',
            img: '',
            range: [4, 6],
            weight: 2,
            drawn: true,
            documentCollection: 'Actor',
            documentId: 'actor-1'
          }
        ]
      });
    });

    it('falls back to empty strings for a missing icon and description', () => {
      const document = tableDocument([], { img: undefined, description: undefined });

      expect(storeFor([document]).findTable('encounters')).toMatchObject({ img: '', description: '' });
    });

    it('takes the label from the name when the result has no text, and leaves it empty when it has neither', () => {
      const document = tableDocument([
        resultDocument({ _id: 'named', text: undefined, name: 'Treasure hoard' }),
        resultDocument({ _id: 'bare', text: undefined, name: undefined })
      ]);

      const rows = storeFor([document]).findTable('encounters')?.results.map((row) => row.text);

      expect(rows).toEqual(['Treasure hoard', '']);
    });

    it.each([
      ['text', 'text'],
      ['document', 'document'],
      ['pack', 'compendium'],
      ['something else', 'text'],
      [0, 'text'],
      [1, 'document'],
      [2, 'compendium'],
      [7, 'text']
    ] as const)('reads the pre-13 stored type %p as a %s result', (type, kind) => {
      const document = tableDocument([resultDocument({ type })]);

      expect(storeFor([document]).findTable('encounters')?.results[0]?.kind).toBe(kind);
    });

    it('returns null for an unknown table', () => {
      const store = storeFor([tableDocument()]);

      expect(store.findTable('missing')).toBeNull();
      expect(store.findOverview('missing')).toBeNull();
    });
  });

  describe('reading results of Foundry 13 and later', () => {
    function read(result: FoundryTableResultDocument): unknown {
      return storeFor([tableDocument([result])]).findTable('encounters')?.results[0];
    }

    it('reads a text result from its description, with no document reference', () => {
      const result = currentResult({ _id: 'a', description: '<p>Nothing happens</p>', range: [1, 2] });

      expect(read(result)).toEqual({
        id: 'a',
        kind: 'text',
        text: '<p>Nothing happens</p>',
        img: '',
        range: [1, 2],
        weight: 1,
        drawn: false,
        documentCollection: null,
        documentId: null
      });
    });

    it('reads a world document result from its name and its uuid', () => {
      const result = currentResult({
        _id: 'b',
        type: 'document',
        name: 'Dragon',
        img: 'icons/dragon.webp',
        documentUuid: 'Actor.aaaaaaaaaaaaaaaa',
        weight: 2,
        range: [3, 4],
        drawn: true
      });

      expect(read(result)).toEqual({
        id: 'b',
        kind: 'document',
        text: 'Dragon',
        img: 'icons/dragon.webp',
        range: [3, 4],
        weight: 2,
        drawn: true,
        documentCollection: 'Actor',
        documentId: 'aaaaaaaaaaaaaaaa'
      });
    });

    it.each([
      ['with the document type', 'Compendium.dnd5e.items.Item.bbbbbbbbbbbbbbbb'],
      ['in the older form without it', 'Compendium.dnd5e.items.bbbbbbbbbbbbbbbb']
    ])('reads a compendium entry %s as a compendium result of its pack', (_form, documentUuid) => {
      const result = currentResult({ type: 'document', name: 'Sword', documentUuid });

      expect(read(result)).toMatchObject({
        kind: 'compendium',
        text: 'Sword',
        documentCollection: 'dnd5e.items',
        documentId: 'bbbbbbbbbbbbbbbb'
      });
    });

    it.each([
      ['a world document', 'Actor.aaaaaaaaaaaaaaaa.Item.cccccccccccccccc', 'document', 'Item'],
      ['a compendium entry', 'Compendium.dnd5e.monsters.Actor.aaaaaaaaaaaaaaaa.Item.cccccccccccccccc', 'compendium', 'dnd5e.monsters'],
      ['an older-form compendium entry', 'Compendium.dnd5e.monsters.aaaaaaaaaaaaaaaa.Item.cccccccccccccccc', 'compendium', 'dnd5e.monsters']
    ])('names a document embedded in %s by its own id', (_case, documentUuid, kind, documentCollection) => {
      const result = currentResult({ type: 'document', name: 'Dagger', documentUuid });

      expect(read(result)).toMatchObject({ kind, documentCollection, documentId: 'cccccccccccccccc' });
    });

    it.each([
      ['no uuid', undefined],
      ['a null uuid', null],
      ['an empty uuid', ''],
      ['a uuid that is only an id', 'aaaaaaaaaaaaaaaa'],
      ['a uuid that names a pack and nothing in it', 'Compendium.dnd5e.items'],
      ['a uuid cut off after a document type', 'Actor.aaaaaaaaaaaaaaaa.Item']
    ])('reads a document result with %s as a document without a reference', (_case, documentUuid) => {
      const result = currentResult({ type: 'document', name: 'Dangling', documentUuid });

      expect(read(result)).toMatchObject({
        kind: 'document',
        text: 'Dangling',
        documentCollection: null,
        documentId: null
      });
    });

    it('keeps a text result text even when it carries a reference', () => {
      const result = currentResult({ description: 'See the sword', documentUuid: 'Compendium.dnd5e.items.Item.bbbbbbbbbbbbbbbb' });

      expect(read(result)).toMatchObject({
        kind: 'text',
        text: 'See the sword',
        documentCollection: 'dnd5e.items',
        documentId: 'bbbbbbbbbbbbbbbb'
      });
    });

    it('takes the description of a text result even when it is empty, not the name', () => {
      expect(read(currentResult({ name: 'Unused label', description: '' }))).toMatchObject({ kind: 'text', text: '' });
    });

    it('reads the rows a draw lands on the same way', async () => {
      const document = tableDocument();
      (document.draw as jest.Mock).mockResolvedValue({
        roll: { formula: '1d6', total: 5 },
        results: [currentResult({ type: 'document', name: 'Sword', documentUuid: 'Compendium.dnd5e.items.Item.bbbbbbbbbbbbbbbb' })]
      });

      const draw = await storeFor([document]).draw('encounters', true);

      expect(draw?.results).toEqual([
        expect.objectContaining({ kind: 'compendium', text: 'Sword', documentCollection: 'dnd5e.items' })
      ]);
    });
  });

  describe('overviews', () => {
    it('lists every table with its row counts', () => {
      const store = storeFor([
        tableDocument([resultDocument({ drawn: true }), resultDocument({ _id: 'r2' })]),
        tableDocument([], { id: 'loot', name: 'Loot', formula: '1d100', replacement: false })
      ]);

      expect(store.listTables()).toEqual([
        {
          id: 'encounters',
          name: 'Encounters',
          img: 'icons/d20.svg',
          description: '<p>Roadside</p>',
          formula: '1d6',
          replacement: true,
          totalResults: 2,
          drawnResults: 1
        },
        {
          id: 'loot',
          name: 'Loot',
          img: 'icons/d20.svg',
          description: '<p>Roadside</p>',
          formula: '1d100',
          replacement: false,
          totalResults: 0,
          drawnResults: 0
        }
      ]);
    });

    it('counts rows without reading their label or document reference', () => {
      const guarded = resultDocument({ drawn: true });
      for (const accessor of ['text', 'name', 'documentCollection', 'documentId'] as const) {
        Object.defineProperty(guarded, accessor, {
          get: (): never => {
            throw new Error(`${accessor} was read`);
          }
        });
      }
      const store = storeFor([tableDocument([guarded])]);

      expect(store.findOverview('encounters')).toMatchObject({ totalResults: 1, drawnResults: 1 });
      expect(store.listTables()).toHaveLength(1);
    });
  });

  describe('createTable', () => {
    it('writes the table with its rows and returns what the core created', async () => {
      const create = jest.fn().mockResolvedValue(tableDocument([], { id: 'new', name: 'Weather' }));

      const created = await storeFor([], create).createTable({
        name: 'Weather',
        formula: '1d4',
        replacement: false,
        displayRoll: false,
        description: '<p>Sky</p>',
        img: 'icons/sun.webp',
        folderId: 'folder-1',
        results: [
          { kind: 'text', text: 'Clear', range: [1, 2], weight: 3 },
          {
            kind: 'document',
            text: 'Storm',
            range: [3, 4],
            weight: 1,
            img: 'icons/storm.webp',
            documentCollection: 'JournalEntry',
            documentId: 'journal-1'
          }
        ]
      });

      expect(create).toHaveBeenCalledWith({
        name: 'Weather',
        formula: '1d4',
        replacement: false,
        displayRoll: false,
        description: '<p>Sky</p>',
        img: 'icons/sun.webp',
        folder: 'folder-1',
        results: [
          { type: 0, text: 'Clear', range: [1, 2], weight: 3 },
          {
            type: 1,
            text: 'Storm',
            range: [3, 4],
            weight: 1,
            img: 'icons/storm.webp',
            documentCollection: 'JournalEntry',
            documentId: 'journal-1'
          }
        ]
      });
      expect(created).toMatchObject({ id: 'new', name: 'Weather' });
    });

    it('sends only the attributes that are set', async () => {
      const create = jest.fn().mockResolvedValue(tableDocument());

      await storeFor([], create).createTable({
        name: 'Bare',
        formula: '1d20',
        replacement: true,
        displayRoll: true,
        description: undefined,
        results: [{ kind: 'text', text: 'Only row', range: [1, 20], weight: 1, img: undefined }]
      });

      const payload = create.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(Object.keys(payload)).toEqual(['name', 'formula', 'replacement', 'displayRoll', 'results']);
      expect(Object.keys((payload['results'] as Record<string, unknown>[])[0] ?? {})).toEqual([
        'type',
        'text',
        'range',
        'weight'
      ]);
    });

    const everyKind = [
      { kind: 'text', text: 'A', range: [1, 1], weight: 1 },
      { kind: 'document', text: 'B', range: [2, 2], weight: 1 },
      { kind: 'compendium', text: 'C', range: [3, 3], weight: 1 }
    ] as const;

    async function sentTypes(): Promise<unknown[]> {
      const create = jest.fn().mockResolvedValue(tableDocument());
      await storeFor([], create).createTable({
        name: 'Kinds',
        formula: '1d3',
        replacement: true,
        displayRoll: true,
        results: everyKind
      });
      const payload = create.mock.calls[0]?.[0] as { results: Array<{ type: unknown }> };
      return payload.results.map((row) => row.type);
    }

    it('sends the legacy numeric result type below Foundry 14, which migrates it itself', async () => {
      runningFoundry(13);

      await expect(sentTypes()).resolves.toEqual([0, 1, 2]);
    });

    it('sends the result type as a string from Foundry 14 on, a compendium row as a document', async () => {
      runningFoundry(14);

      await expect(sentTypes()).resolves.toEqual(['text', 'document', 'document']);
    });

    it('sends the numeric type when the Foundry version is unknown', async () => {
      await expect(sentTypes()).resolves.toEqual([0, 1, 2]);
    });

    it('resolves to null when the core created nothing', async () => {
      const create = jest.fn().mockResolvedValue(undefined);
      const draft = { name: 'Vetoed', formula: '1d20', replacement: true, displayRoll: true };

      await expect(storeFor([], create).createTable(draft)).resolves.toBeNull();
    });
  });

  describe('updateTable', () => {
    it('sends a partial update and returns the table as it is afterwards', async () => {
      const document = tableDocument();

      const updated = await storeFor([document]).updateTable('encounters', {
        name: 'Ambushes',
        replacement: false,
        formula: undefined
      });

      expect(document.update).toHaveBeenCalledWith({ name: 'Ambushes', replacement: false });
      expect(updated).toMatchObject({ name: 'Ambushes', replacement: false, formula: '1d6' });
    });

    it('sends an empty update when nothing is set', async () => {
      const document = tableDocument();

      await storeFor([document]).updateTable('encounters', {});

      expect(document.update).toHaveBeenCalledWith({});
    });

    it('resolves to null for an unknown table', async () => {
      await expect(storeFor([]).updateTable('missing', { name: 'x' })).resolves.toBeNull();
    });
  });

  describe('draw', () => {
    it('draws with the chat option only and maps the roll and the rows it landed on', async () => {
      const document = tableDocument();
      (document.draw as jest.Mock).mockResolvedValue({
        roll: { formula: '1d6', total: 4 },
        results: [resultDocument({ _id: 'hit', type: 'document', text: 'Dragon', drawn: true })]
      });

      const draw = await storeFor([document]).draw('encounters', false);

      expect(document.draw).toHaveBeenCalledWith({ displayChat: false });
      expect(document.roll).not.toHaveBeenCalled();
      expect(draw).toMatchObject({ formula: '1d6', total: 4 });
      expect(draw?.results).toEqual([expect.objectContaining({ id: 'hit', kind: 'document', drawn: true })]);
    });

    it('resolves to null for an unknown table', async () => {
      await expect(storeFor([]).draw('missing', true)).resolves.toBeNull();
    });
  });

  it('resets the drawn rows through the core', async () => {
    const document = tableDocument();

    await storeFor([document]).resetResults('encounters');

    expect(document.resetResults).toHaveBeenCalledTimes(1);
  });

  it('deletes the table document', async () => {
    const document = tableDocument();

    await storeFor([document]).deleteTable('encounters');

    expect(document.delete).toHaveBeenCalledTimes(1);
  });

  it('leaves an unknown table alone when asked to reset or delete it', async () => {
    const store = storeFor([]);

    await expect(store.resetResults('missing')).resolves.toBeUndefined();
    await expect(store.deleteTable('missing')).resolves.toBeUndefined();
  });
});
