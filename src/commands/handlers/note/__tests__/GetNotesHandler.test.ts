import { getNotesHandler } from '../GetNotesHandler';
import type { FoundryNoteDocument, FoundryNoteIcon } from '../noteTypes';

interface MockScene {
  id: string;
  notes: {
    get: jest.Mock;
    contents: FoundryNoteDocument[];
  };
  createEmbeddedDocuments: jest.Mock;
  deleteEmbeddedDocuments: jest.Mock;
}

const makeMockNote = (overrides: Partial<FoundryNoteDocument> = {}): FoundryNoteDocument => ({
  id: 'note-1',
  _id: 'note-1',
  x: 100,
  y: 200,
  entryId: 'entry-1',
  pageId: 'page-1',
  text: 'Note label',
  icon: { src: 'icons/svg/book.svg', tint: '#ffffff' } as FoundryNoteIcon,
  iconSize: 40,
  fontSize: 32,
  textAnchor: 1,
  textColor: '#ffaa00',
  global: false,
  update: jest.fn(),
  delete: jest.fn(),
  ...overrides
});

const makeMockScene = (id = 'scene-1', notes: FoundryNoteDocument[] = []): MockScene => ({
  id,
  notes: {
    get: jest.fn((noteId: string) => notes.find(n => n.id === noteId)),
    contents: notes
  },
  createEmbeddedDocuments: jest.fn(),
  deleteEmbeddedDocuments: jest.fn()
});

const mockGame = {
  scenes: {
    get: jest.fn() as jest.Mock,
    active: null as MockScene | null
  }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

describe('getNotesHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = null;
    mockGame.scenes.get.mockReturnValue(undefined);
  });

  it('returns mapped notes from active scene when no sceneId provided', async () => {
    const notes = [
      makeMockNote({ id: 'n1', _id: 'n1', x: 10, y: 20, textAnchor: 0 }),
      makeMockNote({ id: 'n2', _id: 'n2', x: 30, y: 40, textAnchor: 2 }),
      makeMockNote({ id: 'n3', _id: 'n3', x: 50, y: 60, textAnchor: 4 })
    ];
    mockGame.scenes.active = makeMockScene('active-scene', notes);

    const result = await getNotesHandler({});

    expect(result.sceneId).toBe('active-scene');
    expect(result.notes).toHaveLength(3);
    expect(result.notes[0]).toEqual({
      id: 'n1',
      x: 10,
      y: 20,
      entryId: 'entry-1',
      pageId: 'page-1',
      text: 'Note label',
      iconSrc: 'icons/svg/book.svg',
      iconTint: '#ffffff',
      iconSize: 40,
      fontSize: 32,
      textAnchor: 'center',
      textColor: '#ffaa00',
      global: false
    });
    expect(result.notes[1]?.textAnchor).toBe('top');
    expect(result.notes[2]?.textAnchor).toBe('right');
    expect(mockGame.scenes.get).not.toHaveBeenCalled();
  });

  it('uses scene specified by sceneId', async () => {
    const notes = [makeMockNote({ id: 'n1', _id: 'n1' })];
    const specificScene = makeMockScene('specific-scene', notes);
    mockGame.scenes.get.mockReturnValue(specificScene);

    const result = await getNotesHandler({ sceneId: 'specific-scene' });

    expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
    expect(result.sceneId).toBe('specific-scene');
    expect(result.notes).toHaveLength(1);
  });

  it('returns empty array when scene has no notes', async () => {
    mockGame.scenes.active = makeMockScene('empty-scene', []);

    const result = await getNotesHandler({});

    expect(result.sceneId).toBe('empty-scene');
    expect(result.notes).toEqual([]);
  });

  it('throws when no active scene and no sceneId given', async () => {
    mockGame.scenes.active = null;

    await expect(getNotesHandler({})).rejects.toThrow('No active scene; specify sceneId');
  });

  it('throws when scene not found by sceneId', async () => {
    mockGame.scenes.get.mockReturnValue(undefined);

    await expect(getNotesHandler({ sceneId: 'missing-scene' }))
      .rejects.toThrow('Scene not found: missing-scene');
  });

  it('normalizes icon when given as object form', async () => {
    const note = makeMockNote({
      id: 'n-obj',
      _id: 'n-obj',
      icon: { src: 'icons/svg/sword.svg', tint: '#ff0000' }
    });
    mockGame.scenes.active = makeMockScene('s', [note]);

    const result = await getNotesHandler({});

    expect(result.notes[0]?.iconSrc).toBe('icons/svg/sword.svg');
    expect(result.notes[0]?.iconTint).toBe('#ff0000');
  });

  it('normalizes icon when given as plain string', async () => {
    const note = makeMockNote({
      id: 'n-str',
      _id: 'n-str',
      icon: 'icons/svg/scroll.svg'
    });
    mockGame.scenes.active = makeMockScene('s', [note]);

    const result = await getNotesHandler({});

    expect(result.notes[0]?.iconSrc).toBe('icons/svg/scroll.svg');
    expect(result.notes[0]?.iconTint).toBeNull();
  });

  it('normalizes icon when undefined', async () => {
    const note = makeMockNote({ id: 'n-u', _id: 'n-u', icon: undefined });
    mockGame.scenes.active = makeMockScene('s', [note]);

    const result = await getNotesHandler({});

    expect(result.notes[0]?.iconSrc).toBe('');
    expect(result.notes[0]?.iconTint).toBeNull();
  });

  it('normalizes icon object missing src/tint to defaults', async () => {
    const note = makeMockNote({ id: 'n-empty', _id: 'n-empty', icon: {} });
    mockGame.scenes.active = makeMockScene('s', [note]);

    const result = await getNotesHandler({});

    expect(result.notes[0]?.iconSrc).toBe('');
    expect(result.notes[0]?.iconTint).toBeNull();
  });

  it('falls back to center for unknown textAnchor numbers', async () => {
    const note = makeMockNote({ id: 'n-x', _id: 'n-x', textAnchor: 99 });
    mockGame.scenes.active = makeMockScene('s', [note]);

    const result = await getNotesHandler({});

    expect(result.notes[0]?.textAnchor).toBe('center');
  });

  it('coerces null entryId/pageId/text/textColor to null', async () => {
    const note = makeMockNote({
      id: 'n-null',
      _id: 'n-null',
      entryId: null,
      pageId: null,
      text: null,
      textColor: null
    });
    mockGame.scenes.active = makeMockScene('s', [note]);

    const result = await getNotesHandler({});

    expect(result.notes[0]?.entryId).toBeNull();
    expect(result.notes[0]?.pageId).toBeNull();
    expect(result.notes[0]?.text).toBeNull();
    expect(result.notes[0]?.textColor).toBeNull();
  });

  it('wraps non-Error rejection from getSceneById path via try/catch fallback', async () => {
    const originalGame = (globalThis as Record<string, unknown>)['game'];
    Object.defineProperty(globalThis, 'game', {
      configurable: true,
      get: () => { throw 'plain string thrown'; }
    });

    try {
      await expect(getNotesHandler({})).rejects.toThrow('plain string thrown');
    } finally {
      Object.defineProperty(globalThis, 'game', {
        configurable: true,
        writable: true,
        value: originalGame
      });
    }
  });
});
