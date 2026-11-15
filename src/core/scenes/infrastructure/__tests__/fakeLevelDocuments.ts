import type {
  FoundryLevelDocument,
  FoundryLevelSource,
  FoundrySceneDocument,
  FoundrySceneSource
} from '../foundrySceneTypes';
import { levelledSceneDocument, sceneDocument } from './fakeDocuments';

/** A Level as the Foundry 14 client holds it: stored values in `_source`, as the probe of 14.368 shows them. */
export function levelDocument(id: string, source: FoundryLevelSource = {}): FoundryLevelDocument {
  const stored: FoundryLevelSource = {
    name: id,
    elevation: { bottom: 0, top: 20 },
    background: { src: null, color: '#999999', tint: '#ffffff', alphaThreshold: 0.75 },
    foreground: { src: null, tint: '#ffffff', alphaThreshold: 0.75 },
    fog: { src: null },
    textures: { anchorX: 0.5, anchorY: 0.5, offsetX: 0, offsetY: 0, fit: 'fill', scaleX: 1, scaleY: 1, rotation: 0 },
    visibility: { levels: [] },
    sort: 0,
    ...source
  };
  return {
    id,
    name: stored.name,
    sort: stored.sort,
    background: { src: stored.background?.src ?? null },
    foreground: { src: stored.foreground?.src ?? null },
    _source: stored,
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined)
  };
}

/** A Foundry 14 scene with levels; the first one given is the first created, `initialLevelId` the stored initial one. */
export function sceneWithLevels(
  levels: FoundryLevelDocument[],
  options: { initialLevelId?: string; source?: FoundrySceneSource; overrides?: Partial<FoundrySceneDocument> } = {}
): FoundrySceneDocument {
  const initial = levels.find((level) => level.id === options.initialLevelId) ?? levels[0];
  return levelledSceneDocument(levels[0] ?? null, {
    levels: {
      contents: levels,
      get: (id) => levels.find((level) => level.id === id)
    },
    initialLevel: initial,
    _source: { grid: { distance: 5 }, ...options.source },
    ...options.overrides
  });
}

/** A Foundry 13 scene whose stored settings are `source`. */
export function sceneWithSource(source: FoundrySceneSource, overrides: Partial<FoundrySceneDocument> = {}): FoundrySceneDocument {
  return sceneDocument({ _source: source, ...overrides });
}
