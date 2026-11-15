import { SceneNotFoundError } from '../../../shared';
import { FoundrySceneReader } from '../FoundrySceneReader';
import type { FoundrySceneDocument, FoundrySceneToken } from '../foundrySceneTypes';
import {
  clearGeneration,
  gameWith,
  level,
  levelledSceneDocument,
  sceneDocument,
  setGeneration
} from './fakeDocuments';

function readerFor(...scenes: FoundrySceneDocument[]): FoundrySceneReader {
  const game = gameWith(...scenes);
  return new FoundrySceneReader({ getGame: () => game });
}

function token(overrides: Partial<FoundrySceneToken> = {}): FoundrySceneToken {
  return {
    id: 't1',
    name: 'Goblin',
    x: 250,
    y: 350,
    width: 1,
    height: 1,
    elevation: 0,
    hidden: false,
    disposition: -1,
    actor: {
      id: 'a1',
      system: { attributes: { hp: { value: 7, max: 9 }, ac: { value: 13 } } },
      statuses: new Set(['prone'])
    },
    ...overrides
  };
}

describe('FoundrySceneReader', () => {
  beforeEach(() => {
    setGeneration(13);
  });

  afterEach(clearGeneration);

  describe('listScenes', () => {
    it('lists the scenes in the order of the collection', () => {
      const reader = readerFor(
        sceneDocument({ id: 'a', name: 'Alpha', active: true, background: null }),
        sceneDocument({ id: 'b', name: 'Beta', thumb: 'thumbs/beta.webp' })
      );

      expect(reader.listScenes()).toEqual([
        { id: 'a', name: 'Alpha', active: true, image: '' },
        { id: 'b', name: 'Beta', active: false, image: 'thumbs/beta.webp' }
      ]);
    });

    it('lists nothing in an empty world', () => {
      expect(readerFor().listScenes()).toEqual([]);
    });
  });

  describe('the image that stands for a scene', () => {
    function imageOf(scene: FoundrySceneDocument): { listed: string; read: string } {
      const reader = readerFor(scene);
      return { listed: reader.listScenes()[0]?.image ?? 'not listed', read: reader.readScene(scene.id).image };
    }

    it('is its thumbnail', () => {
      const scene = sceneDocument({ thumb: 'thumbs/dungeon.webp', background: { src: 'maps/dungeon.webp' } });

      expect(imageOf(scene)).toEqual({ listed: 'thumbs/dungeon.webp', read: 'thumbs/dungeon.webp' });
    });

    it.each([null, undefined, ''])('is its background while the thumbnail is %p', (thumb) => {
      const scene = sceneDocument({ thumb, background: { src: 'maps/dungeon.webp' } });

      expect(imageOf(scene)).toEqual({ listed: 'maps/dungeon.webp', read: 'maps/dungeon.webp' });
    });

    it.each([
      ['a background without an image', { src: null }],
      ['no background', null]
    ])('is empty for a scene with no thumbnail and %s', (_case, background) => {
      expect(imageOf(sceneDocument({ thumb: null, background }))).toEqual({ listed: '', read: '' });
    });

    it('never comes from `img`, which the scene of Foundry 13 and 14 does not have', () => {
      const scene = sceneDocument({ img: 'scenes/invented.jpg', thumb: null, background: null });

      expect(imageOf(scene)).toEqual({ listed: '', read: '' });
    });

    describe('on Foundry 14', () => {
      beforeEach(() => {
        setGeneration(14);
      });

      it('is its thumbnail', () => {
        const scene = levelledSceneDocument(level(), { thumb: 'thumbs/dungeon.webp' });

        expect(imageOf(scene)).toEqual({ listed: 'thumbs/dungeon.webp', read: 'thumbs/dungeon.webp' });
      });

      it('is the background of its first level while it has no thumbnail, read without the deprecated getter', () => {
        const scene = levelledSceneDocument(level({ background: { src: 'maps/ground.webp' } }), { thumb: null });

        expect(imageOf(scene)).toEqual({ listed: 'maps/ground.webp', read: 'maps/ground.webp' });
      });

      it('is empty for a scene with neither', () => {
        const scene = levelledSceneDocument(level({ background: { src: null } }), { thumb: null });

        expect(imageOf(scene)).toEqual({ listed: '', read: '' });
      });
    });

    describe.each([
      ['Foundry 12', 12],
      ['Foundry 11', 11]
    ])('on %s, which is not installed to verify against', (_name, generation) => {
      beforeEach(() => {
        setGeneration(generation);
      });

      it('is still read from `img`, as before', () => {
        const scene = sceneDocument({ img: 'scenes/legacy.jpg', thumb: 'thumbs/dungeon.webp' });

        expect(imageOf(scene)).toEqual({ listed: 'scenes/legacy.jpg', read: 'scenes/legacy.jpg' });
      });

      it('is empty without `img`', () => {
        expect(imageOf(sceneDocument({ thumb: 'thumbs/dungeon.webp' }))).toEqual({ listed: '', read: '' });
      });
    });

    it('is read the old way while the core version is unknown', () => {
      clearGeneration();

      expect(imageOf(sceneDocument({ img: 'scenes/legacy.jpg', thumb: 'thumbs/dungeon.webp' })).read).toBe('scenes/legacy.jpg');
    });
  });

  describe('readScene', () => {
    it('reads the scene with its grid and darkness', () => {
      const scene = sceneDocument({
        active: true,
        thumb: 'thumbs/dungeon.webp',
        grid: { type: 4, size: 70, distance: 1.5, units: 'm' },
        environment: { darknessLevel: 0.8 }
      });

      expect(readerFor(scene).readScene('dungeon')).toEqual({
        id: 'dungeon',
        name: 'Dungeon',
        active: true,
        image: 'thumbs/dungeon.webp',
        width: 4000,
        height: 3000,
        grid: { size: 70, typeCode: 4, units: 'm', distance: 1.5 },
        darkness: 0.8,
        notes: [],
        walls: [],
        lights: [],
        tiles: [],
        drawings: [],
        regions: [],
        tokens: []
      });
    });

    it('prefers the environment darkness level over the pre-v12 field', () => {
      const reader = readerFor(
        sceneDocument({ id: 'new', darkness: 0.3, environment: { darknessLevel: 0 } }),
        sceneDocument({ id: 'old', darkness: 0.3 }),
        sceneDocument({ id: 'bare', environment: {} })
      );

      expect(reader.readScene('new').darkness).toBe(0);
      expect(reader.readScene('old').darkness).toBe(0.3);
      expect(reader.readScene('bare').darkness).toBe(0);
    });

    it('falls back to defaults for a scene that leaves everything unset', () => {
      const sparse = sceneDocument({
        thumb: undefined,
        background: undefined,
        width: undefined,
        height: undefined,
        grid: { type: undefined, size: undefined, distance: undefined, units: undefined },
        notes: undefined,
        walls: null,
        lights: undefined,
        tiles: null,
        drawings: undefined,
        regions: null,
        tokens: undefined
      });

      expect(readerFor(sparse).readScene('dungeon')).toMatchObject({
        image: '',
        width: 0,
        height: 0,
        grid: { size: 100, typeCode: 1, units: 'ft', distance: 5 },
        darkness: 0,
        notes: [],
        walls: [],
        lights: [],
        tiles: [],
        drawings: [],
        regions: [],
        tokens: []
      });
    });

    it('reads the same defaults for a scene without a grid at all', () => {
      expect(readerFor(sceneDocument({ grid: undefined })).readScene('dungeon').grid).toEqual({
        size: 100,
        typeCode: 1,
        units: 'ft',
        distance: 5
      });
    });

    it('reads walls with their numeric codes untouched, vision coming from the sight field', () => {
      const scene = sceneDocument({
        walls: {
          contents: [
            { _id: 'w1', c: [0, 0, 100, 0], move: 20, sight: 30, door: 1, ds: 2 },
            { _id: 'w2', c: [5, 6, 7, 8], move: 0, sight: 10, door: 2, ds: undefined }
          ]
        }
      });

      expect(readerFor(scene).readScene('dungeon').walls).toEqual([
        { id: 'w1', coordinates: [0, 0, 100, 0], movement: 20, sight: 30, door: 1, doorState: 2 },
        { id: 'w2', coordinates: [5, 6, 7, 8], movement: 0, sight: 10, door: 2, doorState: 0 }
      ]);
    });

    it('reads notes with the label the pin shows', () => {
      const scene = sceneDocument({
        notes: {
          contents: [
            { x: 1, y: 2, text: 'A door', label: 'A door', entryId: 'journal-1' },
            { x: 3, y: 4, text: undefined, label: undefined, entryId: undefined }
          ]
        }
      });

      expect(readerFor(scene).readScene('dungeon').notes).toEqual([
        { x: 1, y: 2, text: 'A door', label: 'A door', entryId: 'journal-1' },
        { x: 3, y: 4, text: '', label: '', entryId: null }
      ]);
    });

    it('reads lights from their config', () => {
      const scene = sceneDocument({
        lights: {
          contents: [
            { x: 1, y: 2, config: { bright: 20, dim: 40, color: '#ffffff', angle: 90 }, walls: false, hidden: true },
            { x: 3, y: 4, config: undefined, walls: undefined, hidden: undefined }
          ]
        }
      });

      expect(readerFor(scene).readScene('dungeon').lights).toEqual([
        { x: 1, y: 2, bright: 20, dim: 40, color: '#ffffff', angle: 90, walls: false, hidden: true },
        { x: 3, y: 4, bright: 0, dim: 0, color: null, angle: 360, walls: true, hidden: false }
      ]);
    });

    it('reads tiles with their texture', () => {
      const scene = sceneDocument({
        tiles: {
          contents: [
            { x: 1, y: 2, width: 512, height: 256, texture: { src: 'tiles/chest.png' }, hidden: true, elevation: 5, rotation: 45 },
            { x: 3, y: 4, width: undefined, height: undefined, texture: undefined, hidden: undefined, elevation: undefined, rotation: undefined }
          ]
        }
      });

      expect(readerFor(scene).readScene('dungeon').tiles).toEqual([
        { x: 1, y: 2, width: 512, height: 256, textureSrc: 'tiles/chest.png', hidden: true, elevation: 5, rotation: 45 },
        { x: 3, y: 4, width: 0, height: 0, textureSrc: '', hidden: false, elevation: 0, rotation: 0 }
      ]);
    });

    it('reads drawings with their shape', () => {
      const scene = sceneDocument({
        drawings: {
          contents: [
            {
              x: 1,
              y: 2,
              shape: { type: 'p', width: 10, height: 20, points: [0, 0, 5, 5] },
              text: 'Trap',
              hidden: true,
              fillColor: '#00ff00',
              strokeColor: '#000000'
            },
            { x: 3, y: 4, shape: undefined, text: undefined, hidden: undefined, fillColor: undefined, strokeColor: null }
          ]
        }
      });

      expect(readerFor(scene).readScene('dungeon').drawings).toEqual([
        {
          x: 1,
          y: 2,
          shape: { type: 'p', width: 10, height: 20, points: [0, 0, 5, 5] },
          text: 'Trap',
          hidden: true,
          fillColor: '#00ff00',
          strokeColor: '#000000'
        },
        { x: 3, y: 4, shape: { type: '', width: 0, height: 0, points: [] }, text: '', hidden: false, fillColor: null, strokeColor: null }
      ]);
    });

    it('reads regions with the types of their shapes', () => {
      const scene = sceneDocument({
        regions: {
          contents: [
            { id: 'r1', name: 'Throne Room', color: '#ff0000', shapes: [{ type: 'rectangle' }, { type: undefined }] },
            { id: 'r2', name: undefined, color: undefined, shapes: undefined }
          ]
        }
      });

      expect(readerFor(scene).readScene('dungeon').regions).toEqual([
        { id: 'r1', name: 'Throne Room', color: '#ff0000', shapeTypes: ['rectangle', ''] },
        { id: 'r2', name: '', color: null, shapeTypes: [] }
      ]);
    });

    it('reads tokens with their actor, statuses and conventional vitals', () => {
      const scene = sceneDocument({ tokens: { contents: [token()] } });

      expect(readerFor(scene).readScene('dungeon').tokens).toEqual([
        {
          id: 't1',
          name: 'Goblin',
          actorId: 'a1',
          x: 250,
          y: 350,
          width: 1,
          height: 1,
          elevation: 0,
          hidden: false,
          disposition: -1,
          statuses: ['prone'],
          vitals: { hp: { value: 7, max: 9 }, ac: 13 }
        }
      ]);
    });

    it('reads a token without an actor, and one whose actor has another data layout', () => {
      const scene = sceneDocument({
        tokens: {
          contents: [
            token({ id: 'orphan', actor: null }),
            token({ id: 'foreign', actor: { id: 'a2', system: { attributes: { hp: { value: null, max: null } } } } })
          ]
        }
      });

      const [orphan, foreign] = readerFor(scene).readScene('dungeon').tokens;

      expect(orphan).toMatchObject({ actorId: null, statuses: [], vitals: { hp: null, ac: null } });
      expect(foreign).toMatchObject({ actorId: 'a2', statuses: [], vitals: { hp: null, ac: null } });
    });

    it('falls back to defaults for a token that leaves everything unset', () => {
      const bare = token({
        name: undefined,
        width: undefined,
        height: undefined,
        elevation: undefined,
        hidden: undefined,
        disposition: undefined
      });
      const scene = sceneDocument({ tokens: { contents: [bare] } });

      expect(readerFor(scene).readScene('dungeon').tokens[0]).toMatchObject({
        name: '',
        width: 1,
        height: 1,
        elevation: 0,
        hidden: false,
        disposition: 0
      });
    });

    it('reads a scene that is not the active one', () => {
      const reader = readerFor(sceneDocument(), sceneDocument({ id: 'tavern', name: 'Tavern' }));

      expect(reader.readScene('tavern').name).toBe('Tavern');
    });

    it('rejects an unknown scene', () => {
      expect(() => readerFor(sceneDocument()).readScene('missing')).toThrow(SceneNotFoundError);
    });
  });
});
