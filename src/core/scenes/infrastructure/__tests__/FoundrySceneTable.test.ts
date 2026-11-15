import { FoundrySceneTable } from '../FoundrySceneTable';
import type { FoundrySceneDocument, FoundrySceneGame } from '../foundrySceneTypes';
import { clearGeneration, gameWith, sceneDocument, setGeneration } from './fakeDocuments';
import { levelDocument, sceneWithLevels } from './fakeLevelDocuments';

interface Table {
  table: FoundrySceneTable;
  game: FoundrySceneGame;
  emit: jest.Mock;
  preload: jest.Mock;
}

function tableFor(document: FoundrySceneDocument, extra: Partial<FoundrySceneGame> = {}): Table {
  const emit = jest.fn();
  const preload = jest.fn().mockResolvedValue(undefined);
  const base = gameWith(document);
  const game: FoundrySceneGame = {
    ...base,
    scenes: { ...base.scenes, preload },
    socket: { emit },
    ...extra
  };
  return { table: new FoundrySceneTable({ getGame: () => game }), game, emit, preload };
}

describe('FoundrySceneTable', () => {
  afterEach(clearGeneration);

  describe('pullUsers', () => {
    it('uses Scene#pullUsers on Foundry 13', () => {
      setGeneration(13);
      const pullUsers = jest.fn();
      const { table, emit } = tableFor(sceneDocument({ pullUsers }));

      table.pullUsers('dungeon', ['alice', 'bob']);

      expect(pullUsers.mock.calls).toEqual([[['alice', 'bob']]]);
      expect(emit).not.toHaveBeenCalled();
    });

    it('passes the level as a view option on Foundry 14', () => {
      setGeneration(14);
      const pullUsers = jest.fn();
      const { table } = tableFor(sceneWithLevels([levelDocument('tower')], { overrides: { pullUsers } }));

      table.pullUsers('dungeon', ['alice'], 'tower');

      expect(pullUsers).toHaveBeenCalledWith(['alice'], { level: 'tower' });
    });

    it('emits pullToScene per user on older cores, as Scene#pullUsers does', () => {
      setGeneration(11);
      const pullUsers = jest.fn();
      const { table, emit } = tableFor(sceneDocument({ pullUsers }));

      table.pullUsers('dungeon', ['alice', 'bob']);

      expect(emit.mock.calls).toEqual([
        ['pullToScene', 'dungeon', 'alice'],
        ['pullToScene', 'dungeon', 'bob']
      ]);
      expect(pullUsers).not.toHaveBeenCalled();
    });
  });

  describe('preloadScene', () => {
    it('pushes the preload with the boolean of Foundry 13', async () => {
      setGeneration(13);
      const { table, preload } = tableFor(sceneDocument());

      await table.preloadScene('dungeon');

      expect(preload).toHaveBeenCalledWith('dungeon', true);
    });

    it('broadcasts with the options of Foundry 14, with or without a level', async () => {
      setGeneration(14);
      const { table, preload } = tableFor(sceneDocument());

      await table.preloadScene('dungeon');
      await table.preloadScene('dungeon', 'tower');

      expect(preload.mock.calls).toEqual([
        ['dungeon', { broadcast: true }],
        ['dungeon', { broadcast: true, level: 'tower' }]
      ]);
    });
  });

  it('asks the server to reset the fog of the scene given', () => {
    const { table, emit } = tableFor(sceneDocument());

    table.resetFog('tavern');

    expect(emit).toHaveBeenCalledWith('resetFog', 'tavern');
  });

  describe('thumbnails', () => {
    it('is blocked while the canvas is disabled', () => {
      const get = jest.fn().mockReturnValue(true);
      const { table } = tableFor(sceneDocument(), { settings: { get } });

      expect(table.thumbnailBlocker('dungeon')).toBe('noCanvas');
      expect(get).toHaveBeenCalledWith('core', 'noCanvas');
    });

    it('needs a background or a tile up to Foundry 13', () => {
      setGeneration(13);
      const tile = { x: 0, y: 0, width: 1, height: 1, texture: { src: 't.webp' }, hidden: false, elevation: 0, rotation: 0 };

      expect(tableFor(sceneDocument()).table.thumbnailBlocker('dungeon')).toBeNull();
      expect(tableFor(sceneDocument({ background: { src: null } })).table.thumbnailBlocker('dungeon')).toBe('nothingToDraw');
      expect(
        tableFor(sceneDocument({ background: { src: null }, tiles: { contents: [tile] } })).table.thumbnailBlocker('dungeon')
      ).toBeNull();
    });

    it('needs a background on the initial level on Foundry 14', () => {
      setGeneration(14);
      const bare = sceneWithLevels([levelDocument('ground')]);
      const drawn = sceneWithLevels([levelDocument('ground', { background: { src: 'maps/g.webp' } })]);

      expect(tableFor(bare).table.thumbnailBlocker('dungeon')).toBe('nothingToDraw');
      expect(tableFor(drawn).table.thumbnailBlocker('dungeon')).toBeNull();
      expect(tableFor(sceneWithLevels([])).table.thumbnailBlocker('dungeon')).toBe('nothingToDraw');
    });

    it('names a missing scene before anything else', () => {
      expect(() => tableFor(sceneDocument()).table.thumbnailBlocker('gone')).toThrow('Scene not found: gone');
    });

    it('stores the new thumbnail as the scene directory does, and answers with the stored path', async () => {
      const createThumbnail = jest.fn().mockResolvedValue({ thumb: 'data:image/webp;base64,AAAA' });
      const document = sceneDocument({ createThumbnail });
      (document.update as jest.Mock).mockImplementation(() => {
        document.thumb = 'worlds/w/assets/scenes/dungeon-thumb.webp?1700000000';
        return Promise.resolve(document);
      });

      const thumb = await tableFor(document).table.regenerateThumbnail('dungeon');

      expect(createThumbnail.mock.calls).toEqual([[]]);
      expect(document.update).toHaveBeenCalledWith({ thumb: 'data:image/webp;base64,AAAA' }, { diff: false });
      expect(thumb).toBe('worlds/w/assets/scenes/dungeon-thumb.webp?1700000000');
    });

    it('stores nothing when the core drew nothing', async () => {
      const document = sceneDocument({ createThumbnail: jest.fn().mockResolvedValue({}), thumb: 'old.webp' });

      await expect(tableFor(document).table.regenerateThumbnail('dungeon')).resolves.toBe('old.webp');
      expect(document.update).not.toHaveBeenCalled();
    });

    it('lets a refusal of the core through', async () => {
      const document = sceneDocument({ createThumbnail: jest.fn().mockRejectedValue(new Error('You may not upload files')) });

      await expect(tableFor(document).table.regenerateThumbnail('dungeon')).rejects.toThrow('You may not upload files');
    });
  });
});
