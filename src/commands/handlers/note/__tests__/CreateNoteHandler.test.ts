import { createNoteHandler } from '../CreateNoteHandler';
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

const makeMockNote = (overrides: Partial<FoundryNoteDocument> = {}): FoundryNoteDocument => ({
  id: 'note-new',
  _id: 'note-new',
  x: 100,
  y: 200,
  entryId: null,
  pageId: null,
  text: null,
  icon: { src: 'icons/svg/book.svg', tint: null },
  iconSize: 40,
  fontSize: 32,
  textAnchor: 0,
  textColor: null,
  global: false,
  update: jest.fn(),
  delete: jest.fn(),
  ...overrides
});

const makeMockScene = (id = 'scene-1'): MockScene => ({
  id,
  notes: {
    get: jest.fn(),
    contents: []
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

describe('createNoteHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = makeMockScene('active-scene');
    mockGame.scenes.get.mockReturnValue(undefined);
  });

  it('creates a note with only x/y', async () => {
    const created = makeMockNote({ id: 'n-min', _id: 'n-min', x: 50, y: 75 });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    const result = await createNoteHandler({ x: 50, y: 75 });

    expect(mockGame.scenes.active!.createEmbeddedDocuments).toHaveBeenCalledWith('Note', [
      { x: 50, y: 75 }
    ]);
    expect(result.id).toBe('n-min');
    expect(result.x).toBe(50);
    expect(result.y).toBe(75);
  });

  it('creates a note with entryId and pageId', async () => {
    const created = makeMockNote({ entryId: 'e1', pageId: 'p1' });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createNoteHandler({ x: 10, y: 20, entryId: 'e1', pageId: 'p1' });

    const payload = mockGame.scenes.active!.createEmbeddedDocuments.mock.calls[0]?.[1] as Record<string, unknown>[];
    expect(payload[0]).toEqual({ x: 10, y: 20, entryId: 'e1', pageId: 'p1' });
  });

  it('creates a note with text override', async () => {
    const created = makeMockNote({ text: 'Custom label' });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createNoteHandler({ x: 1, y: 2, text: 'Custom label' });

    const payload = mockGame.scenes.active!.createEmbeddedDocuments.mock.calls[0]?.[1] as Record<string, unknown>[];
    expect(payload[0]?.['text']).toBe('Custom label');
  });

  it('creates a note with both icon fields → icon: { src, tint }', async () => {
    const created = makeMockNote({ icon: { src: 'icons/x.svg', tint: '#ff0000' } });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createNoteHandler({ x: 1, y: 2, iconSrc: 'icons/x.svg', iconTint: '#ff0000' });

    const payload = mockGame.scenes.active!.createEmbeddedDocuments.mock.calls[0]?.[1] as Record<string, unknown>[];
    expect(payload[0]?.['icon']).toEqual({ src: 'icons/x.svg', tint: '#ff0000' });
  });

  it('creates a note with iconSrc only → icon: { src }', async () => {
    const created = makeMockNote({ icon: { src: 'icons/y.svg' } });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createNoteHandler({ x: 1, y: 2, iconSrc: 'icons/y.svg' });

    const payload = mockGame.scenes.active!.createEmbeddedDocuments.mock.calls[0]?.[1] as Record<string, unknown>[];
    expect(payload[0]?.['icon']).toEqual({ src: 'icons/y.svg' });
  });

  it('creates a note with iconTint only → icon: { tint }', async () => {
    const created = makeMockNote({ icon: { tint: '#00ff00' } });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createNoteHandler({ x: 1, y: 2, iconTint: '#00ff00' });

    const payload = mockGame.scenes.active!.createEmbeddedDocuments.mock.calls[0]?.[1] as Record<string, unknown>[];
    expect(payload[0]?.['icon']).toEqual({ tint: '#00ff00' });
  });

  it('omits icon entirely when neither iconSrc nor iconTint provided', async () => {
    const created = makeMockNote();
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createNoteHandler({ x: 1, y: 2 });

    const payload = mockGame.scenes.active!.createEmbeddedDocuments.mock.calls[0]?.[1] as Record<string, unknown>[];
    expect(payload[0]).not.toHaveProperty('icon');
  });

  it.each([
    ['center', 0],
    ['bottom', 1],
    ['top', 2],
    ['left', 3],
    ['right', 4]
  ] as const)('maps textAnchor %s → %i', async (anchor, expected) => {
    const created = makeMockNote({ textAnchor: expected });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createNoteHandler({ x: 1, y: 2, textAnchor: anchor });

    const payload = mockGame.scenes.active!.createEmbeddedDocuments.mock.calls[0]?.[1] as Record<string, unknown>[];
    expect(payload[0]?.['textAnchor']).toBe(expected);
  });

  it('creates a note with global=true', async () => {
    const created = makeMockNote({ global: true });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createNoteHandler({ x: 1, y: 2, global: true });

    const payload = mockGame.scenes.active!.createEmbeddedDocuments.mock.calls[0]?.[1] as Record<string, unknown>[];
    expect(payload[0]?.['global']).toBe(true);
  });

  it('creates a note with all simple fields together', async () => {
    const created = makeMockNote({
      id: 'n-full',
      _id: 'n-full',
      x: 100,
      y: 200,
      entryId: 'e1',
      pageId: 'p1',
      text: 'Full',
      iconSize: 64,
      fontSize: 24,
      textAnchor: 2,
      textColor: '#abcdef',
      global: true
    });
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createNoteHandler({
      x: 100,
      y: 200,
      entryId: 'e1',
      pageId: 'p1',
      text: 'Full',
      iconSize: 64,
      fontSize: 24,
      textAnchor: 'top',
      textColor: '#abcdef',
      global: true
    });

    const payload = mockGame.scenes.active!.createEmbeddedDocuments.mock.calls[0]?.[1] as Record<string, unknown>[];
    expect(payload[0]).toEqual({
      x: 100,
      y: 200,
      entryId: 'e1',
      pageId: 'p1',
      text: 'Full',
      iconSize: 64,
      fontSize: 24,
      textAnchor: 2,
      textColor: '#abcdef',
      global: true
    });
  });

  it('uses scene specified by sceneId', async () => {
    const specificScene = makeMockScene('specific-scene');
    const created = makeMockNote();
    specificScene.createEmbeddedDocuments.mockResolvedValue([created]);
    mockGame.scenes.get.mockReturnValue(specificScene);

    await createNoteHandler({ sceneId: 'specific-scene', x: 1, y: 2 });

    expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
    expect(specificScene.createEmbeddedDocuments).toHaveBeenCalled();
  });

  it('uses active scene when sceneId omitted', async () => {
    const created = makeMockNote();
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([created]);

    await createNoteHandler({ x: 1, y: 2 });

    expect(mockGame.scenes.get).not.toHaveBeenCalled();
    expect(mockGame.scenes.active!.createEmbeddedDocuments).toHaveBeenCalled();
  });

  it('throws when no active scene and no sceneId provided', async () => {
    mockGame.scenes.active = null;

    await expect(createNoteHandler({ x: 1, y: 2 }))
      .rejects.toThrow('No active scene; specify sceneId');
  });

  it('throws when createEmbeddedDocuments returns empty array', async () => {
    mockGame.scenes.active!.createEmbeddedDocuments.mockResolvedValue([]);

    await expect(createNoteHandler({ x: 1, y: 2 }))
      .rejects.toThrow('Note creation returned no document');
  });
});
