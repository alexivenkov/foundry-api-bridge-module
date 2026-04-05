import { createRollTableHandler } from '../CreateRollTableHandler';
import { updateRollTableHandler } from '../UpdateRollTableHandler';
import { deleteRollTableHandler } from '../DeleteRollTableHandler';
import type { FoundryRollTable, FoundryTableResult } from '../tableTypes';

function createMockResult(overrides?: Partial<FoundryTableResult>): FoundryTableResult {
  return {
    _id: 'result-1',
    type: 0,
    text: 'Result',
    name: undefined,
    img: undefined,
    range: [1, 10] as [number, number],
    weight: 1,
    drawn: false,
    documentCollection: undefined,
    documentId: undefined,
    ...overrides
  };
}

function createMockTable(results: FoundryTableResult[] = [], overrides?: Partial<FoundryRollTable>): FoundryRollTable {
  return {
    id: 'table-1',
    name: 'Test Table',
    img: 'icons/d20.svg',
    description: '',
    formula: '1d20',
    replacement: true,
    displayRoll: true,
    results: { contents: results },
    roll: jest.fn(),
    draw: jest.fn(),
    resetResults: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides
  };
}

const mockCreate = jest.fn();

function setGameForCreate(): void {
  (globalThis as Record<string, unknown>)['game'] = {
    tables: {
      documentClass: { create: mockCreate },
      get: jest.fn(),
      forEach: jest.fn()
    }
  };
}

function setGameForGetById(tables: Map<string, FoundryRollTable>): void {
  (globalThis as Record<string, unknown>)['game'] = {
    tables: {
      get: jest.fn((id: string) => tables.get(id)),
      forEach: jest.fn(),
      documentClass: { create: jest.fn() }
    }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('createRollTableHandler', () => {
  afterEach(() => {
    clearGame();
    jest.clearAllMocks();
  });

  it('should create table with minimal params', async () => {
    const created = createMockTable([], { id: 'new-1', name: 'My Table' });
    mockCreate.mockResolvedValue(created);
    setGameForCreate();

    const result = await createRollTableHandler({ name: 'My Table' });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'My Table',
      formula: '1d20',
      replacement: true,
      displayRoll: true
    });
    expect(result.id).toBe('new-1');
    expect(result.name).toBe('My Table');
  });

  it('should create table with full params and results', async () => {
    const results = [
      createMockResult({ _id: 'r1', text: 'Goblin', range: [1, 3] as [number, number] }),
      createMockResult({ _id: 'r2', text: 'Dragon', range: [4, 6] as [number, number] })
    ];
    const created = createMockTable(results, { id: 'new-2', name: 'Encounters', formula: '1d6' });
    mockCreate.mockResolvedValue(created);
    setGameForCreate();

    const result = await createRollTableHandler({
      name: 'Encounters',
      formula: '1d6',
      replacement: false,
      displayRoll: false,
      description: '<p>Encounter table</p>',
      img: 'icons/table.webp',
      folder: 'folder-1',
      results: [
        { text: 'Goblin', range: [1, 3], weight: 2 },
        { text: 'Dragon', range: [4, 6], type: 1, documentCollection: 'Actor', documentId: 'actor-1', img: 'dragon.webp' }
      ]
    });

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Encounters',
      formula: '1d6',
      replacement: false,
      displayRoll: false,
      description: '<p>Encounter table</p>',
      img: 'icons/table.webp',
      folder: 'folder-1',
      results: [
        { type: 0, text: 'Goblin', range: [1, 3], weight: 2 },
        { type: 1, text: 'Dragon', range: [4, 6], weight: 1, documentCollection: 'Actor', documentId: 'actor-1', img: 'dragon.webp' }
      ]
    });
    expect(result.results).toHaveLength(2);
  });

  it('should apply defaults for formula, replacement, displayRoll', async () => {
    const created = createMockTable();
    mockCreate.mockResolvedValue(created);
    setGameForCreate();

    await createRollTableHandler({ name: 'Test' });

    const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call['formula']).toBe('1d20');
    expect(call['replacement']).toBe(true);
    expect(call['displayRoll']).toBe(true);
  });

  it('should apply defaults for result type and weight', async () => {
    const created = createMockTable([createMockResult()]);
    mockCreate.mockResolvedValue(created);
    setGameForCreate();

    await createRollTableHandler({
      name: 'Test',
      results: [{ text: 'Result', range: [1, 10] }]
    });

    const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    const results = call['results'] as Array<Record<string, unknown>>;
    expect(results[0]?.['type']).toBe(0);
    expect(results[0]?.['weight']).toBe(1);
  });

  it('should not include optional fields when not provided', async () => {
    const created = createMockTable();
    mockCreate.mockResolvedValue(created);
    setGameForCreate();

    await createRollTableHandler({ name: 'Bare' });

    const call = mockCreate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('description');
    expect(call).not.toHaveProperty('img');
    expect(call).not.toHaveProperty('folder');
    expect(call).not.toHaveProperty('results');
  });
});

describe('updateRollTableHandler', () => {
  afterEach(clearGame);

  it('should update table fields', async () => {
    const updated = createMockTable([], {
      id: 't1', name: 'Updated', formula: '1d100',
      update: jest.fn()
    });
    (updated.update as jest.Mock).mockResolvedValue(updated);
    setGameForGetById(new Map([['t1', updated]]));

    const result = await updateRollTableHandler({
      tableId: 't1',
      name: 'Updated',
      formula: '1d100'
    });

    expect(updated.update).toHaveBeenCalledWith({
      name: 'Updated',
      formula: '1d100'
    });
    expect(result.name).toBe('Updated');
  });

  it('should reject when table not found', async () => {
    setGameForGetById(new Map());

    await expect(updateRollTableHandler({ tableId: 'nonexistent' }))
      .rejects.toThrow('Roll table not found: nonexistent');
  });

  it('should only include provided fields in update', async () => {
    const table = createMockTable([], { id: 't1' });
    (table.update as jest.Mock).mockResolvedValue(table);
    setGameForGetById(new Map([['t1', table]]));

    await updateRollTableHandler({ tableId: 't1', replacement: false });

    expect(table.update).toHaveBeenCalledWith({ replacement: false });
  });

  it('should handle all optional fields', async () => {
    const table = createMockTable([], { id: 't1' });
    (table.update as jest.Mock).mockResolvedValue(table);
    setGameForGetById(new Map([['t1', table]]));

    await updateRollTableHandler({
      tableId: 't1',
      name: 'New Name',
      formula: '2d6',
      replacement: false,
      displayRoll: false,
      description: '<p>New desc</p>',
      img: 'new.webp'
    });

    expect(table.update).toHaveBeenCalledWith({
      name: 'New Name',
      formula: '2d6',
      replacement: false,
      displayRoll: false,
      description: '<p>New desc</p>',
      img: 'new.webp'
    });
  });

  it('should send empty update object when no fields provided', async () => {
    const table = createMockTable([], { id: 't1' });
    (table.update as jest.Mock).mockResolvedValue(table);
    setGameForGetById(new Map([['t1', table]]));

    await updateRollTableHandler({ tableId: 't1' });

    expect(table.update).toHaveBeenCalledWith({});
  });
});

describe('deleteRollTableHandler', () => {
  afterEach(clearGame);

  it('should delete table and return result', async () => {
    const table = createMockTable([], { id: 't1' });
    (table.delete as jest.Mock).mockResolvedValue(table);
    setGameForGetById(new Map([['t1', table]]));

    const result = await deleteRollTableHandler({ tableId: 't1' });

    expect(table.delete).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ deleted: true });
  });

  it('should reject when table not found', async () => {
    setGameForGetById(new Map());

    await expect(deleteRollTableHandler({ tableId: 'nonexistent' }))
      .rejects.toThrow('Roll table not found: nonexistent');
  });
});
