import { getDocumentClassForType, SUPPORTED_DOCUMENT_TYPES } from '../worldDocumentClasses';

function clearGlobals(): void {
  for (const t of ['Actor', 'Item', 'Foo', 'Broken']) {
    delete (globalThis as Record<string, unknown>)[t];
  }
}

describe('getDocumentClassForType', () => {
  afterEach(clearGlobals);

  it('returns class when type is a global with create function', () => {
    const create = jest.fn();
    (globalThis as Record<string, unknown>)['Actor'] = { create };
    const result = getDocumentClassForType('Actor');
    expect(result).toBeDefined();
    expect(result?.create).toBe(create);
  });

  it('returns undefined when global is missing', () => {
    const result = getDocumentClassForType('Foo');
    expect(result).toBeUndefined();
  });

  it('returns undefined when global has no create function', () => {
    (globalThis as Record<string, unknown>)['Broken'] = { foo: 'bar' };
    const result = getDocumentClassForType('Broken');
    expect(result).toBeUndefined();
  });

  it('returns undefined when global is null', () => {
    (globalThis as Record<string, unknown>)['Foo'] = null;
    const result = getDocumentClassForType('Foo');
    expect(result).toBeUndefined();
  });

  it('returns undefined when create is not a function', () => {
    (globalThis as Record<string, unknown>)['Broken'] = { create: 'not-a-fn' };
    const result = getDocumentClassForType('Broken');
    expect(result).toBeUndefined();
  });
});

describe('SUPPORTED_DOCUMENT_TYPES', () => {
  it('exposes the expected document types', () => {
    expect(SUPPORTED_DOCUMENT_TYPES).toEqual([
      'Actor', 'Item', 'JournalEntry', 'Scene', 'RollTable', 'Macro', 'Cards', 'Playlist'
    ]);
  });
});
