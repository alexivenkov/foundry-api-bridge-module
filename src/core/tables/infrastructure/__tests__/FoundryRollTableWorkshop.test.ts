import { FoundryRollTableWorkshop } from '../FoundryRollTableWorkshop';
import { FoundryTableLookups, FoundryTableRollFormulas } from '../FoundryTableLookups';
import type {
  FoundryRollTableWorkshopDocument,
  FoundryRollTableWorkshopGame,
  FoundryTableFolderDocument,
  FoundryTableResultDocument,
  TableRollGlobalsProvider
} from '../foundryRollTableTypes';

/** A result as Foundry 13.351 / 14.368 store it (the layout the data-model probe showed). */
function currentResult(fields: Partial<FoundryTableResultDocument> = {}): FoundryTableResultDocument {
  return {
    _id: 'r1',
    type: 'text',
    name: '',
    description: 'Goblins',
    documentUuid: undefined,
    img: null,
    range: [1, 3],
    weight: 1,
    drawn: false,
    text: undefined,
    documentCollection: undefined,
    documentId: undefined,
    ...fields
  };
}

function tableDocument(results: FoundryTableResultDocument[] = [currentResult()]): FoundryRollTableWorkshopDocument {
  const rows = [...results];
  const doc: FoundryRollTableWorkshopDocument = {
    id: 'encounters',
    name: 'Encounters',
    img: 'icons/d20.svg',
    description: '',
    formula: '1d6',
    replacement: true,
    displayRoll: true,
    folder: null,
    results: {
      contents: rows,
      get: (id) => rows.find((entry) => entry._id === id)
    },
    roll: jest.fn().mockResolvedValue({ roll: { formula: '1d6', total: 4 }, results: [rows[0]] }),
    draw: jest.fn().mockResolvedValue({ roll: { formula: '1d6', total: 2 }, results: [rows[0]] }),
    drawMany: jest.fn().mockResolvedValue({
      roll: {
        formula: '{1d6,1d6}',
        total: 7,
        terms: [{ rolls: [{ formula: '1d6', total: 3 }, { formula: '1d6', total: 4 }] }]
      },
      results: rows
    }),
    normalize: jest.fn().mockResolvedValue(undefined),
    resetResults: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createEmbeddedDocuments: jest.fn((_type: string, data: Record<string, unknown>[]) => {
      const created = currentResult({ _id: 'new', ...(data[0] as Partial<FoundryTableResultDocument>) });
      rows.push(created);
      return Promise.resolve([created]);
    }),
    updateEmbeddedDocuments: jest.fn((_type: string, updates: Record<string, unknown>[]) => {
      for (const update of updates) {
        const target = rows.find((entry) => entry._id === update['_id']);
        if (target) {
          Object.assign(target, update);
        }
      }
      return Promise.resolve(updates);
    }),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([])
  };
  return doc;
}

const folders: Record<string, FoundryTableFolderDocument> = {
  monsters: { id: 'monsters', name: 'Monsters', type: 'Actor', contents: [{}, {}, {}] }
};

function gameWith(document: FoundryRollTableWorkshopDocument, fromFolder: jest.Mock = jest.fn()): FoundryRollTableWorkshopGame {
  return {
    tables: {
      get: (id) => (id === document.id ? document : undefined),
      forEach: (fn) => {
        fn(document);
      },
      documentClass: { create: jest.fn(), fromFolder }
    },
    folders: { get: (id) => folders[id] },
    packs: { get: (id) => (id === 'dnd5e.items' ? { documentName: 'Item' } : undefined) }
  };
}

const roll = { formula: '2d6' };
const rollGlobals: TableRollGlobalsProvider = () => ({
  Roll: Object.assign(
    function RollStub(this: { dice: unknown[] }, formula: string) {
      this.dice = formula === '3d6+1d4' ? [{ number: 3 }, { number: 1 }] : [{ number: undefined }];
    } as unknown as ReturnType<TableRollGlobalsProvider>['Roll'],
    { create: jest.fn(() => roll), validate: jest.fn((formula: string) => formula !== 'bad') }
  )
});

function workshopFor(document: FoundryRollTableWorkshopDocument, fromFolder?: jest.Mock): FoundryRollTableWorkshop {
  const game = gameWith(document, fromFolder);
  return new FoundryRollTableWorkshop({ getGame: () => game }, rollGlobals);
}

function runningFoundry(generation: number): void {
  (globalThis as Record<string, unknown>)['game'] = { release: { generation } };
}

describe('FoundryRollTableWorkshop', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  describe('draw', () => {
    it('passes the options of a single draw, with the roll mode up to Foundry 13', async () => {
      runningFoundry(13);
      const document = tableDocument();

      const draw = await workshopFor(document).draw('encounters', true, {
        count: 1,
        recursive: false,
        visibility: 'blind',
        formula: '2d6'
      });

      expect(document.draw).toHaveBeenCalledWith({ displayChat: true, recursive: false, roll, rollMode: 'blindroll' });
      expect(document.drawMany).not.toHaveBeenCalled();
      expect(draw).toMatchObject({ formula: '1d6', total: 2 });
      expect(draw?.rolls).toBeUndefined();
    });

    it('passes the visibility as a message mode from Foundry 14 on', async () => {
      runningFoundry(14);
      const document = tableDocument();

      await workshopFor(document).draw('encounters', false, { count: 1, recursive: true, visibility: 'gm' });

      expect(document.draw).toHaveBeenCalledWith({ displayChat: false, recursive: true, messageMode: 'gm' });
    });

    it('draws several rows with drawMany and reports each roll of the pool', async () => {
      const document = tableDocument([currentResult(), currentResult({ _id: 'r2', description: 'Orcs' })]);

      const draw = await workshopFor(document).draw('encounters', true, { count: 2, recursive: true });

      expect(document.drawMany).toHaveBeenCalledWith(2, { displayChat: true, recursive: true });
      expect(draw).toMatchObject({ formula: '{1d6,1d6}', total: 7 });
      expect(draw?.rolls).toEqual([
        { formula: '1d6', total: 3 },
        { formula: '1d6', total: 4 }
      ]);
      expect(draw?.results.map((result) => result.text)).toEqual(['Goblins', 'Orcs']);
    });

    it('reads a multiple draw that made no roll as no rolls', async () => {
      const document = tableDocument();
      (document.drawMany as jest.Mock).mockResolvedValue({ roll: { formula: '', total: 0, terms: [] }, results: [] });

      const draw = await workshopFor(document).draw('encounters', true, { count: 5, recursive: true });

      expect(draw?.rolls).toEqual([]);
    });

    it('resolves to null for an unknown table', async () => {
      await expect(workshopFor(tableDocument()).draw('gone', true, { count: 1, recursive: true })).resolves.toBeNull();
    });
  });

  it('previews with RollTable#roll, which neither posts nor marks anything', async () => {
    const document = tableDocument();

    const draw = await workshopFor(document).preview('encounters', { recursive: true, formula: '2d6' });

    expect(document.roll).toHaveBeenCalledWith({ recursive: true, roll });
    expect(document.draw).not.toHaveBeenCalled();
    expect(draw).toMatchObject({ total: 4, results: [expect.objectContaining({ text: 'Goblins' })] });
  });

  it('normalizes through the core and reads the table back', async () => {
    const document = tableDocument();

    const normalized = await workshopFor(document).normalize('encounters');

    expect(document.normalize).toHaveBeenCalledWith();
    expect(normalized).toMatchObject({ id: 'encounters', folderId: null });
    await expect(workshopFor(document).normalize('gone')).resolves.toBeNull();
  });

  it('builds a table from a folder without opening its sheet', async () => {
    const created = tableDocument();
    const fromFolder = jest.fn().mockResolvedValue(created);

    const table = await workshopFor(tableDocument(), fromFolder).createFromFolder('monsters');

    expect(fromFolder).toHaveBeenCalledWith(folders['monsters'], { renderSheet: false });
    expect(table).toMatchObject({ id: 'encounters' });
    await expect(workshopFor(tableDocument(), fromFolder).createFromFolder('nowhere')).resolves.toBeNull();
  });

  it('resolves to null when the core vetoes the table from a folder', async () => {
    const fromFolder = jest.fn().mockResolvedValue(undefined);

    await expect(workshopFor(tableDocument(), fromFolder).createFromFolder('monsters')).resolves.toBeNull();
  });

  describe('creating a row', () => {
    it.each([13, 14])('writes the current fields on Foundry %p', async (generation) => {
      runningFoundry(generation);
      const document = tableDocument();

      const result = await workshopFor(document).createResult('encounters', {
        kind: 'compendium',
        text: 'Sword',
        range: [4, 5],
        weight: 2,
        img: 'icons/sword.webp',
        documentCollection: 'dnd5e.items',
        documentId: 'bbbbbbbbbbbbbbbb'
      });

      expect(document.createEmbeddedDocuments).toHaveBeenCalledWith('TableResult', [
        {
          type: 'document',
          range: [4, 5],
          weight: 2,
          name: 'Sword',
          documentUuid: 'Compendium.dnd5e.items.Item.bbbbbbbbbbbbbbbb',
          img: 'icons/sword.webp'
        }
      ]);
      expect(result).toMatchObject({ id: 'new', kind: 'compendium', text: 'Sword', documentCollection: 'dnd5e.items' });
    });

    it('writes a text row into the description and a world reference as its uuid', async () => {
      runningFoundry(14);
      const document = tableDocument();
      const workshop = workshopFor(document);

      await workshop.createResult('encounters', { kind: 'text', text: 'Rain', range: [1, 1], weight: 1 });
      await workshop.createResult('encounters', {
        kind: 'document',
        text: 'Dragon',
        range: [2, 2],
        weight: 1,
        documentCollection: 'Actor',
        documentId: 'aaaaaaaaaaaaaaaa'
      });

      const calls = (document.createEmbeddedDocuments as jest.Mock).mock.calls as Array<[string, Record<string, unknown>[]]>;
      expect(calls[0]?.[1]).toEqual([{ type: 'text', range: [1, 1], weight: 1, description: 'Rain' }]);
      expect(calls[1]?.[1]).toEqual([
        { type: 'document', range: [2, 2], weight: 1, name: 'Dragon', documentUuid: 'Actor.aaaaaaaaaaaaaaaa' }
      ]);
    });

    it('writes the pre-13 fields below Foundry 13', async () => {
      runningFoundry(12);
      const document = tableDocument();

      await workshopFor(document).createResult('encounters', {
        kind: 'document',
        text: 'Dragon',
        range: [2, 2],
        weight: 1,
        documentCollection: 'Actor',
        documentId: 'a1'
      });

      expect(document.createEmbeddedDocuments).toHaveBeenCalledWith('TableResult', [
        { type: 1, text: 'Dragon', range: [2, 2], weight: 1, documentCollection: 'Actor', documentId: 'a1' }
      ]);
    });

    it('uses the older uuid form for a pack it cannot find', async () => {
      runningFoundry(13);
      const document = tableDocument();

      await workshopFor(document).createResult('encounters', {
        kind: 'compendium',
        text: 'Gone',
        range: [1, 1],
        weight: 1,
        documentCollection: 'missing.pack',
        documentId: 'eeeeeeeeeeeeeeee'
      });

      expect(document.createEmbeddedDocuments).toHaveBeenCalledWith('TableResult', [
        expect.objectContaining({ documentUuid: 'Compendium.missing.pack.eeeeeeeeeeeeeeee' })
      ]);
    });

    it('resolves to null for an unknown table or a row the core did not create', async () => {
      const document = tableDocument();
      const draft = { kind: 'text' as const, text: 'x', range: [1, 1] as const, weight: 1 };

      await expect(workshopFor(document).createResult('gone', draft)).resolves.toBeNull();
      (document.createEmbeddedDocuments as jest.Mock).mockResolvedValueOnce([]);
      await expect(workshopFor(document).createResult('encounters', draft)).resolves.toBeNull();
    });
  });

  describe('updating a row', () => {
    const dragon = (): FoundryTableResultDocument =>
      currentResult({
        _id: 'd1',
        type: 'document',
        name: 'Dragon',
        description: 'big',
        documentUuid: 'Actor.aaaaaaaaaaaaaaaa'
      });

    it.each([13, 14])('turns a document row into a text row on Foundry %p', async (generation) => {
      runningFoundry(generation);
      const document = tableDocument([dragon()]);

      const result = await workshopFor(document).updateResult('encounters', 'd1', {
        kind: 'text',
        kindChanged: true,
        text: 'Dragon',
        reference: null
      });

      expect(document.updateEmbeddedDocuments).toHaveBeenCalledWith('TableResult', [
        { _id: 'd1', type: 'text', description: 'Dragon', name: '', documentUuid: null }
      ]);
      expect(result).toMatchObject({ kind: 'text', text: 'Dragon', documentCollection: null });
    });

    it('writes the label of a document row into its name and leaves the rest alone', async () => {
      runningFoundry(14);
      const document = tableDocument([dragon()]);

      const result = await workshopFor(document).updateResult('encounters', 'd1', {
        kind: 'document',
        kindChanged: false,
        text: 'Wyrm',
        range: [3, 5],
        weight: 3,
        drawn: true,
        img: null
      });

      expect(document.updateEmbeddedDocuments).toHaveBeenCalledWith('TableResult', [
        { _id: 'd1', name: 'Wyrm', range: [3, 5], weight: 3, drawn: true, img: null }
      ]);
      expect(result).toMatchObject({ text: 'Wyrm', range: [3, 5], drawn: true, documentId: 'aaaaaaaaaaaaaaaa' });
    });

    it('turns a text row into a compendium row', async () => {
      runningFoundry(13);
      const document = tableDocument();

      await workshopFor(document).updateResult('encounters', 'r1', {
        kind: 'compendium',
        kindChanged: true,
        text: 'Goblins',
        reference: { collection: 'dnd5e.items', id: 'bbbbbbbbbbbbbbbb' }
      });

      expect(document.updateEmbeddedDocuments).toHaveBeenCalledWith('TableResult', [
        {
          _id: 'r1',
          type: 'document',
          name: 'Goblins',
          description: '',
          documentUuid: 'Compendium.dnd5e.items.Item.bbbbbbbbbbbbbbbb'
        }
      ]);
    });

    it('writes the pre-13 fields below Foundry 13', async () => {
      runningFoundry(12);
      const document = tableDocument([dragon()]);
      const workshop = workshopFor(document);

      await workshop.updateResult('encounters', 'd1', { kind: 'text', kindChanged: true, text: 'Dragon', reference: null });
      await workshop.updateResult('encounters', 'd1', {
        kind: 'compendium',
        kindChanged: true,
        reference: { collection: 'dnd5e.items', id: 'i1' }
      });

      const calls = (document.updateEmbeddedDocuments as jest.Mock).mock.calls as Array<[string, Record<string, unknown>[]]>;
      expect(calls[0]?.[1]).toEqual([{ _id: 'd1', type: 0, text: 'Dragon', documentCollection: '', documentId: null }]);
      expect(calls[1]?.[1]).toEqual([{ _id: 'd1', type: 2, documentCollection: 'dnd5e.items', documentId: 'i1' }]);
    });

    it('resolves to null for an unknown table or row', async () => {
      const write = { kind: 'text' as const, kindChanged: false };

      await expect(workshopFor(tableDocument()).updateResult('gone', 'r1', write)).resolves.toBeNull();
      await expect(workshopFor(tableDocument()).updateResult('encounters', 'nope', write)).resolves.toBeNull();
    });
  });

  it('deletes a row it has and leaves an unknown one alone', async () => {
    const document = tableDocument();
    const workshop = workshopFor(document);

    await workshop.deleteResult('encounters', 'nope');
    await workshop.deleteResult('encounters', 'r1');

    expect(document.deleteEmbeddedDocuments).toHaveBeenCalledTimes(1);
    expect(document.deleteEmbeddedDocuments).toHaveBeenCalledWith('TableResult', ['r1']);
  });
});

describe('FoundryTableLookups', () => {
  const lookups = new FoundryTableLookups({ getGame: () => gameWith(tableDocument()) });

  it('describes a folder by its type and direct contents', () => {
    expect(lookups.findFolder('monsters')).toEqual({ id: 'monsters', name: 'Monsters', type: 'Actor', documentCount: 3 });
    expect(lookups.findFolder('nowhere')).toBeNull();
  });

  it('knows the installed packs', () => {
    expect(lookups.hasPack('dnd5e.items')).toBe(true);
    expect(lookups.hasPack('missing.pack')).toBe(false);
  });
});

describe('FoundryTableRollFormulas', () => {
  const formulas = new FoundryTableRollFormulas(rollGlobals);

  it('asks the core whether a formula parses', () => {
    expect(formulas.isValid('1d6')).toBe(true);
    expect(formulas.isValid('bad')).toBe(false);
  });

  it('counts the dice, a die with a computed count as one', () => {
    expect(formulas.countDice('3d6+1d4')).toBe(4);
    expect(formulas.countDice('(1d4)d6')).toBe(1);
  });
});
