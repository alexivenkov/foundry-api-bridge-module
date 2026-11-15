import {
  type RollTable,
  type RollTableChanges,
  type RollTableDraft,
  type RollTableEditor,
  type RollTableFolders,
  type RollTableOverview,
  type RollTableRoller,
  type RollTableStore,
  type TableCompendiums,
  type TableDraw,
  type TableDrawOptions,
  type TableFolder,
  type TableResult,
  type TableResultDraft,
  type TableResultWrite,
  type TableRollFormulas,
  type TableRollOptions
} from '../../domain';
import { RollTableManagementService } from '../RollTableManagementService';

function row(overrides: Partial<TableResult> = {}): TableResult {
  return {
    id: 'r1',
    kind: 'text',
    text: 'Goblins',
    img: '',
    range: [1, 3],
    weight: 1,
    drawn: false,
    documentCollection: null,
    documentId: null,
    ...overrides
  };
}

function table(overrides: Partial<RollTable> = {}): RollTable {
  return {
    id: 'encounters',
    name: 'Encounters',
    img: '',
    description: '',
    formula: '1d6',
    replacement: true,
    displayRoll: true,
    results: [row()],
    folderId: null,
    ...overrides
  };
}

const DRAW: TableDraw = { formula: '1d6', total: 2, results: [row({ drawn: true })] };

class FakeTables implements RollTableStore {
  readonly draws: Array<{ tableId: string; displayChat: boolean }> = [];
  readonly updates: Array<{ tableId: string; changes: RollTableChanges }> = [];

  constructor(public tables: RollTable[]) {}

  listTables(): readonly RollTableOverview[] {
    return this.tables.map((entry) => this.overview(entry));
  }

  findOverview(tableId: string): RollTableOverview | null {
    const found = this.findTable(tableId);
    return found === null ? null : this.overview(found);
  }

  findTable(tableId: string): RollTable | null {
    return this.tables.find((entry) => entry.id === tableId) ?? null;
  }

  createTable(_draft: RollTableDraft): Promise<RollTable | null> {
    return Promise.resolve(null);
  }

  updateTable(tableId: string, changes: RollTableChanges): Promise<RollTable | null> {
    this.updates.push({ tableId, changes });
    return Promise.resolve(this.findTable(tableId));
  }

  deleteTable(): Promise<void> {
    return Promise.resolve();
  }

  draw(tableId: string, displayChat: boolean): Promise<TableDraw | null> {
    this.draws.push({ tableId, displayChat });
    return Promise.resolve(DRAW);
  }

  resetResults(): Promise<void> {
    return Promise.resolve();
  }

  private overview(entry: RollTable): RollTableOverview {
    return {
      id: entry.id,
      name: entry.name,
      img: entry.img,
      description: entry.description,
      formula: entry.formula,
      replacement: entry.replacement,
      totalResults: entry.results.length,
      drawnResults: entry.results.filter((result) => result.drawn).length
    };
  }
}

class FakeWorkshop implements RollTableRoller, RollTableEditor {
  readonly draws: Array<{ tableId: string; displayChat: boolean; options: TableDrawOptions }> = [];
  readonly previews: Array<{ tableId: string; options: TableRollOptions }> = [];
  readonly normalized: string[] = [];
  readonly fromFolders: string[] = [];
  readonly created: Array<{ tableId: string; draft: TableResultDraft }> = [];
  readonly updated: Array<{ tableId: string; resultId: string; write: TableResultWrite }> = [];
  readonly deleted: Array<{ tableId: string; resultId: string }> = [];
  nothingHappens = false;

  draw(tableId: string, displayChat: boolean, options: TableDrawOptions): Promise<TableDraw | null> {
    this.draws.push({ tableId, displayChat, options });
    return Promise.resolve(this.nothingHappens ? null : { ...DRAW, rolls: [{ formula: '1d6', total: 2 }] });
  }

  preview(tableId: string, options: TableRollOptions): Promise<TableDraw | null> {
    this.previews.push({ tableId, options });
    return Promise.resolve(this.nothingHappens ? null : { formula: '1d6', total: 5, results: [row()] });
  }

  normalize(tableId: string): Promise<RollTable | null> {
    this.normalized.push(tableId);
    return Promise.resolve(this.nothingHappens ? null : table({ formula: '1d1' }));
  }

  createFromFolder(folderId: string): Promise<RollTable | null> {
    this.fromFolders.push(folderId);
    return Promise.resolve(this.nothingHappens ? null : table({ id: 'from-folder', name: 'Monsters' }));
  }

  createResult(tableId: string, draft: TableResultDraft): Promise<TableResult | null> {
    this.created.push({ tableId, draft });
    return Promise.resolve(this.nothingHappens ? null : row({ id: 'new', text: draft.text }));
  }

  updateResult(tableId: string, resultId: string, write: TableResultWrite): Promise<TableResult | null> {
    this.updated.push({ tableId, resultId, write });
    return Promise.resolve(this.nothingHappens ? null : row({ id: resultId, kind: write.kind }));
  }

  deleteResult(tableId: string, resultId: string): Promise<void> {
    this.deleted.push({ tableId, resultId });
    return Promise.resolve();
  }
}

class FakeLookups implements RollTableFolders, TableCompendiums, TableRollFormulas {
  folders: TableFolder[] = [
    { id: 'tables', name: 'Tables', type: 'RollTable', documentCount: 2 },
    { id: 'monsters', name: 'Monsters', type: 'Actor', documentCount: 3 },
    { id: 'empty', name: 'Empty', type: 'Item', documentCount: 0 },
    { id: 'packs', name: 'Packs', type: 'Compendium', documentCount: 4 }
  ];
  packs = ['dnd5e.items'];
  valid = true;
  dice = 1;

  findFolder(folderId: string): TableFolder | null {
    return this.folders.find((entry) => entry.id === folderId) ?? null;
  }

  hasPack(packId: string): boolean {
    return this.packs.includes(packId);
  }

  isValid(): boolean {
    return this.valid;
  }

  countDice(): number {
    return this.dice;
  }
}

function setup(tables: RollTable[] = [table()]): {
  service: RollTableManagementService;
  store: FakeTables;
  workshop: FakeWorkshop;
  lookups: FakeLookups;
} {
  const store = new FakeTables(tables);
  const workshop = new FakeWorkshop();
  const lookups = new FakeLookups();
  const service = new RollTableManagementService({
    tables: store,
    roller: workshop,
    editor: workshop,
    folders: lookups,
    formulas: lookups,
    compendiums: lookups
  });
  return { service, store, workshop, lookups };
}

const OPTIONS: TableDrawOptions = { count: 1, recursive: true };

describe('RollTableManagementService', () => {
  describe('rollOnTable', () => {
    it('makes the plain draw through the original store when no option is given', async () => {
      const { service, store, workshop } = setup();

      const { table: drawnFrom, draw } = await service.rollOnTable({ tableId: 'encounters', displayChat: false });

      expect(store.draws).toEqual([{ tableId: 'encounters', displayChat: false }]);
      expect(workshop.draws).toEqual([]);
      expect(drawnFrom.name).toBe('Encounters');
      expect(draw).toBe(DRAW);
    });

    it('draws with the options and a trimmed formula', async () => {
      const { service, workshop } = setup();

      const { draw } = await service.rollOnTable({
        tableId: 'encounters',
        displayChat: true,
        options: { count: 3, recursive: false, visibility: 'gm', formula: ' 2d6 ' }
      });

      expect(workshop.draws).toEqual([
        { tableId: 'encounters', displayChat: true, options: { count: 3, recursive: false, visibility: 'gm', formula: '2d6' } }
      ]);
      expect(draw.rolls).toHaveLength(1);
    });

    it('refuses an unknown table before drawing', async () => {
      const { service, workshop } = setup();

      await expect(service.rollOnTable({ tableId: 'gone', displayChat: true, options: OPTIONS })).rejects.toThrow(
        'Roll table not found: gone'
      );
      expect(workshop.draws).toEqual([]);
    });

    it.each([
      ['too many draws', { count: 101 }, 'count must be a whole number from 1 to 100, got 101'],
      ['an @ reference', { formula: '1d20+@lvl' }, 'Invalid roll formula: a table roll has no roll data for @ references']
    ])('refuses %s', async (_case, extra, message) => {
      const { service, workshop } = setup();

      await expect(
        service.rollOnTable({ tableId: 'encounters', displayChat: true, options: { ...OPTIONS, ...extra } })
      ).rejects.toThrow(message);
      expect(workshop.draws).toEqual([]);
    });

    it('refuses a formula the core cannot parse, and one with too many dice', async () => {
      const { service, lookups } = setup();
      lookups.valid = false;

      await expect(
        service.rollOnTable({ tableId: 'encounters', displayChat: true, options: { ...OPTIONS, formula: '1d' } })
      ).rejects.toThrow('Invalid roll formula: Foundry cannot parse or evaluate it');

      lookups.valid = true;
      lookups.dice = 500;
      await expect(
        service.rollOnTable({ tableId: 'encounters', displayChat: true, options: { ...OPTIONS, formula: '500d6' } })
      ).rejects.toThrow('it rolls 500 dice');
    });

    it('reports a table that vanished during the draw', async () => {
      const { service, workshop } = setup();
      workshop.nothingHappens = true;

      await expect(service.rollOnTable({ tableId: 'encounters', displayChat: true, options: OPTIONS })).rejects.toThrow(
        'Roll table not found: encounters'
      );
    });
  });

  describe('previewRoll', () => {
    it('rolls without drawing', async () => {
      const { service, workshop } = setup();

      const { draw } = await service.previewRoll({ tableId: 'encounters', options: { recursive: true, formula: '1d4' } });

      expect(workshop.previews).toEqual([{ tableId: 'encounters', options: { recursive: true, formula: '1d4' } }]);
      expect(draw.total).toBe(5);
    });

    it('refuses an unknown table and a bad formula', async () => {
      const { service } = setup();

      await expect(service.previewRoll({ tableId: 'gone', options: { recursive: true } })).rejects.toThrow(
        'Roll table not found: gone'
      );
      await expect(
        service.previewRoll({ tableId: 'encounters', options: { recursive: true, formula: '' } })
      ).rejects.toThrow('Invalid roll formula: it is empty');
    });
  });

  describe('updateTable', () => {
    it('moves a table into a roll table folder', async () => {
      const { service, store } = setup();

      await service.updateTable({ tableId: 'encounters', changes: { folderId: 'tables' } });

      expect(store.updates).toEqual([{ tableId: 'encounters', changes: { folderId: 'tables' } }]);
    });

    it('moves a table to the root without looking up a folder', async () => {
      const { service, store, lookups } = setup();
      lookups.folders = [];

      await service.updateTable({ tableId: 'encounters', changes: { folderId: null } });

      expect(store.updates).toHaveLength(1);
    });

    it.each([
      ['a missing folder', 'nowhere', 'Folder not found: nowhere'],
      ['a folder of actors', 'monsters', 'Folder monsters holds Actor documents, not roll tables']
    ])('refuses %s', async (_case, folderId, message) => {
      const { service, store } = setup();

      await expect(service.updateTable({ tableId: 'encounters', changes: { folderId } })).rejects.toThrow(message);
      expect(store.updates).toEqual([]);
    });

    it('names a missing table before a bad folder', async () => {
      await expect(setup().service.updateTable({ tableId: 'gone', changes: { folderId: 'nowhere' } })).rejects.toThrow(
        'Roll table not found: gone'
      );
    });
  });

  describe('normalizeTable', () => {
    it('normalizes a table with rows', async () => {
      const { service, workshop } = setup();

      await expect(service.normalizeTable({ tableId: 'encounters' })).resolves.toMatchObject({ formula: '1d1' });
      expect(workshop.normalized).toEqual(['encounters']);
    });

    it('refuses an empty table and an unknown one', async () => {
      const { service, workshop } = setup([table({ results: [] })]);

      await expect(service.normalizeTable({ tableId: 'encounters' })).rejects.toThrow(
        'Roll table encounters has no results to normalize'
      );
      await expect(service.normalizeTable({ tableId: 'gone' })).rejects.toThrow('Roll table not found: gone');
      expect(workshop.normalized).toEqual([]);
    });
  });

  describe('createFromFolder', () => {
    it('builds a table from a folder of documents', async () => {
      const { service, workshop } = setup();

      await expect(service.createFromFolder({ folderId: 'monsters' })).resolves.toMatchObject({ id: 'from-folder' });
      expect(workshop.fromFolders).toEqual(['monsters']);
    });

    it.each([
      ['nowhere', 'Folder not found: nowhere'],
      ['empty', 'Folder empty holds no documents to build a roll table from'],
      ['packs', 'Folder packs holds Compendium entries, which a roll table cannot point to']
    ])('refuses folder %s', async (folderId, message) => {
      const { service, workshop } = setup();

      await expect(service.createFromFolder({ folderId })).rejects.toThrow(message);
      expect(workshop.fromFolders).toEqual([]);
    });

    it('reports a creation the core vetoed', async () => {
      const { service, workshop } = setup();
      workshop.nothingHappens = true;

      await expect(service.createFromFolder({ folderId: 'monsters' })).rejects.toThrow(
        'Roll table creation was cancelled by Foundry'
      );
    });
  });

  describe('results', () => {
    const draft: TableResultDraft = { kind: 'text', text: 'Orcs', range: [4, 6], weight: 1 };

    it('creates a row', async () => {
      const { service, workshop } = setup();

      await expect(service.createResult({ tableId: 'encounters', draft })).resolves.toMatchObject({ id: 'new' });
      expect(workshop.created).toEqual([{ tableId: 'encounters', draft }]);
    });

    it('checks where a new row points', async () => {
      const { service, workshop } = setup();
      const toPack = { ...draft, kind: 'compendium' as const, documentCollection: 'dnd5e.items', documentId: 'i1' };
      const toNothing = { ...draft, kind: 'compendium' as const, documentCollection: 'missing.pack', documentId: 'i1' };
      const misKinded = { ...draft, kind: 'document' as const, documentCollection: 'dnd5e.items', documentId: 'i1' };

      await service.createResult({ tableId: 'encounters', draft: toPack });
      await expect(service.createResult({ tableId: 'encounters', draft: toNothing })).rejects.toThrow(
        'Unknown document collection: missing.pack'
      );
      await expect(service.createResult({ tableId: 'encounters', draft: misKinded })).rejects.toThrow(
        'make it a compendium result'
      );
      expect(workshop.created).toHaveLength(1);
    });

    it('refuses a row for an unknown table and reports a row the core did not create', async () => {
      const { service, workshop } = setup();

      await expect(service.createResult({ tableId: 'gone', draft })).rejects.toThrow('Roll table not found: gone');
      workshop.nothingHappens = true;
      await expect(service.createResult({ tableId: 'encounters', draft })).rejects.toThrow('Failed to create table result');
    });

    it('updates a row with the write resolved against it', async () => {
      const { service, workshop } = setup();

      await service.updateResult({
        tableId: 'encounters',
        resultId: 'r1',
        changes: { kind: 'document', reference: { collection: 'Actor', id: 'a1' } }
      });

      expect(workshop.updated).toEqual([
        {
          tableId: 'encounters',
          resultId: 'r1',
          write: expect.objectContaining({ kind: 'document', kindChanged: true, text: 'Goblins', reference: { collection: 'Actor', id: 'a1' } })
        }
      ]);
    });

    it('checks the reference a row keeps when its kind changes', async () => {
      const { service, workshop } = setup([
        table({ results: [row({ kind: 'document', documentCollection: 'Actor', documentId: 'a1' })] })
      ]);

      await expect(
        service.updateResult({ tableId: 'encounters', resultId: 'r1', changes: { kind: 'compendium' } })
      ).rejects.toThrow('Actor is a world document type');
      expect(workshop.updated).toEqual([]);
    });

    it('refuses an unknown row and an unknown table', async () => {
      const { service } = setup();

      await expect(service.updateResult({ tableId: 'encounters', resultId: 'nope', changes: {} })).rejects.toThrow(
        'Table result not found in roll table encounters: nope'
      );
      await expect(service.deleteResult({ tableId: 'gone', resultId: 'r1' })).rejects.toThrow(
        'Roll table not found: gone'
      );
    });

    it('reports a row that vanished during the update', async () => {
      const { service, workshop } = setup();
      workshop.nothingHappens = true;

      await expect(service.updateResult({ tableId: 'encounters', resultId: 'r1', changes: { weight: 2 } })).rejects.toThrow(
        'Table result not found in roll table encounters: r1'
      );
    });

    it('deletes a row', async () => {
      const { service, workshop } = setup();

      await service.deleteResult({ tableId: 'encounters', resultId: 'r1' });

      expect(workshop.deleted).toEqual([{ tableId: 'encounters', resultId: 'r1' }]);
    });
  });
});
