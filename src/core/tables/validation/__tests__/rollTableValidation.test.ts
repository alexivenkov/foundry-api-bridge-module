import {
  createRollTableRequestSchema,
  deleteRollTableRequestSchema,
  getRollTableRequestSchema,
  resetTableRequestSchema,
  rollOnTableRequestSchema,
  tableResultKindFromWireCode,
  tableResultKindToWireCode,
  toCreateRollTableCommand,
  toDeleteRollTableCommand,
  toGetRollTableQuery,
  toResetTableCommand,
  toRollOnTableCommand,
  toUpdateRollTableCommand,
  updateRollTableRequestSchema
} from '..';

describe('roll table request schemas', () => {
  it('accepts a table with only its name', () => {
    expect(createRollTableRequestSchema.safeParse({ name: 'Encounters' }).success).toBe(true);
  });

  it.each([
    ['no name', {}],
    ['a non-string name', { name: 5 }],
    ['results that are not a list', { name: 'T', results: 'rows' }],
    ['a result without text', { name: 'T', results: [{ range: [1, 2] }] }],
    ['a result without a range', { name: 'T', results: [{ text: 'A' }] }],
    ['a range of three numbers', { name: 'T', results: [{ text: 'A', range: [1, 2, 3] }] }],
    ['a non-numeric range', { name: 'T', results: [{ text: 'A', range: ['1', '2'] }] }],
    ['a non-numeric result type', { name: 'T', results: [{ text: 'A', range: [1, 2], type: 'text' }] }],
    ['a non-boolean replacement flag', { name: 'T', replacement: 'yes' }]
  ])('rejects a new table with %s', (_case, request) => {
    expect(createRollTableRequestSchema.safeParse(request).success).toBe(false);
  });

  it('accepts null where the command falls back to a default', () => {
    const request = {
      name: 'T',
      formula: null,
      replacement: null,
      displayRoll: null,
      results: [{ text: 'A', range: [1, 2], weight: null, type: null }]
    };

    expect(createRollTableRequestSchema.safeParse(request).success).toBe(true);
    expect(rollOnTableRequestSchema.safeParse({ tableId: 't1', displayChat: null }).success).toBe(true);
  });

  it('does not range-check a result type or a range: the core decides', () => {
    const request = { name: 'T', results: [{ text: 'A', range: [6, 1], type: 9, weight: -1 }] };

    expect(createRollTableRequestSchema.safeParse(request).success).toBe(true);
  });

  it('ignores unknown keys', () => {
    const parsed = createRollTableRequestSchema.parse({
      name: 'T',
      color: 'red',
      results: [{ text: 'A', range: [1, 2], drawn: true }]
    });

    expect(parsed).toEqual({ name: 'T', results: [{ text: 'A', range: [1, 2] }] });
  });

  it('requires the table id wherever a table is addressed', () => {
    expect(getRollTableRequestSchema.safeParse({}).success).toBe(false);
    expect(rollOnTableRequestSchema.safeParse({ displayChat: true }).success).toBe(false);
    expect(resetTableRequestSchema.safeParse({}).success).toBe(false);
    expect(updateRollTableRequestSchema.safeParse({ name: 'x' }).success).toBe(false);
    expect(deleteRollTableRequestSchema.safeParse({ tableId: 7 }).success).toBe(false);
  });

  it('accepts an update that changes nothing and drops rows and folder from one that tries', () => {
    expect(updateRollTableRequestSchema.parse({ tableId: 't1' })).toEqual({ tableId: 't1' });
    expect(updateRollTableRequestSchema.parse({ tableId: 't1', folder: 'f1', results: [] })).toEqual({ tableId: 't1' });
  });
});

describe('roll table request mappers', () => {
  it('fills the defaults of a new table', () => {
    expect(toCreateRollTableCommand({ name: 'Encounters' }).draft).toEqual({
      name: 'Encounters',
      formula: '1d20',
      replacement: true,
      displayRoll: true,
      description: undefined,
      img: undefined,
      folderId: undefined,
      results: undefined
    });
  });

  it('reads null as not given', () => {
    const { draft } = toCreateRollTableCommand({
      name: 'T',
      formula: null,
      replacement: null,
      displayRoll: null,
      results: [{ text: 'A', range: [1, 2], weight: null, type: null }]
    });

    expect(draft).toMatchObject({ formula: '1d20', replacement: true, displayRoll: true });
    expect(draft.results).toEqual([expect.objectContaining({ kind: 'text', weight: 1 })]);
  });

  it('keeps what the caller chose and names the folder field', () => {
    const { draft } = toCreateRollTableCommand({
      name: 'Loot',
      formula: '1d100',
      replacement: false,
      displayRoll: false,
      description: '<p>Hoard</p>',
      img: 'icons/chest.webp',
      folder: 'folder-1'
    });

    expect(draft).toMatchObject({
      formula: '1d100',
      replacement: false,
      displayRoll: false,
      description: '<p>Hoard</p>',
      img: 'icons/chest.webp',
      folderId: 'folder-1'
    });
  });

  it('turns result rows into drafts, defaulting to a text row of weight 1', () => {
    const { draft } = toCreateRollTableCommand({
      name: 'T',
      results: [
        { text: 'Goblin', range: [1, 3] },
        { text: 'Dragon', range: [4, 5], type: 1, weight: 2, documentCollection: 'Actor', documentId: 'a1', img: 'd.webp' },
        { text: 'Sword', range: [6, 6], type: 2 }
      ]
    });

    expect(draft.results).toEqual([
      {
        kind: 'text',
        text: 'Goblin',
        range: [1, 3],
        weight: 1,
        img: undefined,
        documentCollection: undefined,
        documentId: undefined
      },
      {
        kind: 'document',
        text: 'Dragon',
        range: [4, 5],
        weight: 2,
        img: 'd.webp',
        documentCollection: 'Actor',
        documentId: 'a1'
      },
      expect.objectContaining({ kind: 'compendium', text: 'Sword' })
    ]);
  });

  it('keeps an update partial', () => {
    const command = toUpdateRollTableCommand({ tableId: 't1', displayRoll: false });

    expect(command.tableId).toBe('t1');
    expect(command.changes.displayRoll).toBe(false);
    expect(command.changes.name).toBeUndefined();
    expect(command.changes.formula).toBeUndefined();
  });

  it('shows a roll in chat unless told otherwise', () => {
    expect(toRollOnTableCommand({ tableId: 't1' })).toEqual({ tableId: 't1', displayChat: true });
    expect(toRollOnTableCommand({ tableId: 't1', displayChat: null }).displayChat).toBe(true);
    expect(toRollOnTableCommand({ tableId: 't1', displayChat: false }).displayChat).toBe(false);
  });

  it('maps the requests that only address a table', () => {
    expect(toGetRollTableQuery({ tableId: 't1' })).toEqual({ tableId: 't1' });
    expect(toResetTableCommand({ tableId: 't1' })).toEqual({ tableId: 't1' });
    expect(toDeleteRollTableCommand({ tableId: 't1' })).toEqual({ tableId: 't1' });
  });
});

describe('table result wire codes', () => {
  it.each([
    [0, 'text'],
    [1, 'document'],
    [2, 'compendium']
  ] as const)('code %i is a %s result, both ways', (code, kind) => {
    expect(tableResultKindFromWireCode(code)).toBe(kind);
    expect(tableResultKindToWireCode(kind)).toBe(code);
  });

  it.each([undefined, null])('reads an omitted type (%p) as text', (code) => {
    expect(tableResultKindFromWireCode(code)).toBe('text');
  });

  it.each([3, -1, 1.5, 99])('reads the unknown code %d as a document reference instead of rejecting it', (code) => {
    expect(tableResultKindFromWireCode(code)).toBe('document');
  });
});
