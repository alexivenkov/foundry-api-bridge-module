import { updateNoteHandler } from '../UpdateNoteHandler';
import type { FoundryNoteDocument } from '../noteTypes';

interface MockScene {
  id: string;
  notes: {
    get: jest.Mock;
    contents: FoundryNoteDocument[];
  };
  createEmbeddedDocuments: jest.Mock;
  deleteEmbeddedDocuments: jest.Mock;
}

const makeMockNote = (overrides: Partial<FoundryNoteDocument> = {}): FoundryNoteDocument => {
  const note: FoundryNoteDocument = {
    id: 'note-1',
    _id: 'note-1',
    x: 100,
    y: 200,
    entryId: 'entry-1',
    pageId: 'page-1',
    text: 'Initial',
    icon: { src: 'icons/svg/book.svg', tint: null },
    iconSize: 40,
    fontSize: 32,
    textAnchor: 1,
    textColor: null,
    global: false,
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides
  };
  (note.update as jest.Mock).mockResolvedValue(note);
  return note;
};

const makeMockScene = (id = 'scene-1', note?: FoundryNoteDocument): MockScene => ({
  id,
  notes: {
    get: jest.fn().mockReturnValue(note),
    contents: note ? [note] : []
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

describe('updateNoteHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = null;
    mockGame.scenes.get.mockReturnValue(undefined);
  });

  it('updates only text', async () => {
    const note = makeMockNote({ id: 'n1', _id: 'n1', text: 'Old' });
    (note.update as jest.Mock).mockResolvedValue({ ...note, text: 'New' });
    mockGame.scenes.active = makeMockScene('active', note);

    const result = await updateNoteHandler({ noteId: 'n1', text: 'New' });

    expect(note.update).toHaveBeenCalledWith({ text: 'New' });
    expect(result.text).toBe('New');
  });

  it('unlinks entryId by setting null', async () => {
    const note = makeMockNote({ id: 'n1', _id: 'n1', entryId: 'old-entry' });
    (note.update as jest.Mock).mockResolvedValue({ ...note, entryId: null });
    mockGame.scenes.active = makeMockScene('active', note);

    const result = await updateNoteHandler({ noteId: 'n1', entryId: null });

    expect(note.update).toHaveBeenCalledWith({ entryId: null });
    expect(result.entryId).toBeNull();
  });

  it('updates icon with both fields', async () => {
    const note = makeMockNote({ id: 'n1', _id: 'n1' });
    (note.update as jest.Mock).mockResolvedValue({
      ...note,
      icon: { src: 'icons/skull.svg', tint: '#660000' }
    });
    mockGame.scenes.active = makeMockScene('active', note);

    const result = await updateNoteHandler({
      noteId: 'n1',
      iconSrc: 'icons/skull.svg',
      iconTint: '#660000'
    });

    expect(note.update).toHaveBeenCalledWith({
      icon: { src: 'icons/skull.svg', tint: '#660000' }
    });
    expect(result.iconSrc).toBe('icons/skull.svg');
    expect(result.iconTint).toBe('#660000');
  });

  it('updates icon tint to null to clear', async () => {
    const note = makeMockNote({ id: 'n1', _id: 'n1' });
    (note.update as jest.Mock).mockResolvedValue({
      ...note,
      icon: { src: 'icons/svg/book.svg', tint: null }
    });
    mockGame.scenes.active = makeMockScene('active', note);

    await updateNoteHandler({ noteId: 'n1', iconTint: null });

    expect(note.update).toHaveBeenCalledWith({ icon: { tint: null } });
  });

  it.each([
    ['center', 0],
    ['bottom', 1],
    ['top', 2],
    ['left', 3],
    ['right', 4]
  ] as const)('maps textAnchor %s → %i', async (anchor, expected) => {
    const note = makeMockNote({ id: 'n1', _id: 'n1' });
    (note.update as jest.Mock).mockResolvedValue({ ...note, textAnchor: expected });
    mockGame.scenes.active = makeMockScene('active', note);

    await updateNoteHandler({ noteId: 'n1', textAnchor: anchor });

    expect(note.update).toHaveBeenCalledWith({ textAnchor: expected });
  });

  it('updates multiple fields together', async () => {
    const note = makeMockNote({ id: 'n1', _id: 'n1' });
    (note.update as jest.Mock).mockResolvedValue({
      ...note,
      x: 500,
      y: 600,
      text: 'Updated',
      iconSize: 80,
      fontSize: 18,
      textAnchor: 4,
      textColor: '#aabbcc',
      global: true
    });
    mockGame.scenes.active = makeMockScene('active', note);

    const result = await updateNoteHandler({
      noteId: 'n1',
      x: 500,
      y: 600,
      text: 'Updated',
      iconSize: 80,
      fontSize: 18,
      textAnchor: 'right',
      textColor: '#aabbcc',
      global: true
    });

    expect(note.update).toHaveBeenCalledWith({
      x: 500,
      y: 600,
      text: 'Updated',
      iconSize: 80,
      fontSize: 18,
      textAnchor: 4,
      textColor: '#aabbcc',
      global: true
    });
    expect(result.x).toBe(500);
    expect(result.textAnchor).toBe('right');
    expect(result.global).toBe(true);
  });

  it('partial update: only x', async () => {
    const note = makeMockNote({ id: 'n1', _id: 'n1', x: 0 });
    (note.update as jest.Mock).mockResolvedValue({ ...note, x: 999 });
    mockGame.scenes.active = makeMockScene('active', note);

    await updateNoteHandler({ noteId: 'n1', x: 999 });

    expect(note.update).toHaveBeenCalledWith({ x: 999 });
  });

  it('partial update: only y', async () => {
    const note = makeMockNote({ id: 'n1', _id: 'n1', y: 0 });
    (note.update as jest.Mock).mockResolvedValue({ ...note, y: 555 });
    mockGame.scenes.active = makeMockScene('active', note);

    await updateNoteHandler({ noteId: 'n1', y: 555 });

    expect(note.update).toHaveBeenCalledWith({ y: 555 });
  });

  it('unlinks pageId by setting null', async () => {
    const note = makeMockNote({ id: 'n1', _id: 'n1', pageId: 'old-page' });
    (note.update as jest.Mock).mockResolvedValue({ ...note, pageId: null });
    mockGame.scenes.active = makeMockScene('active', note);

    const result = await updateNoteHandler({ noteId: 'n1', pageId: null });

    expect(note.update).toHaveBeenCalledWith({ pageId: null });
    expect(result.pageId).toBeNull();
  });

  it('omits update payload entries when params undefined', async () => {
    const note = makeMockNote({ id: 'n1', _id: 'n1' });
    mockGame.scenes.active = makeMockScene('active', note);

    await updateNoteHandler({ noteId: 'n1', text: 'just text' });

    expect(note.update).toHaveBeenCalledWith({ text: 'just text' });
    const callArg = (note.update as jest.Mock).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArg).not.toHaveProperty('x');
    expect(callArg).not.toHaveProperty('y');
    expect(callArg).not.toHaveProperty('icon');
    expect(callArg).not.toHaveProperty('global');
  });

  it('uses scene specified by sceneId', async () => {
    const note = makeMockNote({ id: 'n1', _id: 'n1' });
    (note.update as jest.Mock).mockResolvedValue({ ...note, text: 'X' });
    const specificScene = makeMockScene('specific-scene', note);
    mockGame.scenes.get.mockReturnValue(specificScene);

    await updateNoteHandler({ sceneId: 'specific-scene', noteId: 'n1', text: 'X' });

    expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
  });

  it('throws when note not found', async () => {
    const scene = makeMockScene('active');
    scene.notes.get.mockReturnValue(undefined);
    mockGame.scenes.active = scene;

    await expect(updateNoteHandler({ noteId: 'missing', text: 'x' }))
      .rejects.toThrow('Note not found: missing');
  });

  it('throws when scene not found', async () => {
    mockGame.scenes.get.mockReturnValue(undefined);

    await expect(updateNoteHandler({
      sceneId: 'missing-scene',
      noteId: 'n1',
      text: 'x'
    })).rejects.toThrow('Scene not found: missing-scene');
  });
});
