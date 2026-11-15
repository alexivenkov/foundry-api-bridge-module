import { createCreateRollTableFromFolderHandler } from '../CreateRollTableFromFolderHandler';
import { createCreateTableResultHandler } from '../CreateTableResultHandler';
import { createDeleteTableResultHandler } from '../DeleteTableResultHandler';
import { createNormalizeRollTableHandler } from '../NormalizeRollTableHandler';
import { createPreviewTableRollHandler } from '../PreviewTableRollHandler';
import { createRollOnTableHandler } from '../RollOnTableHandler';
import { createUpdateRollTableHandler } from '../UpdateRollTableHandler';
import { createUpdateTableResultHandler } from '../UpdateTableResultHandler';
import type {
  FoundryRollTableWorkshopDocument,
  FoundryRollTableWorkshopGame,
  FoundryTableResult as FoundryTableResultDocument,
  TableRollGlobalsProvider
} from '../tableTypes';
import type { RollTableManagementHandlerDependencies } from '../tableWireMappers';

function result(fields: Partial<FoundryTableResultDocument> = {}): FoundryTableResultDocument {
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

function setup(): {
  deps: Required<RollTableManagementHandlerDependencies>;
  table: FoundryRollTableWorkshopDocument;
  fromFolder: jest.Mock;
} {
  const rows = [result()];
  const table: FoundryRollTableWorkshopDocument = {
    id: 't1',
    name: 'Encounters',
    img: 'icons/d20.svg',
    description: '',
    formula: '1d6',
    replacement: true,
    displayRoll: true,
    folder: { id: 'f-tables' },
    results: { contents: rows, get: (id) => rows.find((row) => row._id === id) },
    roll: jest.fn().mockResolvedValue({ roll: { formula: '1d6', total: 5 }, results: [rows[0]] }),
    draw: jest.fn().mockResolvedValue({ roll: { formula: '1d6', total: 2 }, results: [rows[0]] }),
    drawMany: jest.fn().mockResolvedValue({
      roll: { formula: '{1d6,1d6}', total: 6, terms: [{ rolls: [{ formula: '1d6', total: 2 }, { formula: '1d6', total: 4 }] }] },
      results: [rows[0], rows[0]]
    }),
    normalize: jest.fn().mockResolvedValue(undefined),
    resetResults: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn(),
    createEmbeddedDocuments: jest.fn((_type: string, data: Record<string, unknown>[]) =>
      Promise.resolve([result({ _id: 'new', ...(data[0] as Partial<FoundryTableResultDocument>) })])
    ),
    updateEmbeddedDocuments: jest.fn((_type: string, updates: Record<string, unknown>[]) => {
      Object.assign(rows[0] ?? {}, updates[0]);
      return Promise.resolve(updates);
    }),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([])
  };
  const fromFolder = jest.fn().mockResolvedValue({ ...table, id: 'built', name: 'Monsters' });
  const game: FoundryRollTableWorkshopGame = {
    tables: {
      get: (id) => (id === 't1' ? table : undefined),
      forEach: (fn) => {
        fn(table);
      },
      documentClass: { create: jest.fn(), fromFolder }
    },
    folders: {
      get: (id) =>
        ({
          monsters: { id: 'monsters', name: 'Monsters', type: 'Actor', contents: [{}, {}] },
          'f-tables': { id: 'f-tables', name: 'Tables', type: 'RollTable', contents: [{}] }
        })[id]
    },
    packs: { get: () => undefined }
  };
  const rollGlobals: TableRollGlobalsProvider = () => ({
    Roll: Object.assign(
      function RollStub(this: { dice: unknown[] }) {
        this.dice = [{ number: 1 }];
      } as unknown as ReturnType<TableRollGlobalsProvider>['Roll'],
      { create: jest.fn((formula: string) => ({ formula })), validate: jest.fn(() => true) }
    )
  });
  return { deps: { gameProvider: { getGame: () => game }, rollGlobals }, table, fromFolder };
}

describe('roll table operation handlers', () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>)['game'] = { release: { generation: 14 } };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['game'];
  });

  describe('roll-on-table with options', () => {
    it('draws several rows and reports each roll', async () => {
      const { deps, table } = setup();

      const response = await createRollOnTableHandler(deps)({ tableId: 't1', count: 2, visibility: 'gm', displayChat: true });

      expect(table.drawMany).toHaveBeenCalledWith(2, { displayChat: true, recursive: true, messageMode: 'gm' });
      expect(response).toEqual({
        tableId: 't1',
        tableName: 'Encounters',
        roll: { formula: '{1d6,1d6}', total: 6 },
        results: [expect.objectContaining({ text: 'Goblins' }), expect.objectContaining({ text: 'Goblins' })],
        rolls: [
          { formula: '1d6', total: 2 },
          { formula: '1d6', total: 4 }
        ]
      });
    });

    it('reports the one roll of a plain draw', async () => {
      const { deps, table } = setup();

      const response = await createRollOnTableHandler(deps)({ tableId: 't1' });

      expect(table.draw).toHaveBeenCalledWith({ displayChat: true });
      expect(response.rolls).toEqual([{ formula: '1d6', total: 2 }]);
    });

    it('rejects an out-of-range count', async () => {
      await expect(createRollOnTableHandler(setup().deps)({ tableId: 't1', count: 500 })).rejects.toThrow('count');
    });
  });

  it('previews a roll without drawing', async () => {
    const { deps, table } = setup();

    const response = await createPreviewTableRollHandler(deps)({ tableId: 't1', formula: '1d4' });

    expect(table.roll).toHaveBeenCalledWith({ recursive: true, roll: { formula: '1d4' } });
    expect(table.draw).not.toHaveBeenCalled();
    expect(response).toEqual({
      tableId: 't1',
      tableName: 'Encounters',
      roll: { formula: '1d6', total: 5 },
      results: [expect.objectContaining({ id: 'r1', type: 0, text: 'Goblins' })]
    });
  });

  it('normalizes a table and returns it with its folder', async () => {
    const { deps, table } = setup();

    const response = await createNormalizeRollTableHandler(deps)({ tableId: 't1' });

    expect(table.normalize).toHaveBeenCalled();
    expect(response).toMatchObject({ id: 't1', folderId: 'f-tables', results: [expect.objectContaining({ id: 'r1' })] });
  });

  it('moves a table into a folder through update-roll-table', async () => {
    const { deps, table } = setup();

    const response = await createUpdateRollTableHandler(deps)({ tableId: 't1', folderId: 'f-tables' });

    expect(table.update).toHaveBeenCalledWith({ folder: 'f-tables' });
    expect(response.folderId).toBe('f-tables');
    await expect(createUpdateRollTableHandler(deps)({ tableId: 't1', folderId: 'monsters' })).rejects.toThrow(
      'Folder monsters holds Actor documents, not roll tables'
    );
  });

  it('builds a table from a folder', async () => {
    const { deps, fromFolder } = setup();

    const response = await createCreateRollTableFromFolderHandler(deps)({ folderId: 'monsters' });

    expect(fromFolder).toHaveBeenCalledWith(expect.objectContaining({ id: 'monsters' }), { renderSheet: false });
    expect(response).toMatchObject({ id: 'built', name: 'Monsters' });
    await expect(createCreateRollTableFromFolderHandler(deps)({ folderId: 'nowhere' })).rejects.toThrow(
      'Folder not found: nowhere'
    );
  });

  it('creates, updates and deletes a row', async () => {
    const { deps, table } = setup();

    const created = await createCreateTableResultHandler(deps)({
      tableId: 't1',
      text: 'Dragon',
      range: [4, 6],
      type: 1,
      documentCollection: 'Actor',
      documentId: 'aaaaaaaaaaaaaaaa'
    });
    const updated = await createUpdateTableResultHandler(deps)({ tableId: 't1', resultId: 'r1', text: 'Orcs', weight: 2 });
    const deleted = await createDeleteTableResultHandler(deps)({ tableId: 't1', resultId: 'r1' });

    expect(created).toEqual({
      tableId: 't1',
      result: {
        id: 'new',
        type: 1,
        text: 'Dragon',
        img: '',
        range: [4, 6],
        weight: 1,
        drawn: false,
        documentCollection: 'Actor',
        documentId: 'aaaaaaaaaaaaaaaa'
      }
    });
    expect(table.updateEmbeddedDocuments).toHaveBeenCalledWith('TableResult', [{ _id: 'r1', description: 'Orcs', weight: 2 }]);
    expect(updated).toEqual({ tableId: 't1', result: expect.objectContaining({ id: 'r1', text: 'Orcs', weight: 2 }) });
    expect(deleted).toEqual({ deleted: true, tableId: 't1', resultId: 'r1' });
  });

  it('rejects an invalid row and an unknown one', async () => {
    const { deps } = setup();

    await expect(createCreateTableResultHandler(deps)({ tableId: 't1', text: 'x', range: [3, 1] })).rejects.toThrow('range');
    await expect(createDeleteTableResultHandler(deps)({ tableId: 't1', resultId: 'nope' })).rejects.toThrow(
      'Table result not found in roll table t1: nope'
    );
    await expect(createNormalizeRollTableHandler(deps)({ tableId: 'gone' })).rejects.toThrow('Roll table not found: gone');
  });
});
