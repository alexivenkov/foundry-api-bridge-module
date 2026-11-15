import { foundryGeneration } from '@/compat/foundryVersion';
import { SceneNotFoundError, findFoundryScene } from '@/core/shared';
import {
  RegionNotFoundError,
  type RegionBehavior,
  type RegionBehaviorChanges,
  type RegionBehaviorDraft,
  type RegionBehaviorStore
} from '@/core/regions/domain';
import { toFoundrySystem, toRegionBehavior } from './behaviorMapper';
import {
  regionGlobalsFromGlobalThis,
  type FoundryRegionBehaviorDocument,
  type RegionGlobalsProvider
} from './foundryRegionBehaviorTypes';
import type { FoundryRegionDocument } from './foundryRegionTypes';
import { uuidResolverFor, type RegionGameProvider } from './FoundryRegionStore';

/** Anti-corruption layer over a region's embedded RegionBehavior documents. */
export class FoundryRegionBehaviorStore implements RegionBehaviorStore {
  constructor(
    private readonly gameProvider: RegionGameProvider,
    private readonly globals: RegionGlobalsProvider = regionGlobalsFromGlobalThis,
    private readonly generation: () => number = foundryGeneration
  ) {}

  async createBehavior(sceneId: string, regionId: string, draft: RegionBehaviorDraft): Promise<RegionBehavior | null> {
    const data: Record<string, unknown> = {
      type: draft.type,
      system: toFoundrySystem(draft.config, this.extendedTeleport())
    };
    if (draft.name !== undefined) {
      data['name'] = draft.name;
    }
    if (draft.disabled !== undefined) {
      data['disabled'] = draft.disabled;
    }
    const created = await this.requireRegion(sceneId, regionId).createEmbeddedDocuments('RegionBehavior', [data]);
    const document = created[0];
    return document !== undefined ? this.read(document) : null;
  }

  async updateBehavior(
    sceneId: string,
    regionId: string,
    behaviorId: string,
    changes: RegionBehaviorChanges
  ): Promise<RegionBehavior | null> {
    const document = this.requireRegion(sceneId, regionId).behaviors.get(behaviorId);
    if (document === undefined) {
      return null;
    }
    await document.update(this.toUpdateData(changes));
    return this.read(document);
  }

  async deleteBehavior(sceneId: string, regionId: string, behaviorId: string): Promise<void> {
    await this.requireRegion(sceneId, regionId).deleteEmbeddedDocuments('RegionBehavior', [behaviorId]);
  }

  /**
   * A new type needs its `system` force-replaced, or the core refuses the change:
   * Foundry 14 takes a ForcedReplacement operator, older cores the `==system` key.
   */
  private toUpdateData(changes: RegionBehaviorChanges): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    if (changes.name !== undefined) {
      data['name'] = changes.name;
    }
    if (changes.disabled !== undefined) {
      data['disabled'] = changes.disabled;
    }
    if (changes.type === undefined) {
      if (changes.config !== undefined) {
        data['system'] = toFoundrySystem(changes.config, this.extendedTeleport());
      }
      return data;
    }

    const system = changes.config !== undefined ? toFoundrySystem(changes.config, this.extendedTeleport()) : {};

    data['type'] = changes.type;
    const forcedReplacement = this.globals().foundry?.data?.operators?.ForcedReplacement;
    if (this.generation() >= 14 && forcedReplacement !== undefined) {
      data['system'] = forcedReplacement.create(system);
    } else {
      data['==system'] = system;
    }
    return data;
  }

  private extendedTeleport(): boolean {
    return this.generation() >= 14;
  }

  private read(document: FoundryRegionBehaviorDocument): RegionBehavior {
    return toRegionBehavior(document.toObject(), uuidResolverFor(this.globals, document));
  }

  private requireRegion(sceneId: string, regionId: string): FoundryRegionDocument {
    const scene = findFoundryScene(this.gameProvider.getGame().scenes, sceneId);
    if (scene === undefined) {
      throw new SceneNotFoundError(sceneId);
    }
    const region = scene.regions?.get(regionId);
    if (region === undefined) {
      throw new RegionNotFoundError(regionId);
    }
    return region;
  }
}
