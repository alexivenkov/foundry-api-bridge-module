import { NO_VITALS, NoActiveSceneError, SceneNotFoundError } from '../../../shared';
import { CanvasNotReadyError, type MapCollisionTest, type SceneContents } from '../../domain';
import { SceneQueryService } from '../SceneQueryService';
import {
  FakeCollisions,
  FakeSceneLocator,
  FakeSceneReader,
  FakeViewport,
  NOTHING_BLOCKS,
  capture,
  contents,
  sceneToken,
  sceneWall
} from './fakePorts';

interface Setup {
  scenes?: readonly SceneContents[];
  active?: string | null;
  collisionTest?: MapCollisionTest | undefined;
  viewport?: FakeViewport;
}

interface Fixture {
  service: SceneQueryService;
  reader: FakeSceneReader;
  collisions: FakeCollisions;
  viewport: FakeViewport;
}

/** Unless told otherwise, the dungeon is the active scene and the one on the canvas. */
function setup(options: Setup = {}): Fixture {
  const scenes = options.scenes ?? [contents(), contents({ id: 'tavern', name: 'Tavern', active: false })];
  const reader = new FakeSceneReader(scenes);
  const collisions = new FakeCollisions('collisionTest' in options ? options.collisionTest : NOTHING_BLOCKS);
  const viewport = options.viewport ?? new FakeViewport(capture());
  const service = new SceneQueryService({
    scenes: new FakeSceneLocator(
      scenes.map((scene) => scene.id),
      options.active === undefined ? 'dungeon' : options.active
    ),
    reader,
    collisions,
    viewport
  });
  return { service, reader, collisions, viewport };
}

/** Blocks movement between the cells (1,1) and (2,1) of a 100 px grid. */
const WALL_BETWEEN_CELLS: MapCollisionTest = {
  testCollision: (origin, destination) =>
    origin.y === 150 && destination.y === 150 && Math.min(origin.x, destination.x) === 150
};

describe('SceneQueryService', () => {
  describe('listScenes', () => {
    it('lists every scene of the world', () => {
      expect(setup().service.listScenes()).toEqual([
        { id: 'dungeon', name: 'Dungeon', active: true, image: '' },
        { id: 'tavern', name: 'Tavern', active: false, image: '' }
      ]);
    });
  });

  describe('describeScene', () => {
    it('describes the active scene when none is named', () => {
      const { service, reader } = setup();

      expect(service.describeScene({ sceneId: undefined, includeScreenshot: false }).scene.id).toBe('dungeon');
      expect(reader.read).toEqual(['dungeon']);
    });

    it('describes the named scene', () => {
      const description = setup().service.describeScene({ sceneId: 'tavern', includeScreenshot: false });

      expect(description.scene.name).toBe('Tavern');
    });

    it('rejects an unknown scene', () => {
      expect(() => setup().service.describeScene({ sceneId: 'missing', includeScreenshot: false }))
        .toThrow(SceneNotFoundError);
    });

    it('rejects a request without a scene when none is active', () => {
      expect(() => setup({ active: null }).service.describeScene({ sceneId: undefined, includeScreenshot: false }))
        .toThrow(NoActiveSceneError);
    });
  });

  describe('the ASCII map', () => {
    it('is unavailable without a collision test', () => {
      const { service } = setup({ collisionTest: undefined });

      expect(service.describeScene({ sceneId: undefined, includeScreenshot: false }).asciiMap)
        .toBe('[ASCII map unavailable — no collision backend]');
    });

    it('says so when the scene has neither walls nor tokens', () => {
      expect(setup().service.describeScene({ sceneId: undefined, includeScreenshot: false }).asciiMap)
        .toBe('[Empty scene — no walls or tokens]');
    });

    it('is headed by the scene name and the size of a cell', () => {
      const scene = contents({ grid: { size: 50, typeCode: 1, units: 'm', distance: 1.5 }, tokens: [sceneToken()] });

      const { asciiMap } = setup({ scenes: [scene] }).service.describeScene({ sceneId: undefined, includeScreenshot: false });

      expect(asciiMap.startsWith('Dungeon | 1.5m/cell\n')).toBe(true);
    });

    it('lists the tokens with their size, hit points and cell', () => {
      const scene = contents({
        tokens: [
          sceneToken({ id: 't1', name: 'Goblin', x: 100, y: 100 }),
          sceneToken({ id: 't2', name: 'Ogre', x: 300, y: 200, width: 2, height: 2, vitals: NO_VITALS })
        ]
      });

      const { asciiMap } = setup({ scenes: [scene] }).service.describeScene({ sceneId: undefined, includeScreenshot: false });

      expect(asciiMap).toContain(`1   ${'Goblin'.padEnd(30)} 1x1   7/7        (1,1)`);
      expect(asciiMap).toContain(`2   ${'Ogre'.padEnd(30)} 2x2              (3,2)`);
    });

    it.each([
      ['a plain wall', sceneWall(), ' 1 |'],
      ['a closed door', sceneWall({ door: 1, doorState: 0 }), ' 1 D'],
      ['an open door', sceneWall({ door: 1, doorState: 1 }), ' 1 d'],
      ['a locked door', sceneWall({ door: 1, doorState: 2 }), ' 1 L'],
      ['a secret door', sceneWall({ door: 2 }), ' 1 ?']
    ])('draws %s where the canvas says movement is blocked', (_case, wall, expected) => {
      const scene = contents({ walls: [wall], tokens: [sceneToken({ x: 100, y: 100 })] });

      const { asciiMap } = setup({ scenes: [scene], collisionTest: WALL_BETWEEN_CELLS }).service.describeScene({
        sceneId: undefined,
        includeScreenshot: false
      });

      expect(asciiMap).toContain(expected);
    });

    it('asks the collision test about movement between neighbouring cells', () => {
      const testCollision = jest.fn().mockReturnValue(false);
      const scene = contents({ tokens: [sceneToken({ x: 0, y: 0 })] });

      setup({ scenes: [scene], collisionTest: { testCollision } }).service.describeScene({
        sceneId: undefined,
        includeScreenshot: false
      });

      expect(testCollision).toHaveBeenCalledWith({ x: 50, y: 50 }, { x: 150, y: 50 }, { type: 'move', mode: 'any' });
    });
  });

  describe('a scene that is not the one on the canvas', () => {
    const UNAVAILABLE = '[ASCII map unavailable — no collision backend]';
    const furnishedTavern = contents({
      id: 'tavern',
      name: 'Tavern',
      active: false,
      walls: [sceneWall()],
      tokens: [sceneToken()]
    });

    it('gets no map, and the collision test of the other scene is never consulted', () => {
      const { service, collisions } = setup({ scenes: [contents(), furnishedTavern], collisionTest: WALL_BETWEEN_CELLS });

      const description = service.describeScene({ sceneId: 'tavern', includeScreenshot: false });

      expect(description.asciiMap).toBe(UNAVAILABLE);
      expect(collisions.asked).toBe(0);
      expect(description.scene.tokens).toHaveLength(1);
    });

    it('gets no screenshot, and the canvas is not rendered for it', () => {
      const { service, viewport } = setup({ scenes: [contents(), furnishedTavern] });

      const description = service.describeScene({ sceneId: 'tavern', includeScreenshot: true });

      expect(description.screenshot).toBeUndefined();
      expect(viewport.captures).toBe(0);
    });

    it('is described with the canvas once the canvas shows it, active or not', () => {
      const viewport = new FakeViewport(capture({ sceneId: 'tavern', sceneName: 'Tavern' }));
      const { service, collisions } = setup({ scenes: [contents(), furnishedTavern], viewport });

      const description = service.describeScene({ sceneId: 'tavern', includeScreenshot: true });

      expect(description.asciiMap.startsWith('Tavern | 5ft/cell\n')).toBe(true);
      expect(collisions.asked).toBe(1);
      expect(description.screenshot).toEqual(capture().image);
    });

    it('applies to the active scene too, while the GM looks at another one', () => {
      const viewport = new FakeViewport(capture({ sceneId: 'tavern', sceneName: 'Tavern' }));
      const dungeon = contents({ tokens: [sceneToken()] });
      const { service } = setup({ scenes: [dungeon, furnishedTavern], viewport });

      const description = service.describeScene({ sceneId: undefined, includeScreenshot: true });

      expect(description.scene.id).toBe('dungeon');
      expect(description.asciiMap).toBe(UNAVAILABLE);
      expect(description.screenshot).toBeUndefined();
      expect(viewport.captures).toBe(0);
    });

    it('applies to every scene while the canvas shows none', () => {
      const dungeon = contents({ tokens: [sceneToken()] });
      const { service, collisions } = setup({ scenes: [dungeon], viewport: new FakeViewport(null) });

      const description = service.describeScene({ sceneId: undefined, includeScreenshot: true });

      expect(description.asciiMap).toBe(UNAVAILABLE);
      expect(description.screenshot).toBeUndefined();
      expect(collisions.asked).toBe(0);
    });
  });

  describe('the screenshot', () => {
    it('is not taken unless asked for', () => {
      const { service, viewport } = setup();

      const description = service.describeScene({ sceneId: undefined, includeScreenshot: false });

      expect(description.screenshot).toBeUndefined();
      expect(viewport.captures).toBe(0);
    });

    it('is the image of the canvas when asked for', () => {
      const description = setup().service.describeScene({ sceneId: undefined, includeScreenshot: true });

      expect(description.screenshot).toEqual({ data: 'QUJD', mimeType: 'image/webp', width: 1920, height: 1080 });
    });

    it('is left out when the canvas stops showing the scene before it is captured', () => {
      class VanishingViewport extends FakeViewport {
        override capture(): null {
          super.capture();
          return null;
        }
      }
      const viewport = new VanishingViewport(capture());

      const description = setup({ viewport }).service.describeScene({ sceneId: undefined, includeScreenshot: true });

      expect(viewport.captures).toBe(1);
      expect(description.screenshot).toBeUndefined();
      expect(description.scene.id).toBe('dungeon');
    });

    it('is left out when the canvas cannot be rendered, without failing the description', () => {
      const viewport = new FakeViewport(capture());
      viewport.failure = new Error('WebGL context lost');

      const description = setup({ viewport }).service.describeScene({ sceneId: undefined, includeScreenshot: true });

      expect(description.screenshot).toBeUndefined();
      expect(description.asciiMap).toBe('[Empty scene — no walls or tokens]');
    });
  });

  describe('captureViewport', () => {
    it('returns the picture of the canvas with the scene on it', () => {
      expect(setup().service.captureViewport()).toEqual(capture());
    });

    it('fails when no scene is drawn on the canvas', () => {
      const { service } = setup({ viewport: new FakeViewport(null) });

      expect(() => service.captureViewport()).toThrow(CanvasNotReadyError);
      expect(() => service.captureViewport()).toThrow('Canvas not ready');
    });

    it('passes on a rendering failure', () => {
      const viewport = new FakeViewport(capture());
      viewport.failure = new Error('WebGL context lost');

      expect(() => setup({ viewport }).service.captureViewport()).toThrow('WebGL context lost');
    });
  });
});
