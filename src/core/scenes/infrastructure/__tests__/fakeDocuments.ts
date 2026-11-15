import type { FoundrySceneDocument, FoundrySceneGame, FoundrySceneLevel } from '../foundrySceneTypes';

/** A scene shaped like the Foundry 13 document: the background is a field, there are no levels and no `img`. */
export function sceneDocument(overrides: Partial<FoundrySceneDocument> = {}): FoundrySceneDocument {
  const document: FoundrySceneDocument = {
    id: 'dungeon',
    uuid: 'Scene.dungeon',
    name: 'Dungeon',
    active: false,
    img: undefined,
    thumb: null,
    width: 4000,
    height: 3000,
    background: { src: 'maps/dungeon.webp' },
    navigation: true,
    navName: null,
    navOrder: 0,
    folder: null,
    grid: { type: 1, size: 100, distance: 5, units: 'ft' },
    darkness: undefined,
    notes: { contents: [] },
    walls: { contents: [] },
    lights: { contents: [] },
    tiles: { contents: [] },
    drawings: { contents: [] },
    regions: { contents: [] },
    tokens: { contents: [] },
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    clone: jest.fn(),
    view: jest.fn().mockResolvedValue(undefined),
    activate: jest.fn().mockResolvedValue(undefined),
    ...overrides
  };
  return document;
}

export function level(overrides: Partial<FoundrySceneLevel> = {}): FoundrySceneLevel {
  return {
    id: 'defaultLevel0000',
    background: { src: 'maps/ground.webp' },
    foreground: { src: null },
    ...overrides
  };
}

/**
 * A scene shaped like the Foundry 14 document: its images live on its levels,
 * and `background` is a deprecated getter that these tests do not allow to be
 * touched. Pass `null` for a scene that has no level.
 */
export function levelledSceneDocument(
  firstLevel: FoundrySceneLevel | null = level(),
  overrides: Partial<FoundrySceneDocument> = {}
): FoundrySceneDocument {
  const document = sceneDocument({ firstLevel: firstLevel ?? undefined, ...overrides });
  Object.defineProperty(document, 'background', {
    get: () => {
      throw new Error('Scene#background is deprecated. Use Level#background and Level#textures instead.');
    }
  });
  return document;
}

/** A world whose first scene is the active one. */
export function gameWith(...scenes: FoundrySceneDocument[]): FoundrySceneGame {
  return {
    scenes: {
      get: (id) => scenes.find((candidate) => candidate.id === id),
      active: scenes[0] ?? null,
      forEach: (fn) => {
        scenes.forEach(fn);
      }
    }
  };
}

export function setGeneration(generation: number): void {
  (globalThis as Record<string, unknown>)['game'] = { release: { generation } };
}

export function clearGeneration(): void {
  delete (globalThis as Record<string, unknown>)['game'];
}
