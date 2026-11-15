import { SceneNotFoundError, type SceneIdentity, type SceneLocator } from '../../../shared';
import type {
  MapCollisionTest,
  MovementCollisions,
  Scene,
  SceneCloneOverrides,
  SceneContents,
  SceneListing,
  SceneNavigator,
  SceneReader,
  SceneStore,
  SceneToken,
  SceneViewport,
  SceneWall,
  ViewportCapture
} from '../../domain';

export function scene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'dungeon',
    uuid: 'Scene.dungeon',
    name: 'Dungeon',
    active: false,
    width: 4000,
    height: 3000,
    backgroundSrc: 'maps/dungeon.webp',
    navigation: true,
    navName: null,
    navOrder: 0,
    folderName: null,
    grid: { type: 'square', size: 100, distance: 5, units: 'ft' },
    ...overrides
  };
}

export function sceneToken(overrides: Partial<SceneToken> = {}): SceneToken {
  return {
    id: 't1',
    name: 'Goblin',
    actorId: 'a1',
    x: 100,
    y: 100,
    width: 1,
    height: 1,
    elevation: 0,
    hidden: false,
    disposition: -1,
    statuses: [],
    vitals: { hp: { value: 7, max: 7 }, ac: 15 },
    ...overrides
  };
}

export function sceneWall(overrides: Partial<SceneWall> = {}): SceneWall {
  return { id: 'w1', coordinates: [200, 100, 200, 200], movement: 20, sight: 20, door: 0, doorState: 0, ...overrides };
}

export function contents(overrides: Partial<SceneContents> = {}): SceneContents {
  return {
    id: 'dungeon',
    name: 'Dungeon',
    active: true,
    image: '',
    width: 4000,
    height: 3000,
    grid: { size: 100, typeCode: 1, units: 'ft', distance: 5 },
    darkness: 0,
    notes: [],
    walls: [],
    lights: [],
    tiles: [],
    drawings: [],
    regions: [],
    tokens: [],
    ...overrides
  };
}

export class FakeSceneLocator implements SceneLocator {
  constructor(
    private readonly sceneIds: readonly string[],
    private readonly activeId: string | null
  ) {}

  findScene(sceneId: string): SceneIdentity | null {
    return this.sceneIds.includes(sceneId) ? { id: sceneId, name: `Scene ${sceneId}` } : null;
  }

  findActiveScene(): SceneIdentity | null {
    return this.activeId !== null ? { id: this.activeId, name: `Scene ${this.activeId}` } : null;
  }
}

export class FakeSceneStore implements SceneStore, SceneNavigator {
  readonly deleted: string[] = [];
  readonly cloned: Array<{ sourceId: string; overrides: SceneCloneOverrides }> = [];
  readonly activated: string[] = [];
  readonly viewed: string[] = [];
  clonesNothing = false;
  failure: Error | null = null;

  deleteScene(sceneId: string): Promise<void> {
    this.deleted.push(sceneId);
    return this.settle();
  }

  cloneScene(sourceId: string, overrides: SceneCloneOverrides): Promise<Scene | null> {
    this.cloned.push({ sourceId, overrides });
    return Promise.resolve(
      this.clonesNothing ? null : scene({ id: 'copy', name: overrides.name ?? `${sourceId} (Copy)` })
    );
  }

  activateScene(sceneId: string): Promise<void> {
    this.activated.push(sceneId);
    return this.settle();
  }

  viewScene(sceneId: string): Promise<void> {
    this.viewed.push(sceneId);
    return this.settle();
  }

  private settle(): Promise<void> {
    return this.failure !== null ? Promise.reject(this.failure) : Promise.resolve();
  }
}

export class FakeSceneReader implements SceneReader {
  readonly read: string[] = [];

  constructor(private readonly scenes: readonly SceneContents[]) {}

  listScenes(): readonly SceneListing[] {
    return this.scenes.map(({ id, name, active, image }) => ({ id, name, active, image }));
  }

  readScene(sceneId: string): SceneContents {
    this.read.push(sceneId);
    const found = this.scenes.find((candidate) => candidate.id === sceneId);
    if (found === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return found;
  }
}

export class FakeCollisions implements MovementCollisions {
  asked = 0;

  constructor(private readonly test: MapCollisionTest | undefined) {}

  collisionTest(): MapCollisionTest | undefined {
    this.asked += 1;
    return this.test;
  }
}

export const NOTHING_BLOCKS: MapCollisionTest = { testCollision: () => false };

/** A canvas showing the scene of the capture it was given, or no scene at all. */
export class FakeViewport implements SceneViewport {
  captures = 0;
  failure: Error | null = null;

  constructor(private readonly result: ViewportCapture | null) {}

  viewedSceneId(): string | null {
    return this.result?.sceneId ?? null;
  }

  capture(): ViewportCapture | null {
    this.captures += 1;
    if (this.failure !== null) {
      throw this.failure;
    }
    return this.result;
  }
}

export function capture(overrides: Partial<ViewportCapture> = {}): ViewportCapture {
  return {
    sceneId: 'dungeon',
    sceneName: 'Dungeon',
    image: { data: 'QUJD', mimeType: 'image/webp', width: 1920, height: 1080 },
    ...overrides
  };
}
