import type { FoundryScenesGame } from '@/core/shared';

/** A `ColorField` initializes to a `Color` (a Number subclass) whose `css` is `#rrggbb`. */
export interface FoundryColorLike {
  readonly css: string;
}

/**
 * `LightData`, the `config` of an AmbientLight (Foundry 13–14). `negative`
 * and `priority` are absent before 12.
 */
export interface FoundryLightConfig {
  negative?: boolean | undefined;
  priority?: number | undefined;
  alpha: number;
  angle: number;
  bright: number;
  color: FoundryColorLike | string | number | null | undefined;
  /** Nullable in the schema; a technique id of `AdaptiveLightingShader.SHADER_TECHNIQUES`. */
  coloration: number | null;
  dim: number;
  attenuation: number;
  luminosity: number;
  saturation: number;
  contrast: number;
  shadows: number;
  animation: {
    type: string | null;
    speed: number;
    intensity: number;
    reverse: boolean;
  };
  darkness: {
    min: number;
    max: number;
  };
}

/**
 * The AmbientLight document fields the context reads and writes (`BaseAmbientLight`,
 * Foundry 13–14). `name`, `locked` and `levels` (a Set of Level ids) exist
 * from 14 on, `elevation` from 12 on.
 */
export interface FoundryLightDocument {
  id: string;
  name?: string | undefined;
  x: number;
  y: number;
  elevation?: number | undefined;
  levels?: Iterable<string> | undefined;
  rotation: number;
  walls: boolean;
  vision: boolean;
  config: FoundryLightConfig;
  hidden: boolean;
  locked?: boolean | undefined;
  update(data: Record<string, unknown>): Promise<unknown>;
}

export interface FoundryLightsCollection {
  get(id: string): FoundryLightDocument | undefined;
  contents: FoundryLightDocument[];
}

/** `Scene#levels`, the embedded Level documents of Foundry 14. */
export interface FoundrySceneLevelsCollection {
  contents: Array<{ id: string }>;
}

export interface FoundryLightScene {
  id: string;
  lights: FoundryLightsCollection;
  levels?: FoundrySceneLevelsCollection | undefined;
  createEmbeddedDocuments(type: 'AmbientLight', data: Record<string, unknown>[]): Promise<FoundryLightDocument[]>;
  deleteEmbeddedDocuments(type: 'AmbientLight', ids: string[]): Promise<unknown[]>;
}

export type FoundryLightGame = FoundryScenesGame<FoundryLightScene>;

/** The animation registries of `CONFIG.Canvas`, keyed by animation id. */
export interface FoundryLightGlobals {
  CONFIG?: {
    Canvas?: {
      lightAnimations?: Record<string, unknown> | undefined;
      darknessAnimations?: Record<string, unknown> | undefined;
    };
  };
}
