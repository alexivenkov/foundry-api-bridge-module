import { foundryGeneration } from '@/compat/foundryVersion';
import type {
  FogExplorationMode,
  SceneAmbience,
  SceneEnvironment,
  SceneFog,
  SceneSettings
} from '@/core/scenes/domain';
import type {
  FoundryAmbienceSource,
  FoundryLevelSource,
  FoundrySceneDocument,
  FoundrySceneEnvironmentSource,
  FoundrySceneSource
} from './foundrySceneTypes';
import { fogModeFromCode } from './sceneCodes';
import { usesFlatEnvironmentKeys } from './sceneFeatures';

// The core's defaults (a bare BaseScene of 13.351 and 14.368), for fields a
// document leaves unset.
const DEFAULT_BASE_AMBIENCE: SceneAmbience = { hue: 0, intensity: 0, luminosity: 0, saturation: 0, shadows: 0 };
const DEFAULT_DARK_AMBIENCE: SceneAmbience = {
  hue: 257 / 360,
  intensity: 0,
  luminosity: -0.25,
  saturation: 0,
  shadows: 0
};
const DEFAULT_GLOBAL_LIGHT_ALPHA = 0.5;
const DEFAULT_GRID_STYLE = 'solidLines';
const DEFAULT_GRID_COLOR = '#000000';
const DEFAULT_GRID_ALPHA = 0.2;
const DEFAULT_GRID_THICKNESS = 1;
export const DEFAULT_BACKGROUND_COLOR = '#999999';

export type FoundrySceneSettingsFields = Pick<
  FoundrySceneDocument,
  '_source' | 'environment' | 'darkness' | 'foregroundElevation' | 'firstLevel' | 'initialLevel'
>;

function toAmbience(source: FoundryAmbienceSource | undefined, fallback: SceneAmbience): SceneAmbience {
  return {
    hue: source?.hue ?? fallback.hue,
    intensity: source?.intensity ?? fallback.intensity,
    luminosity: source?.luminosity ?? fallback.luminosity,
    saturation: source?.saturation ?? fallback.saturation,
    shadows: source?.shadows ?? fallback.shadows
  };
}

function toEnvironment(environment: FoundrySceneEnvironmentSource | undefined, darkness: number): SceneEnvironment {
  const light = environment?.globalLight;
  return {
    darkness,
    darknessLock: environment?.darknessLock ?? false,
    blendAmbience: environment?.cycle ?? true,
    globalLight: {
      enabled: light?.enabled ?? false,
      bright: light?.bright ?? false,
      color: light?.color ?? null,
      alpha: light?.alpha ?? DEFAULT_GLOBAL_LIGHT_ALPHA,
      luminosity: light?.luminosity ?? 0,
      saturation: light?.saturation ?? 0,
      contrast: light?.contrast ?? 0,
      shadows: light?.shadows ?? 0,
      darkness: { min: light?.darkness?.min ?? 0, max: light?.darkness?.max ?? 1 }
    },
    baseAmbience: toAmbience(environment?.base, DEFAULT_BASE_AMBIENCE),
    darkAmbience: toAmbience(environment?.dark, DEFAULT_DARK_AMBIENCE)
  };
}

/** Foundry 11: only darkness, the global light switch and its threshold existed (as 12 migrates them). */
function toFlatEnvironment(source: FoundrySceneSource, darkness: number): SceneEnvironment {
  return toEnvironment(
    { globalLight: { enabled: source.globalLight ?? false, darkness: { max: source.globalLightThreshold ?? 1 } } },
    darkness
  );
}

function explorationOf(enabled: boolean | undefined): FogExplorationMode {
  return enabled === false ? 'disabled' : 'individual';
}

function toFog(source: FoundrySceneSource, generation: number, firstLevel: FoundryLevelSource | undefined): SceneFog {
  if (usesFlatEnvironmentKeys(generation)) {
    return {
      exploration: explorationOf(source.fogExploration),
      overlaySrc: source.fogOverlay ?? null,
      exploredColor: source.fogExploredColor ?? null,
      unexploredColor: source.fogUnexploredColor ?? null
    };
  }
  const v14 = generation >= 14;
  return {
    exploration: v14 ? fogModeFromCode(source.fog?.mode) : explorationOf(source.fog?.exploration),
    overlaySrc: (v14 ? firstLevel?.fog?.src : source.fog?.overlay) ?? null,
    exploredColor: source.fog?.colors?.explored ?? null,
    unexploredColor: source.fog?.colors?.unexplored ?? null
  };
}

function nonEmpty(value: string | null | undefined): string | null {
  return value === undefined || value === null || value === '' ? null : value;
}

/**
 * The settings a scene stores. Foundry 14 keeps the foreground, its
 * elevation, the fog overlay and the background color on the scene's first
 * level — the level the core's own compatibility getters read them from.
 */
export function toSceneSettings(document: FoundrySceneSettingsFields): SceneSettings {
  const generation = foundryGeneration();
  const source = document._source ?? {};
  const v14 = generation >= 14;
  const level = v14 ? document.firstLevel : undefined;
  const firstLevel: FoundryLevelSource | undefined =
    level === undefined ? undefined : { foreground: level.foreground, ...level._source };
  const darkness =
    source.environment?.darknessLevel ??
    document.environment?.darknessLevel ??
    source.darkness ??
    document.darkness ??
    0;

  const settings: SceneSettings = {
    weather: nonEmpty(source.weather),
    tokenVision: source.tokenVision ?? true,
    environment: usesFlatEnvironmentKeys(generation)
      ? toFlatEnvironment(source, darkness)
      : toEnvironment(source.environment, darkness),
    fog: toFog(source, generation, firstLevel),
    initialView: {
      x: source.initial?.x ?? null,
      y: source.initial?.y ?? null,
      scale: source.initial?.scale ?? null
    },
    links: {
      playlistId: nonEmpty(source.playlist),
      playlistSoundId: nonEmpty(source.playlistSound),
      journalId: nonEmpty(source.journal),
      journalPageId: nonEmpty(source.journalEntryPage)
    },
    grid: {
      style: source.grid?.style ?? DEFAULT_GRID_STYLE,
      color: source.grid?.color ?? DEFAULT_GRID_COLOR,
      alpha: source.grid?.alpha ?? DEFAULT_GRID_ALPHA,
      thickness: source.grid?.thickness ?? DEFAULT_GRID_THICKNESS
    },
    foregroundSrc: nonEmpty(v14 ? firstLevel?.foreground?.src : source.foreground),
    foregroundElevation: v14
      ? (firstLevel?.elevation?.top ?? null)
      : (document.foregroundElevation ?? source.foregroundElevation ?? null),
    backgroundColor: (v14 ? firstLevel?.background?.color : source.backgroundColor) ?? DEFAULT_BACKGROUND_COLOR
  };
  return v14 ? { ...settings, initialLevelId: document.initialLevel?.id ?? null } : settings;
}
