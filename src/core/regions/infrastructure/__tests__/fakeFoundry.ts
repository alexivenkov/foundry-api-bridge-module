import type { FoundryRegionBehaviorDocument, FoundryRegionBehaviorSource, FoundryRegionGlobals } from '../foundryRegionBehaviorTypes';
import type { FoundryRegionDocument, FoundryRegionGame, FoundryRegionScene, FoundryRegionSource } from '../foundryRegionTypes';

// Stored data shaped as the Foundry 13.351 / 14.368 data models produced it in the
// Node probe (scratchpad regions/probe7.mjs): defaults filled in, Foundry 14 fields
// present only in the v14 sources.

export const V13_SOURCE: FoundryRegionSource = {
  _id: 'r1',
  name: 'Trap',
  color: '#ff0000',
  shapes: [
    { type: 'rectangle', x: 0, y: 0, width: 100, height: 50, rotation: 30, hole: false },
    { type: 'circle', x: 10, y: 10, radius: 5, hole: true },
    { type: 'ellipse', x: 1, y: 2, radiusX: 3, radiusY: 4, rotation: 0, hole: false },
    { type: 'polygon', points: [0, 0, 100, 0, 50, 80], hole: false }
  ],
  elevation: { bottom: 0, top: 10 },
  visibility: 1,
  locked: true
};

export const V14_SOURCE: FoundryRegionSource = {
  _id: 'r2',
  name: 'V14',
  color: '#5328cc',
  shapes: [
    { type: 'rectangle', x: 0, y: 0, width: 100, height: 50, anchorX: 0.5, anchorY: 0.5, gridBased: true, hole: false, rotation: 0 },
    { type: 'polygon', points: [0, 0, 100, 0, 50, 80], origin: { x: 5, y: 6 }, hole: false },
    { type: 'cone', x: 0, y: 0, radius: 100, angle: 90, rotation: 45, curvature: 'flat', hole: false, gridBased: false },
    { type: 'ring', x: 0, y: 0, radius: 100, innerWidth: 10, outerWidth: 20, hole: false, gridBased: false },
    { type: 'line', x: 0, y: 0, length: 300, width: 50, rotation: 10, hole: false, gridBased: false },
    {
      type: 'emanation',
      base: { type: 'token', x: 100, y: 100, width: 1, height: 2, shape: 0, hole: false },
      radius: 50,
      hole: false,
      gridBased: false
    },
    { type: 'token', x: 100, y: 200, width: 2, height: 2, shape: 5, hole: false },
    { type: 'grid', offsets: [{ i: 1, j: 2 }, { i: 3, j: 4 }], origin: null, hole: false }
  ],
  elevation: { bottom: 0, top: 5, topInclusive: true },
  visibility: 4,
  locked: false,
  levels: ['llllllllllllllll'],
  restriction: { enabled: true, type: 'sight', priority: 3 },
  attachment: { token: 'tttttttttttttttt' },
  highlightMode: 'coverage',
  displayMeasurements: true,
  hidden: true,
  _shapeConstraints: [[0, 0, 10, 0, 10, 10]]
};

export interface FakeBehavior extends FoundryRegionBehaviorDocument {
  source: FoundryRegionBehaviorSource;
  update: jest.Mock;
}

export function fakeBehavior(source: FoundryRegionBehaviorSource): FakeBehavior {
  const document: FakeBehavior = {
    id: source._id,
    source,
    toObject: () => structuredClone(document.source),
    update: jest.fn((data: Record<string, unknown>) => {
      const { system, ...rest } = data;
      document.source = { ...document.source, ...rest } as FoundryRegionBehaviorSource;
      if (system !== null && typeof system === 'object') {
        document.source.system = { ...document.source.system, ...(system as Record<string, unknown>) };
      }
      return Promise.resolve(document);
    })
  };
  return document;
}

export interface FakeRegion extends FoundryRegionDocument {
  source: FoundryRegionSource;
  behaviorDocs: FakeBehavior[];
  update: jest.Mock;
  createEmbeddedDocuments: jest.Mock;
  deleteEmbeddedDocuments: jest.Mock;
}

export function fakeRegion(source: FoundryRegionSource, behaviors: FakeBehavior[] = []): FakeRegion {
  const document: FakeRegion = {
    id: source._id,
    source,
    behaviorDocs: behaviors,
    toObject: () => structuredClone(document.source),
    behaviors: {
      get: (id) => document.behaviorDocs.find((candidate) => candidate.id === id),
      get contents() {
        return document.behaviorDocs;
      }
    },
    update: jest.fn((data: Record<string, unknown>) => {
      document.source = { ...document.source, ...data } as FoundryRegionSource;
      return Promise.resolve(document);
    }),
    createEmbeddedDocuments: jest.fn(),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([])
  };
  return document;
}

export interface FakeScene extends FoundryRegionScene {
  createEmbeddedDocuments: jest.Mock;
  deleteEmbeddedDocuments: jest.Mock;
}

export function fakeScene(
  id: string,
  regions: FakeRegion[],
  extras: Partial<Pick<FoundryRegionScene, 'levels' | 'tokens'>> = {}
): FakeScene {
  return {
    id,
    regions: { get: (regionId) => regions.find((candidate) => candidate.id === regionId), contents: regions },
    tokens: { get: (tokenId) => (tokenId === 't1' ? { id: 't1', name: 'Goblin' } : undefined) },
    ...extras,
    createEmbeddedDocuments: jest.fn(),
    deleteEmbeddedDocuments: jest.fn().mockResolvedValue([])
  };
}

export function gameWith(...scenes: FakeScene[]): { getGame: () => FoundryRegionGame } {
  const game: FoundryRegionGame = {
    scenes: { get: (id) => scenes.find((candidate) => candidate.id === id), active: scenes[0] ?? null }
  };
  return { getGame: () => game };
}

/** `foundry.utils.parseUuid` as Foundry 14 resolves `..<regionId>` against a behavior of scene S / region r1. */
export function globalsWith(extra: FoundryRegionGlobals = {}): () => FoundryRegionGlobals {
  return () => ({
    foundry: {
      utils: {
        parseUuid: (uuid: string) => (uuid.startsWith('..') ? { uuid: `Scene.S.Region.${uuid.slice(2)}` } : null)
      }
    },
    ...extra
  });
}
