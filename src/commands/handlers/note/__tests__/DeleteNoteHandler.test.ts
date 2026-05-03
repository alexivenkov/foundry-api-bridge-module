import { deleteNoteHandler } from '../DeleteNoteHandler';
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

const makeMockNote = (id = 'note-1'): FoundryNoteDocument => ({
  id,
  _id: id,
  x: 0,
  y: 0,
  entryId: null,
  pageId: null,
  text: null,
  icon: { src: 'icons/svg/book.svg' },
  iconSize: 40,
  fontSize: 32,
  textAnchor: 1,
  textColor: null,
  global: false,
  update: jest.fn(),
  delete: jest.fn()
});

const makeMockScene = (id = 'scene-1', note?: FoundryNoteDocument): MockScene => ({
  id,
  notes: {
    get: jest.fn().mockReturnValue(note),
    contents: note ? [note] : []
  },
  createEmbeddedDocuments: jest.fn(),
  deleteEmbeddedDocuments: jest.fn().mockResolvedValue([])
});

const mockGame = {
  scenes: {
    get: jest.fn() as jest.Mock,
    active: null as MockScene | null
  }
};

(globalThis as Record<string, unknown>)['game'] = mockGame;

describe('deleteNoteHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGame.scenes.active = null;
    mockGame.scenes.get.mockReturnValue(undefined);
  });

  it('deletes a note and returns deletion confirmation', async () => {
    const note = makeMockNote('n-doomed');
    mockGame.scenes.active = makeMockScene('active-scene', note);

    const result = await deleteNoteHandler({ noteId: 'n-doomed' });

    expect(mockGame.scenes.active!.deleteEmbeddedDocuments)
      .toHaveBeenCalledWith('Note', ['n-doomed']);
    expect(result).toEqual({
      deleted: true,
      noteId: 'n-doomed',
      sceneId: 'active-scene'
    });
  });

  it('uses scene specified by sceneId', async () => {
    const note = makeMockNote('n-1');
    const specificScene = makeMockScene('specific-scene', note);
    mockGame.scenes.get.mockReturnValue(specificScene);

    const result = await deleteNoteHandler({ sceneId: 'specific-scene', noteId: 'n-1' });

    expect(mockGame.scenes.get).toHaveBeenCalledWith('specific-scene');
    expect(specificScene.deleteEmbeddedDocuments).toHaveBeenCalledWith('Note', ['n-1']);
    expect(result.sceneId).toBe('specific-scene');
  });

  it('throws when note not found', async () => {
    const scene = makeMockScene('active');
    scene.notes.get.mockReturnValue(undefined);
    mockGame.scenes.active = scene;

    await expect(deleteNoteHandler({ noteId: 'missing' }))
      .rejects.toThrow('Note not found: missing');
    expect(scene.deleteEmbeddedDocuments).not.toHaveBeenCalled();
  });

  it('throws when scene not found', async () => {
    mockGame.scenes.get.mockReturnValue(undefined);

    await expect(deleteNoteHandler({ sceneId: 'missing-scene', noteId: 'n1' }))
      .rejects.toThrow('Scene not found: missing-scene');
  });
});
