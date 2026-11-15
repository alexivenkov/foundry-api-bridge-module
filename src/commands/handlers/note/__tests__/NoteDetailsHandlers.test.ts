import { createCreateNoteHandler } from '../CreateNoteHandler';
import { createUpdateNoteHandler } from '../UpdateNoteHandler';
import type { FoundryNoteDocument, FoundryNoteGame, FoundryNoteScene } from '../noteTypes';

function noteDocument(overrides: Partial<FoundryNoteDocument> = {}): FoundryNoteDocument {
  return {
    id: 'n1',
    _id: 'n1',
    x: 0,
    y: 0,
    entryId: null,
    pageId: null,
    text: null,
    texture: { src: 'icons/svg/book.svg', tint: '#ffffff' },
    iconSize: 40,
    fontSize: 32,
    textAnchor: 1,
    textColor: '#ffffff',
    global: false,
    elevation: 0,
    sort: 0,
    fontFamily: '',
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides
  };
}

function setup(): { deps: { gameProvider: { getGame(): FoundryNoteGame } }; scene: FoundryNoteScene } {
  const existing = noteDocument();
  const scene: FoundryNoteScene = {
    id: 'keep',
    notes: { get: (id) => (id === existing.id ? existing : undefined), contents: [existing] },
    createEmbeddedDocuments: jest.fn((_type: 'Note', data: Record<string, unknown>[]) =>
      Promise.resolve([noteDocument({ id: 'n2', _id: 'n2', ...(data[0] as Partial<FoundryNoteDocument>) })])
    ),
    deleteEmbeddedDocuments: jest.fn()
  };
  const game: FoundryNoteGame = { scenes: { get: (id) => (id === 'keep' ? scene : undefined), active: scene } };
  return { deps: { gameProvider: { getGame: () => game } }, scene };
}

describe('note handlers with note details', () => {
  it('creates a note with elevation, sort and font and expands a short tint', async () => {
    const { deps, scene } = setup();

    const result = await createCreateNoteHandler(deps)({
      x: 10,
      y: 20,
      iconTint: '#f80',
      elevation: 5,
      sort: 2,
      fontFamily: 'Modesto Condensed'
    });

    expect((scene.createEmbeddedDocuments as jest.Mock).mock.calls[0]?.[1]).toEqual([
      { x: 10, y: 20, elevation: 5, sort: 2, fontFamily: 'Modesto Condensed', texture: { tint: '#ff8800' } }
    ]);
    expect(result).toMatchObject({ id: 'n2', elevation: 5, sort: 2, fontFamily: 'Modesto Condensed' });
  });

  it('rejects a fractional sort', async () => {
    const { deps } = setup();

    await expect(createUpdateNoteHandler(deps)({ noteId: 'n1', sort: 1.5 })).rejects.toThrow('sort');
  });

  it('reports a missing note', async () => {
    const { deps } = setup();

    await expect(createUpdateNoteHandler(deps)({ noteId: 'ghost', elevation: 1 })).rejects.toThrow('Note not found: ghost');
  });
});
