import { listRollTablesHandler } from '../ListRollTablesHandler';
import { getRollTableHandler } from '../GetRollTableHandler';
import type { FoundryRollTable, FoundryTableResult } from '../tableTypes';

function createMockResult(overrides?: Partial<FoundryTableResult>): FoundryTableResult {
  return {
    _id: 'result-1',
    type: 0,
    text: 'Goblin Ambush',
    name: undefined,
    img: 'icons/creature.webp',
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
    description: '<p>Encounter table</p>',
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

function setGame(tables: FoundryRollTable[]): void {
  (globalThis as Record<string, unknown>)['game'] = {
    tables: {
      forEach: jest.fn((fn: (t: FoundryRollTable) => void) => { tables.forEach(fn); }),
      get: jest.fn((id: string) => tables.find(t => t.id === id))
    }
  };
}

function clearGame(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}

describe('listRollTablesHandler', () => {
  afterEach(clearGame);

  it('should return all tables as summaries', async () => {
    const results = [
      createMockResult({ _id: 'r1', drawn: false }),
      createMockResult({ _id: 'r2', drawn: true }),
      createMockResult({ _id: 'r3', drawn: true })
    ];
    setGame([
      createMockTable(results, { id: 't1', name: 'Encounters', formula: '1d6' }),
      createMockTable([], { id: 't2', name: 'Loot', formula: '1d100' })
    ]);

    const result = await listRollTablesHandler({} as Record<string, never>);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 't1',
      name: 'Encounters',
      img: 'icons/d20.svg',
      description: '<p>Encounter table</p>',
      formula: '1d6',
      replacement: true,
      totalResults: 3,
      drawnResults: 2
    });
    expect(result[1]?.totalResults).toBe(0);
    expect(result[1]?.drawnResults).toBe(0);
  });

  it('should return empty array when no tables exist', async () => {
    setGame([]);

    const result = await listRollTablesHandler({} as Record<string, never>);

    expect(result).toEqual([]);
  });

  it('should fallback img to empty string when undefined', async () => {
    setGame([createMockTable([], { img: undefined })]);

    const result = await listRollTablesHandler({} as Record<string, never>);

    expect(result[0]?.img).toBe('');
  });

  it('should fallback description to empty string when undefined', async () => {
    setGame([createMockTable([], { description: undefined })]);

    const result = await listRollTablesHandler({} as Record<string, never>);

    expect(result[0]?.description).toBe('');
  });

  it('should count drawn results correctly with no drawn', async () => {
    const results = [
      createMockResult({ drawn: false }),
      createMockResult({ _id: 'r2', drawn: false })
    ];
    setGame([createMockTable(results)]);

    const result = await listRollTablesHandler({} as Record<string, never>);

    expect(result[0]?.drawnResults).toBe(0);
  });
});

describe('getRollTableHandler', () => {
  afterEach(clearGame);

  it('should return full table with results', async () => {
    const results = [
      createMockResult({
        _id: 'r1', type: 0, text: 'Nothing happens',
        range: [1, 2] as [number, number], weight: 1, drawn: false
      }),
      createMockResult({
        _id: 'r2', type: 1, text: 'Dragon',
        range: [3, 4] as [number, number], weight: 2, drawn: true,
        documentCollection: 'Actor', documentId: 'actor-123', img: 'dragon.webp'
      })
    ];
    setGame([createMockTable(results, { id: 'table-1' })]);

    const result = await getRollTableHandler({ tableId: 'table-1' });

    expect(result.id).toBe('table-1');
    expect(result.name).toBe('Random Encounters');
    expect(result.formula).toBe('1d6');
    expect(result.replacement).toBe(true);
    expect(result.displayRoll).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toEqual({
      id: 'r1', type: 0, text: 'Nothing happens', img: 'icons/creature.webp',
      range: [1, 2], weight: 1, drawn: false,
      documentCollection: null, documentId: null
    });
    expect(result.results[1]).toEqual({
      id: 'r2', type: 1, text: 'Dragon', img: 'dragon.webp',
      range: [3, 4], weight: 2, drawn: true,
      documentCollection: 'Actor', documentId: 'actor-123'
    });
  });

  it('should reject when table not found', async () => {
    setGame([]);

    await expect(getRollTableHandler({ tableId: 'nonexistent' }))
      .rejects.toThrow('Roll table not found: nonexistent');
  });

  it('should return table with empty results', async () => {
    setGame([createMockTable([], { id: 't1' })]);

    const result = await getRollTableHandler({ tableId: 't1' });

    expect(result.results).toEqual([]);
  });

  it('should fallback result img to empty string', async () => {
    setGame([createMockTable([createMockResult({ img: undefined })], { id: 't1' })]);

    const result = await getRollTableHandler({ tableId: 't1' });

    expect(result.results[0]?.img).toBe('');
  });

  it('should fallback documentCollection and documentId to null', async () => {
    setGame([createMockTable([createMockResult()], { id: 't1' })]);

    const result = await getRollTableHandler({ tableId: 't1' });

    expect(result.results[0]?.documentCollection).toBeNull();
    expect(result.results[0]?.documentId).toBeNull();
  });

  it('should handle v13 result with name instead of text', async () => {
    const v13Result = createMockResult({ text: undefined, name: 'Treasure Hoard' });
    setGame([createMockTable([v13Result], { id: 't1' })]);

    const result = await getRollTableHandler({ tableId: 't1' });

    expect(result.results[0]?.text).toBe('Treasure Hoard');
  });

  it('should fallback to empty string when both text and name are undefined', async () => {
    const bareResult = createMockResult({ text: undefined, name: undefined });
    setGame([createMockTable([bareResult], { id: 't1' })]);

    const result = await getRollTableHandler({ tableId: 't1' });

    expect(result.results[0]?.text).toBe('');
  });

  it('should handle v13 string type values', async () => {
    const textResult = createMockResult({ type: 'text' as unknown as number });
    const docResult = createMockResult({ _id: 'r2', type: 'document' as unknown as number });
    setGame([createMockTable([textResult, docResult], { id: 't1' })]);

    const result = await getRollTableHandler({ tableId: 't1' });

    expect(result.results[0]?.type).toBe(0);
    expect(result.results[1]?.type).toBe(1);
  });
});
