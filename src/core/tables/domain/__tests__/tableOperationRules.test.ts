import {
  EmptyFolderError,
  NotARollTableFolderError,
  TableDrawCountError,
  TableFolderNotFoundError,
  TableFormulaError,
  TableResultReferenceError,
  UndrawableFolderError,
  assertDrawCount,
  assertFormulaDice,
  assertReferenceScope,
  assertRollTableFolder,
  assertTableSourceFolder,
  draftReference,
  parseTableFormula,
  resolveResultChange,
  type TableFolder,
  type TableResult
} from '..';

function folder(overrides: Partial<TableFolder> = {}): TableFolder {
  return { id: 'f1', name: 'Monsters', type: 'Actor', documentCount: 3, ...overrides };
}

function row(overrides: Partial<TableResult> = {}): TableResult {
  return {
    id: 'r1',
    kind: 'text',
    text: 'Goblins',
    img: '',
    range: [1, 2],
    weight: 1,
    drawn: false,
    documentCollection: null,
    documentId: null,
    ...overrides
  };
}

describe('draw rules', () => {
  it.each([1, 50, 100])('accepts %p draws', (count) => {
    expect(() => assertDrawCount(count)).not.toThrow();
  });

  it.each([0, 101, 1.5, -1])('rejects %p draws', (count) => {
    expect(() => assertDrawCount(count)).toThrow(TableDrawCountError);
  });

  it('trims a formula and keeps it', () => {
    expect(parseTableFormula('  1d20 + 5 ')).toBe('1d20 + 5');
  });

  it.each([
    ['an empty formula', '   ', 'Invalid roll formula: it is empty'],
    ['a long formula', `1d6${'+1'.repeat(100)}`, 'Invalid roll formula: it is 203 characters long, at most 200 are allowed'],
    ['a data reference', '1d20 + @abilities.wis.mod', 'Invalid roll formula: a table roll has no roll data for @ references']
  ])('refuses %s', (_case, formula, message) => {
    expect(() => parseTableFormula(formula)).toThrow(TableFormulaError);
    expect(() => parseTableFormula(formula)).toThrow(message);
  });

  it('caps the dice a custom formula rolls', () => {
    expect(() => assertFormulaDice(100)).not.toThrow();
    expect(() => assertFormulaDice(101)).toThrow('Invalid roll formula: it rolls 101 dice, at most 100 are allowed');
  });
});

describe('folder rules', () => {
  it('accepts a roll table folder for a table', () => {
    expect(assertRollTableFolder(folder({ type: 'RollTable' }), 'f1')).toMatchObject({ id: 'f1' });
  });

  it('refuses a missing folder and a folder of another document type', () => {
    expect(() => assertRollTableFolder(null, 'gone')).toThrow(new TableFolderNotFoundError('gone'));
    expect(() => assertRollTableFolder(null, 'gone')).toThrow('Folder not found: gone');
    expect(() => assertRollTableFolder(folder(), 'f1')).toThrow(NotARollTableFolderError);
    expect(() => assertRollTableFolder(folder(), 'f1')).toThrow('Folder f1 holds Actor documents, not roll tables');
  });

  it.each(['Actor', 'Cards', 'Item', 'JournalEntry', 'Macro', 'Playlist', 'RollTable', 'Scene'])(
    'builds a table from a folder of %s',
    (type) => {
      expect(() => assertTableSourceFolder(folder({ type }), 'f1')).not.toThrow();
    }
  );

  it.each(['Compendium', 'Adventure', 'ActiveEffect'])('refuses a folder of %s entries', (type) => {
    expect(() => assertTableSourceFolder(folder({ type }), 'f1')).toThrow(UndrawableFolderError);
  });

  it('refuses a missing or empty source folder', () => {
    expect(() => assertTableSourceFolder(null, 'gone')).toThrow('Folder not found: gone');
    expect(() => assertTableSourceFolder(folder({ documentCount: 0 }), 'f1')).toThrow(EmptyFolderError);
    expect(() => assertTableSourceFolder(folder({ documentCount: 0 }), 'f1')).toThrow(
      'Folder f1 holds no documents to build a roll table from'
    );
  });
});

describe('reference rules', () => {
  it('reads a draft reference from both fields', () => {
    expect(
      draftReference({ kind: 'document', text: 'x', range: [1, 1], weight: 1, documentCollection: 'Actor', documentId: 'a1' })
    ).toEqual({ collection: 'Actor', id: 'a1' });
    expect(draftReference({ kind: 'text', text: 'x', range: [1, 1], weight: 1 })).toBeNull();
  });

  it('refuses half a reference and a reference on a text row', () => {
    expect(() => draftReference({ kind: 'document', text: 'x', range: [1, 1], weight: 1, documentId: 'a1' })).toThrow(
      'documentCollection and documentId must be given together'
    );
    expect(() =>
      draftReference({ kind: 'text', text: 'x', range: [1, 1], weight: 1, documentCollection: 'Actor', documentId: 'a1' })
    ).toThrow(TableResultReferenceError);
  });

  it('matches the kind to where the reference points', () => {
    const toActor = { collection: 'Actor', id: 'a1' };
    const toPack = { collection: 'dnd5e.items', id: 'i1' };

    expect(() => assertReferenceScope('document', toActor, 'world')).not.toThrow();
    expect(() => assertReferenceScope('compendium', toPack, 'compendium')).not.toThrow();
    expect(() => assertReferenceScope('document', toPack, 'compendium')).toThrow('dnd5e.items is a compendium pack');
    expect(() => assertReferenceScope('compendium', toActor, 'world')).toThrow('Actor is a world document type');
    expect(() => assertReferenceScope('document', { collection: 'Nope', id: 'x' }, null)).toThrow(
      'Unknown document collection: Nope (neither a world document type nor an installed compendium pack)'
    );
  });
});

describe('resolveResultChange', () => {
  it('passes plain field changes through without touching the kind', () => {
    const resolved = resolveResultChange(row(), { range: [3, 4], weight: 2, drawn: true, img: null });

    expect(resolved.write).toEqual({
      kind: 'text',
      kindChanged: false,
      text: undefined,
      range: [3, 4],
      weight: 2,
      drawn: true,
      img: null,
      reference: undefined
    });
    expect(resolved.referenceToCheck).toBe(false);
  });

  it('moves the label along when the kind changes', () => {
    const resolved = resolveResultChange(row(), { kind: 'document', reference: { collection: 'Actor', id: 'a1' } });

    expect(resolved.write).toMatchObject({ kind: 'document', kindChanged: true, text: 'Goblins' });
    expect(resolved.reference).toEqual({ collection: 'Actor', id: 'a1' });
    expect(resolved.referenceToCheck).toBe(true);
  });

  it('drops the reference of a row that becomes text', () => {
    const current = row({ kind: 'document', text: 'Dragon', documentCollection: 'Actor', documentId: 'a1' });

    const resolved = resolveResultChange(current, { kind: 'text' });

    expect(resolved.write).toMatchObject({ kind: 'text', kindChanged: true, text: 'Dragon', reference: null });
    expect(resolved.referenceToCheck).toBe(false);
  });

  it('checks the kept reference when only the kind changes', () => {
    const current = row({ kind: 'document', text: 'Sword', documentCollection: 'dnd5e.items', documentId: 'i1' });

    const resolved = resolveResultChange(current, { kind: 'compendium' });

    expect(resolved.write.reference).toBeUndefined();
    expect(resolved.reference).toEqual({ collection: 'dnd5e.items', id: 'i1' });
    expect(resolved.referenceToCheck).toBe(true);
  });

  it('keeps a new label as given', () => {
    expect(resolveResultChange(row(), { text: 'Orcs' }).write).toMatchObject({ text: 'Orcs', kindChanged: false });
  });

  it('refuses a reference on a text row', () => {
    expect(() => resolveResultChange(row(), { reference: { collection: 'Actor', id: 'a1' } })).toThrow(
      'A text result cannot reference a document'
    );
  });

  it('clears a reference with null and does not check it', () => {
    const current = row({ kind: 'document', text: 'Dragon', documentCollection: 'Actor', documentId: 'a1' });

    const resolved = resolveResultChange(current, { reference: null });

    expect(resolved.write.reference).toBeNull();
    expect(resolved.reference).toBeNull();
    expect(resolved.referenceToCheck).toBe(false);
  });
});
