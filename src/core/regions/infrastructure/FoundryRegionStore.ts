import { foundryGeneration } from '@/compat/foundryVersion';
import { SceneNotFoundError, findFoundryScene, type GameProvider } from '@/core/shared';
import {
  RegionNotFoundError,
  type ElevatedPoint,
  type Region,
  type RegionBehavior,
  type RegionChanges,
  type RegionDraft,
  type RegionFeatures,
  type RegionPointTest,
  type RegionStore,
  type RegionTokenRef
} from '@/core/regions/domain';
import { toRegionBehavior, type UuidResolver } from './behaviorMapper';
import {
  regionGlobalsFromGlobalThis,
  type FoundryRegionBehaviorDocument,
  type RegionGlobalsProvider
} from './foundryRegionBehaviorTypes';
import type { FoundryRegionDocument, FoundryRegionGame, FoundryRegionScene } from './foundryRegionTypes';
import { toFoundryRegionData, toRegion } from './regionMapper';

export type RegionGameProvider = GameProvider<FoundryRegionGame>;

const BASE_FEATURES: RegionFeatures = {
  available: true,
  shapeTypes: ['rectangle', 'circle', 'ellipse', 'polygon'],
  visibilities: ['layer', 'gamemaster', 'always'],
  extendedModel: false
};

const EXTENDED_FEATURES: RegionFeatures = {
  available: true,
  shapeTypes: ['rectangle', 'circle', 'ellipse', 'polygon', 'cone', 'ring', 'line', 'emanation', 'token', 'grid'],
  visibilities: ['layer', 'gamemaster', 'always', 'observer', 'layer-unlocked'],
  extendedModel: true
};

/** Turns the relative UUIDs Foundry 14 stores into absolute ones, against the behavior that holds them. */
export function uuidResolverFor(globals: RegionGlobalsProvider, behavior: FoundryRegionBehaviorDocument): UuidResolver {
  return (uuid) => {
    if (!uuid.startsWith('.')) {
      return uuid;
    }
    const parsed = globals().foundry?.utils?.parseUuid?.(uuid, { relative: behavior });
    return typeof parsed?.uuid === 'string' ? parsed.uuid : uuid;
  };
}

export function readRegion(document: FoundryRegionDocument, globals: RegionGlobalsProvider): Region {
  const behaviors: RegionBehavior[] = document.behaviors.contents.map((behavior) =>
    toRegionBehavior(behavior.toObject(), uuidResolverFor(globals, behavior))
  );
  return toRegion(document.toObject(), behaviors);
}

/** Anti-corruption layer over a scene's embedded Region documents. */
export class FoundryRegionStore implements RegionStore {
  constructor(
    private readonly gameProvider: RegionGameProvider,
    private readonly globals: RegionGlobalsProvider = regionGlobalsFromGlobalThis,
    private readonly generation: () => number = foundryGeneration
  ) {}

  features(): RegionFeatures {
    const generation = this.generation();
    if (generation < 12) {
      return { ...BASE_FEATURES, available: false };
    }
    return generation >= 14 ? EXTENDED_FEATURES : BASE_FEATURES;
  }

  listRegions(sceneId: string): readonly Region[] {
    return this.regionsOf(sceneId).contents.map((document) => readRegion(document, this.globals));
  }

  findRegion(sceneId: string, regionId: string): Region | null {
    const document = this.regionsOf(sceneId).get(regionId);
    return document !== undefined ? readRegion(document, this.globals) : null;
  }

  async createRegion(sceneId: string, draft: RegionDraft): Promise<Region | null> {
    const created = await this.requireScene(sceneId).createEmbeddedDocuments('Region', [toFoundryRegionData(draft)]);
    const document = created[0];
    return document !== undefined ? readRegion(document, this.globals) : null;
  }

  async updateRegion(sceneId: string, regionId: string, changes: RegionChanges): Promise<Region | null> {
    const document = this.regionsOf(sceneId).get(regionId);
    if (document === undefined) {
      return null;
    }
    await document.update(toFoundryRegionData(changes));
    return readRegion(document, this.globals);
  }

  async deleteRegion(sceneId: string, regionId: string): Promise<void> {
    await this.requireScene(sceneId).deleteEmbeddedDocuments('Region', [regionId]);
  }

  hasToken(sceneId: string, tokenId: string): boolean {
    return this.requireScene(sceneId).tokens.get(tokenId) !== undefined;
  }

  findMissingLevels(sceneId: string, levelIds: readonly string[]): readonly string[] {
    const levels = this.requireScene(sceneId).levels;
    return levelIds.filter((levelId) => levels?.get(levelId) === undefined);
  }

  listTokensInside(sceneId: string, regionId: string): readonly RegionTokenRef[] {
    const document = this.requireRegion(sceneId, regionId);
    return [...(document.tokens ?? [])].map((token) => ({ id: token.id, name: token.name ?? '' }));
  }

  testPoint(sceneId: string, regionId: string, point: ElevatedPoint): RegionPointTest {
    const document = this.requireRegion(sceneId, regionId);
    if (typeof document.testPoint !== 'function') {
      return { kind: 'unavailable' };
    }
    // Foundry 14 clips a wall-restricted region on one level by constraints that a GM
    // client viewing that level computes; until then the core treats it as empty. (On
    // no level or several the core never computes them: empty is its final answer.)
    const source = document.toObject();
    if (
      source.restriction?.enabled === true &&
      source.levels?.length === 1 &&
      (source._shapeConstraints ?? null) === null
    ) {
      return { kind: 'shape-not-computed' };
    }
    // Foundry 13+ reads the elevation from the point, Foundry 12 from the second argument.
    const inside = document.testPoint({ x: point.x, y: point.y, elevation: point.elevation }, point.elevation);
    return { kind: 'answered', inside };
  }

  private requireRegion(sceneId: string, regionId: string): FoundryRegionDocument {
    const document = this.regionsOf(sceneId).get(regionId);
    if (document === undefined) {
      throw new RegionNotFoundError(regionId);
    }
    return document;
  }

  private regionsOf(sceneId: string): NonNullable<FoundryRegionScene['regions']> {
    return this.requireScene(sceneId).regions ?? { get: () => undefined, contents: [] };
  }

  private requireScene(sceneId: string): FoundryRegionScene {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    return scene;
  }
}
