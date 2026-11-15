import {
  RollTableCreationCancelledError,
  RollTableNotFoundError,
  type RollTable,
  type RollTableChanges,
  type RollTableDraft,
  type RollTableOverview,
  type RollTableStore,
  type TableDraw,
  type TableResult
} from '../../domain';
import { RollTableService } from '../RollTableService';

function result(overrides: Partial<TableResult> = {}): TableResult {
  return {
    id: 'r1',
    kind: 'text',
    text: 'Goblin ambush',
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
    img: 'icons/d20.svg',
    description: '',
    formula: '1d6',
    replacement: true,
    displayRoll: true,
    results: [],
    ...overrides
  };
}

function overviewOf(source: RollTable): RollTableOverview {
  return {
    id: source.id,
    name: source.name,
    img: source.img,
    description: source.description,
    formula: source.formula,
    replacement: source.replacement,
    totalResults: source.results.length,
    drawnResults: source.results.filter((row) => row.drawn).length
  };
}

class FakeRollTableStore implements RollTableStore {
  readonly created: RollTableDraft[] = [];
  readonly updated: Array<{ tableId: string; changes: RollTableChanges }> = [];
  readonly deleted: string[] = [];
  readonly draws: Array<{ tableId: string; displayChat: boolean }> = [];
  readonly resets: string[] = [];
  createsNothing = false;
  losesTableOnWrite = false;

  constructor(private readonly tables: readonly RollTable[]) {}

  listTables(): readonly RollTableOverview[] {
    return this.tables.map(overviewOf);
  }

  findOverview(tableId: string): RollTableOverview | null {
    const found = this.findTable(tableId);
    return found !== null ? overviewOf(found) : null;
  }

  findTable(tableId: string): RollTable | null {
    return this.tables.find((candidate) => candidate.id === tableId) ?? null;
  }

  createTable(draft: RollTableDraft): Promise<RollTable | null> {
    this.created.push(draft);
    return Promise.resolve(this.createsNothing ? null : table({ id: 'created', name: draft.name }));
  }

  updateTable(tableId: string, changes: RollTableChanges): Promise<RollTable | null> {
    this.updated.push({ tableId, changes });
    const current = this.findTable(tableId);
    if (current === null || this.losesTableOnWrite) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...current, ...(changes.name !== undefined ? { name: changes.name } : {}) });
  }

  deleteTable(tableId: string): Promise<void> {
    this.deleted.push(tableId);
    return Promise.resolve();
  }

  draw(tableId: string, displayChat: boolean): Promise<TableDraw | null> {
    this.draws.push({ tableId, displayChat });
    if (this.losesTableOnWrite) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ formula: '1d6', total: 2, results: [result({ drawn: true })] });
  }

  resetResults(tableId: string): Promise<void> {
    this.resets.push(tableId);
    return Promise.resolve();
  }
}

function setup(): { service: RollTableService; store: FakeRollTableStore } {
  const store = new FakeRollTableStore([
    table({
      results: [result({ id: 'a', drawn: true }), result({ id: 'b', drawn: true }), result({ id: 'c' })]
    }),
    table({ id: 'loot', name: 'Loot', formula: '1d100' })
  ]);
  return { service: new RollTableService({ tables: store }), store };
}

describe('RollTableService', () => {
  describe('reading', () => {
    it('lists every table with its row counts', () => {
      const tables = setup().service.listTables();

      expect(tables.map((entry) => entry.id)).toEqual(['encounters', 'loot']);
      expect(tables[0]).toMatchObject({ totalResults: 3, drawnResults: 2 });
    });

    it('returns a table with its rows', () => {
      const found = setup().service.getTable({ tableId: 'encounters' });

      expect(found.results.map((row) => row.id)).toEqual(['a', 'b', 'c']);
    });

    it('rejects an unknown table', () => {
      const act = (): unknown => setup().service.getTable({ tableId: 'missing' });

      expect(act).toThrow(RollTableNotFoundError);
      expect(act).toThrow('Roll table not found: missing');
    });
  });

  describe('rollOnTable', () => {
    it('draws from the table and reports which table it was', async () => {
      const { service, store } = setup();

      const outcome = await service.rollOnTable({ tableId: 'encounters', displayChat: false });

      expect(store.draws).toEqual([{ tableId: 'encounters', displayChat: false }]);
      expect(outcome.table).toMatchObject({ id: 'encounters', name: 'Encounters' });
      expect(outcome.draw).toMatchObject({ formula: '1d6', total: 2 });
      expect(outcome.draw.results).toHaveLength(1);
    });

    it('rejects an unknown table without drawing', async () => {
      const { service, store } = setup();

      await expect(service.rollOnTable({ tableId: 'missing', displayChat: true }))
        .rejects.toThrow(RollTableNotFoundError);
      expect(store.draws).toEqual([]);
    });

    it('reports the table as missing when it vanished before the draw', async () => {
      const { service, store } = setup();
      store.losesTableOnWrite = true;

      await expect(service.rollOnTable({ tableId: 'encounters', displayChat: true }))
        .rejects.toThrow('Roll table not found: encounters');
    });
  });

  describe('resetTable', () => {
    it('resets the table and reports how many rows had been drawn', async () => {
      const { service, store } = setup();

      const outcome = await service.resetTable({ tableId: 'encounters' });

      expect(store.resets).toEqual(['encounters']);
      expect(outcome.resetCount).toBe(2);
      expect(outcome.table.name).toBe('Encounters');
    });

    it('still resets a table nothing was drawn from', async () => {
      const { service, store } = setup();

      const outcome = await service.resetTable({ tableId: 'loot' });

      expect(store.resets).toEqual(['loot']);
      expect(outcome.resetCount).toBe(0);
    });

    it('rejects an unknown table without resetting anything', async () => {
      const { service, store } = setup();

      await expect(service.resetTable({ tableId: 'missing' })).rejects.toThrow(RollTableNotFoundError);
      expect(store.resets).toEqual([]);
    });
  });

  describe('createTable', () => {
    const draft: RollTableDraft = { name: 'Weather', formula: '1d20', replacement: true, displayRoll: true };

    it('hands the draft to the store and returns the created table', async () => {
      const { service, store } = setup();

      const created = await service.createTable({ draft });

      expect(store.created).toEqual([draft]);
      expect(created).toMatchObject({ id: 'created', name: 'Weather' });
    });

    it('fails when the core created nothing', async () => {
      const { service, store } = setup();
      store.createsNothing = true;

      const creation = service.createTable({ draft });

      await expect(creation).rejects.toThrow(RollTableCreationCancelledError);
      await expect(creation).rejects.toThrow(
        'Roll table creation was cancelled by Foundry (a module hook may have vetoed it)'
      );
    });
  });

  describe('updateTable', () => {
    it('applies the changes to an existing table', async () => {
      const { service, store } = setup();

      const updated = await service.updateTable({ tableId: 'loot', changes: { name: 'Treasure' } });

      expect(store.updated).toEqual([{ tableId: 'loot', changes: { name: 'Treasure' } }]);
      expect(updated.name).toBe('Treasure');
    });

    it('rejects an unknown table without touching the store', async () => {
      const { service, store } = setup();

      await expect(service.updateTable({ tableId: 'missing', changes: {} }))
        .rejects.toThrow('Roll table not found: missing');
      expect(store.updated).toEqual([]);
    });

    it('reports the table as missing when it vanished during the update', async () => {
      const { service, store } = setup();
      store.losesTableOnWrite = true;

      await expect(service.updateTable({ tableId: 'loot', changes: {} })).rejects.toThrow(RollTableNotFoundError);
    });
  });

  describe('deleteTable', () => {
    it('deletes an existing table', async () => {
      const { service, store } = setup();

      await service.deleteTable({ tableId: 'loot' });

      expect(store.deleted).toEqual(['loot']);
    });

    it('rejects an unknown table without deleting anything', async () => {
      const { service, store } = setup();

      await expect(service.deleteTable({ tableId: 'missing' })).rejects.toThrow(RollTableNotFoundError);
      expect(store.deleted).toEqual([]);
    });
  });
});
