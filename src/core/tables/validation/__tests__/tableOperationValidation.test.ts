import {
  createRollTableFromFolderRequestSchema,
  createTableResultRequestSchema,
  deleteTableResultRequestSchema,
  normalizeRollTableRequestSchema,
  previewTableRollRequestSchema,
  rollOnTableRequestSchema,
  toCreateRollTableFromFolderCommand,
  toCreateTableResultCommand,
  toDeleteTableResultCommand,
  toNormalizeRollTableCommand,
  toPreviewTableRollCommand,
  toRollOnTableCommand,
  toUpdateRollTableCommand,
  toUpdateTableResultCommand,
  updateRollTableRequestSchema,
  updateTableResultRequestSchema
} from '..';

describe('roll-on-table draw options', () => {
  it('keeps the plain draw when no option is given', () => {
    expect(toRollOnTableCommand(rollOnTableRequestSchema.parse({ tableId: 't1', displayChat: false }))).toEqual({
      tableId: 't1',
      displayChat: false
    });
  });

  it('fills the defaults of the options as soon as one is given', () => {
    const command = toRollOnTableCommand(rollOnTableRequestSchema.parse({ tableId: 't1', visibility: 'self' }));

    expect(command.options).toEqual({ count: 1, visibility: 'self', recursive: true, formula: undefined });
  });

  it('maps every option', () => {
    const request = rollOnTableRequestSchema.parse({
      tableId: 't1',
      count: 4,
      visibility: 'blind',
      recursive: false,
      formula: '1d8'
    });

    expect(toRollOnTableCommand(request).options).toEqual({
      count: 4,
      visibility: 'blind',
      recursive: false,
      formula: '1d8'
    });
  });

  it.each([
    ['a count of 0', { count: 0 }],
    ['a count over 100', { count: 101 }],
    ['a fractional count', { count: 1.5 }],
    ['an unknown visibility', { visibility: 'whisper' }],
    ['a numeric formula', { formula: 20 }],
    ['a string recursive', { recursive: 'yes' }]
  ])('rejects %s', (_case, extra) => {
    expect(rollOnTableRequestSchema.safeParse({ tableId: 't1', ...extra }).success).toBe(false);
  });

  it('keeps tolerating a null displayChat', () => {
    expect(rollOnTableRequestSchema.safeParse({ tableId: 't1', displayChat: null, count: 2 }).success).toBe(true);
  });
});

describe('update-roll-table folder', () => {
  it('maps folderId, null meaning the root', () => {
    expect(toUpdateRollTableCommand(updateRollTableRequestSchema.parse({ tableId: 't1', folderId: 'f1' })).changes.folderId).toBe('f1');
    expect(toUpdateRollTableCommand(updateRollTableRequestSchema.parse({ tableId: 't1', folderId: null })).changes.folderId).toBeNull();
  });

  it('rejects an empty folder id', () => {
    expect(updateRollTableRequestSchema.safeParse({ tableId: 't1', folderId: '' }).success).toBe(false);
  });
});

describe('table operation schemas', () => {
  it('maps a preview with the recursive default', () => {
    expect(toPreviewTableRollCommand(previewTableRollRequestSchema.parse({ tableId: 't1' }))).toEqual({
      tableId: 't1',
      options: { formula: undefined, recursive: true }
    });
    expect(previewTableRollRequestSchema.safeParse({ tableId: '' }).success).toBe(false);
  });

  it('maps the requests that only address a table or folder', () => {
    expect(toNormalizeRollTableCommand(normalizeRollTableRequestSchema.parse({ tableId: 't1' }))).toEqual({ tableId: 't1' });
    expect(toCreateRollTableFromFolderCommand(createRollTableFromFolderRequestSchema.parse({ folderId: 'f1' }))).toEqual({
      folderId: 'f1'
    });
    expect(toDeleteTableResultCommand(deleteTableResultRequestSchema.parse({ tableId: 't1', resultId: 'r1' }))).toEqual({
      tableId: 't1',
      resultId: 'r1'
    });
    expect(createRollTableFromFolderRequestSchema.safeParse({}).success).toBe(false);
  });

  it('maps a new row with the defaults of type and weight', () => {
    const request = createTableResultRequestSchema.parse({ tableId: 't1', text: 'Orcs', range: [4, 6] });

    expect(toCreateTableResultCommand(request)).toEqual({
      tableId: 't1',
      draft: { kind: 'text', text: 'Orcs', range: [4, 6], weight: 1, img: undefined, documentCollection: undefined, documentId: undefined }
    });
  });

  it('maps a new compendium row', () => {
    const request = createTableResultRequestSchema.parse({
      tableId: 't1',
      text: 'Sword',
      range: [1, 1],
      weight: 3,
      type: 2,
      documentCollection: 'dnd5e.items',
      documentId: 'i1',
      img: 'icons/sword.webp'
    });

    expect(toCreateTableResultCommand(request).draft).toMatchObject({
      kind: 'compendium',
      weight: 3,
      documentCollection: 'dnd5e.items',
      documentId: 'i1'
    });
  });

  it.each([
    ['a descending range', { range: [5, 1] }],
    ['a fractional range', { range: [1.5, 2] }],
    ['a weight of 0', { weight: 0 }],
    ['a fractional weight', { weight: 1.5 }],
    ['an unknown type code', { type: 3 }],
    ['an empty image', { img: '' }]
  ])('rejects a new row with %s', (_case, extra) => {
    expect(createTableResultRequestSchema.safeParse({ tableId: 't1', text: 'x', range: [1, 2], ...extra }).success).toBe(false);
  });

  it('maps a row update with a new reference', () => {
    const request = updateTableResultRequestSchema.parse({
      tableId: 't1',
      resultId: 'r1',
      type: 1,
      documentCollection: 'Actor',
      documentId: 'a1',
      img: null,
      drawn: true
    });

    expect(toUpdateTableResultCommand(request)).toEqual({
      tableId: 't1',
      resultId: 'r1',
      changes: {
        kind: 'document',
        text: undefined,
        range: undefined,
        weight: undefined,
        drawn: true,
        img: null,
        reference: { collection: 'Actor', id: 'a1' }
      }
    });
  });

  it('maps both reference fields null to dropping the reference, and none to keeping it', () => {
    const dropped = updateTableResultRequestSchema.parse({ tableId: 't1', resultId: 'r1', documentCollection: null, documentId: null });
    const kept = updateTableResultRequestSchema.parse({ tableId: 't1', resultId: 'r1', text: 'x' });

    expect(toUpdateTableResultCommand(dropped).changes.reference).toBeNull();
    expect(toUpdateTableResultCommand(kept).changes.reference).toBeUndefined();
    expect(toUpdateTableResultCommand(kept).changes.kind).toBeUndefined();
  });

  it.each([
    ['only a collection', { documentCollection: 'Actor' }],
    ['only an id', { documentId: 'a1' }],
    ['a collection and a null id', { documentCollection: 'Actor', documentId: null }]
  ])('rejects a row update with %s', (_case, extra) => {
    const parsed = updateTableResultRequestSchema.safeParse({ tableId: 't1', resultId: 'r1', ...extra });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe('documentCollection and documentId must be set together, or both null');
  });
});
