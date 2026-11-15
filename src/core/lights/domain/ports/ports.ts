import type { Light, LightChanges, LightDraft, LightKind } from '@/core/lights/domain/model/Light';

// Reads are synchronous: a scene's lights live in memory. `createLight`
// resolves to null when the core created nothing; `updateLight` when the light
// is gone.
export interface LightStore {
  listLights(sceneId: string): readonly Light[];
  findLight(sceneId: string, lightId: string): Light | null;
  createLight(sceneId: string, draft: LightDraft): Promise<Light | null>;
  updateLight(sceneId: string, lightId: string, changes: LightChanges): Promise<Light | null>;
  deleteLight(sceneId: string, lightId: string): Promise<void>;
  /** The ids of the scene's levels; empty where the core has no levels. */
  listSceneLevelIds(sceneId: string): readonly string[];
}

/** What the running Foundry generation stores on a light. */
export interface LightFeatures {
  /** `elevation` (Foundry 12+). */
  readonly elevation: boolean;
  /** `negative` and `priority` (Foundry 12+). */
  readonly darknessSources: boolean;
  /** The `natural-attenuation` and `adaptive-attenuation` colorations (Foundry 14+). */
  readonly attenuationColorations: boolean;
  /** `name`, `locked` and `levels` (Foundry 14+). */
  readonly levels: boolean;
}

export interface LightEnvironment {
  features(): LightFeatures;
  /** The animation ids the world registers for a kind of source; null when they cannot be read. */
  animationTypes(kind: LightKind): readonly string[] | null;
}
