import { rollOnTableHandler } from '../RollOnTableHandler';
import { resetTableHandler } from '../ResetTableHandler';
import type { FoundryRollTable, FoundryTableResult, FoundryRollTableDraw } from '../tableTypes';

function createMockResult(overrides?: Partial<FoundryTableResult>): FoundryTableResult {
  return {
    _id: 'result-1',
    type: 0,
    text: 'Goblin Ambush',
    name: undefined,
    img: undefined,
    range: [1, 3] as [number, number],
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
    name: 'Random Encounters',
    img: 'icons/d20.svg',
    description: '<p>Encounters</p>',
    formula: '1d6',
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

function setGame(tables: Map<string, FoundryRollTable>): void {
  (globalThis as Record<string, unknown>)['game'] = {
    tables: {
      get: jest.fn((id: string) => tables.get(id)),
      forEach: jest.fn()
    }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('rollOnTableHandler', () => {
  afterEach(clearGame);

  it('should roll on table and return results', async () => {
    const drawnResult = createMockResult({ _id: 'r1', text: 'Goblin Ambush' });
    const drawResponse: FoundryRollTableDraw = {
      roll: { formula: '1d6', total: 3 },
      results: [drawnResult]
    };
    const table = createMockTable([], {
      draw: jest.fn().mockResolvedValue(drawResponse)
    });
    setGame(new Map([['table-1', table]]));

    const result = await rollOnTableHandler({ tableId: 'table-1' });

    expect(result.tableId).toBe('table-1');
    expect(result.tableName).toBe('Random Encounters');
    expect(result.roll).toEqual({ formula: '1d6', total: 3 });
    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.text).toBe('Goblin Ambush');
  });

  it('should reject when table not found', async () => {
    setGame(new Map());

    await expect(rollOnTableHandler({ tableId: 'nonexistent' }))
      .rejects.toThrow('Roll table not found: nonexistent');
  });

  it('should pass displayChat true by default', async () => {
    const table = createMockTable([], {
      draw: jest.fn().mockResolvedValue({ roll: { formula: '1d6', total: 1 }, results: [] })
    });
    setGame(new Map([['t1', table]]));

    await rollOnTableHandler({ tableId: 't1' });

    expect(table.draw).toHaveBeenCalledWith({ displayChat: true });
  });

  it('should pass displayChat false when specified', async () => {
    const table = createMockTable([], {
      draw: jest.fn().mockResolvedValue({ roll: { formula: '1d6', total: 1 }, results: [] })
    });
    setGame(new Map([['t1', table]]));

    await rollOnTableHandler({ tableId: 't1', displayChat: false });

    expect(table.draw).toHaveBeenCalledWith({ displayChat: false });
  });

  it('should handle multiple results from overlapping ranges', async () => {
    const results = [
      createMockResult({ _id: 'r1', text: 'Result A' }),
      createMockResult({ _id: 'r2', text: 'Result B' })
    ];
    const table = createMockTable([], {
      draw: jest.fn().mockResolvedValue({ roll: { formula: '1d6', total: 3 }, results })
    });
    setGame(new Map([['t1', table]]));

    const result = await rollOnTableHandler({ tableId: 't1' });

    expect(result.results).toHaveLength(2);
    expect(result.results.map(r => r.text)).toEqual(['Result A', 'Result B']);
  });

  it('should handle empty results from draw', async () => {
    const table = createMockTable([], {
      draw: jest.fn().mockResolvedValue({ roll: { formula: '1d6', total: 7 }, results: [] })
    });
    setGame(new Map([['t1', table]]));

    const result = await rollOnTableHandler({ tableId: 't1' });

    expect(result.results).toEqual([]);
  });

  it('should propagate draw errors', async () => {
    const table = createMockTable([], {
      draw: jest.fn().mockRejectedValue(new Error('Draw failed'))
    });
    setGame(new Map([['t1', table]]));

    await expect(rollOnTableHandler({ tableId: 't1' }))
      .rejects.toThrow('Draw failed');
  });
});

describe('resetTableHandler', () => {
  afterEach(clearGame);

  it('should reset drawn results and return count', async () => {
    const results = [
      createMockResult({ _id: 'r1', drawn: true }),
      createMockResult({ _id: 'r2', drawn: true }),
      createMockResult({ _id: 'r3', drawn: false })
    ];
    const table = createMockTable(results, {
      id: 't1',
      resetResults: jest.fn().mockResolvedValue(undefined)
    });
    setGame(new Map([['t1', table]]));

    const result = await resetTableHandler({ tableId: 't1' });

    expect(result.tableId).toBe('t1');
    expect(result.tableName).toBe('Random Encounters');
    expect(result.resetCount).toBe(2);
    expect(table.resetResults).toHaveBeenCalledTimes(1);
  });

  it('should reject when table not found', async () => {
    setGame(new Map());

    await expect(resetTableHandler({ tableId: 'nonexistent' }))
      .rejects.toThrow('Roll table not found: nonexistent');
  });

  it('should return resetCount 0 when no results are drawn', async () => {
    const results = [
      createMockResult({ drawn: false }),
      createMockResult({ _id: 'r2', drawn: false })
    ];
    const table = createMockTable(results, {
      resetResults: jest.fn().mockResolvedValue(undefined)
    });
    setGame(new Map([['t1', table]]));

    const result = await resetTableHandler({ tableId: 't1' });

    expect(result.resetCount).toBe(0);
    expect(table.resetResults).toHaveBeenCalledTimes(1);
  });

  it('should return resetCount 0 for table with no results', async () => {
    const table = createMockTable([], {
      resetResults: jest.fn().mockResolvedValue(undefined)
    });
    setGame(new Map([['t1', table]]));

    const result = await resetTableHandler({ tableId: 't1' });

    expect(result.resetCount).toBe(0);
  });
});
