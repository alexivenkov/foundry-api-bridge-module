import { foundryGeneration } from '@/compat/foundryVersion';
import type {
  TokenAppearanceEnvironment,
  TokenFeatures,
  TokenLightKind,
  TokenSightChanges
} from '@/core/tokens/domain';

/** The client registries the token appearance draws on (`CONFIG`, Foundry 13–14). */
export interface FoundryTokenAppearanceGlobals {
  CONFIG?: {
    Canvas?: {
      lightAnimations?: Record<string, unknown> | undefined;
      darknessAnimations?: Record<string, unknown> | undefined;
      visionModes?: Record<string, { vision?: { defaults?: Record<string, unknown> } } | undefined> | undefined;
      detectionModes?: Record<string, unknown> | undefined;
    };
    Token?: { movement?: { actions?: Record<string, unknown> | undefined } | undefined };
    Combat?: { settings?: { turnMarkerAnimations?: Array<{ value: string }> | undefined } | undefined };
  };
}

export type TokenAppearanceGlobalsProvider = () => FoundryTokenAppearanceGlobals;

const fromGlobalThis: TokenAppearanceGlobalsProvider = () => globalThis as unknown as FoundryTokenAppearanceGlobals;

/**
 * BaseToken verified against Foundry 13.351 and 14.368: `ring`, light
 * `negative` / `priority`, `shape`, `turnMarker` and `movementAction` exist in
 * both; `depth` and the attenuation colorations only in 14; texture offset and
 * rotation only in 13. 11 and 12 are not installed: the ring and darkness
 * sources are taken as 12 additions, shape / turn marker / movement action as
 * 13 additions. Generation 0 means "not known yet" and reads as the newest.
 */
export function tokenFeaturesFor(generation: number): TokenFeatures {
  const since = (first: number): boolean => generation === 0 || generation >= first;
  return {
    ring: since(12),
    darknessSources: since(12),
    movement: since(13),
    depth: since(14),
    textureOffset: !since(14)
  };
}

const NUMERIC_SIGHT_DEFAULTS = ['range', 'angle', 'attenuation', 'brightness', 'saturation', 'contrast'] as const;

/** The vision-mode defaults the token sheet applies (`VisionMode#vision.defaults`), reduced to sight fields. */
function toSightDefaults(defaults: Record<string, unknown> | undefined): TokenSightChanges {
  if (defaults === undefined) {
    return {};
  }
  const sight: Record<string, number | string | null> = {};
  for (const field of NUMERIC_SIGHT_DEFAULTS) {
    const value = defaults[field];
    if (typeof value === 'number') {
      sight[field] = value;
    }
  }
  const color = defaults['color'];
  if (typeof color === 'string' || color === null) {
    sight['color'] = color;
  }
  return sight as TokenSightChanges;
}

export class FoundryTokenAppearanceEnvironment implements TokenAppearanceEnvironment {
  constructor(
    private readonly globals: TokenAppearanceGlobalsProvider = fromGlobalThis,
    private readonly generation: () => number = foundryGeneration
  ) {}

  features(): TokenFeatures {
    return tokenFeaturesFor(this.generation());
  }

  lightAnimations(kind: TokenLightKind): readonly string[] | null {
    const canvas = this.globals().CONFIG?.Canvas;
    const registry = kind === 'darkness' ? canvas?.darknessAnimations : canvas?.lightAnimations;
    return registry ? Object.keys(registry) : null;
  }

  visionModes(): readonly string[] | null {
    const modes = this.globals().CONFIG?.Canvas?.visionModes;
    return modes ? Object.keys(modes) : null;
  }

  visionModeDefaults(visionMode: string): TokenSightChanges {
    return toSightDefaults(this.globals().CONFIG?.Canvas?.visionModes?.[visionMode]?.vision?.defaults);
  }

  detectionModes(): readonly string[] | null {
    const modes = this.globals().CONFIG?.Canvas?.detectionModes;
    return modes ? Object.keys(modes) : null;
  }

  movementActions(): readonly string[] | null {
    const actions = this.globals().CONFIG?.Token?.movement?.actions;
    return actions ? Object.keys(actions) : null;
  }

  turnMarkerAnimations(): readonly string[] | null {
    const animations = this.globals().CONFIG?.Combat?.settings?.turnMarkerAnimations;
    return animations ? animations.map((animation) => animation.value) : null;
  }
}
