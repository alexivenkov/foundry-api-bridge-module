import { foundryGeneration, isV14Plus } from '@/compat/foundryVersion';
import type {
  Scene,
  SceneAmbienceChanges,
  SceneChanges,
  SceneCloneOverrides,
  SceneGlobalLightChanges,
  SceneGridChanges,
  SceneImages,
  SceneInitialViewChanges,
  SceneListing
} from '@/core/scenes/domain';
import type { FoundrySceneDocument } from './foundrySceneTypes';
import { SQUARE_GRID_CODE, fogModeCode, gridTypeFromCode, gridTypeToCode } from './sceneCodes';
import { usesFlatEnvironmentKeys } from './sceneFeatures';

// What a grid setting reads as when the document leaves it unset.
export const DEFAULT_GRID_SIZE = 100;
export const DEFAULT_GRID_DISTANCE = 5;
export const DEFAULT_GRID_UNITS = 'ft';

export type FoundrySceneSummaryFields = Pick<
  FoundrySceneDocument,
  | 'id'
  | 'uuid'
  | 'name'
  | 'active'
  | 'width'
  | 'height'
  | 'background'
  | 'firstLevel'
  | 'navigation'
  | 'navName'
  | 'navOrder'
  | 'folder'
  | 'grid'
>;

export type FoundrySceneImageFields = Pick<FoundrySceneDocument, 'img' | 'thumb' | 'background' | 'firstLevel'>;

export type FoundrySceneListingFields = Pick<FoundrySceneDocument, 'id' | 'name' | 'active'> &
  FoundrySceneImageFields;

/**
 * Foundry 14 moved a scene's images to its levels. `Scene#background` survives
 * there as a getter, deprecated until 16, that reads the first level; that
 * level is read directly instead.
 */
export function readBackgroundSrc(document: Pick<FoundrySceneDocument, 'background' | 'firstLevel'>): string | null {
  if (isV14Plus()) {
    return document.firstLevel?.background?.src ?? null;
  }
  const background = document.background;
  if (background === null || background === undefined) {
    return null;
  }
  if (typeof background === 'string') {
    return background.length > 0 ? background : null;
  }
  return background.src ?? null;
}

// The oldest core whose Scene fields have been checked against its sources.
const OLDEST_VERIFIED_GENERATION = 13;

/**
 * The image that stands for a scene: its thumbnail, or its background while
 * it has none. Older cores keep answering with `img`, as they always have:
 * they are not installed here to check `thumb` and `background` against.
 */
export function readSceneImage(document: FoundrySceneImageFields): string {
  if (foundryGeneration() < OLDEST_VERIFIED_GENERATION) {
    return document.img ?? '';
  }
  if (document.thumb) {
    return document.thumb;
  }
  return readBackgroundSrc(document) ?? '';
}

export function toScene(document: FoundrySceneSummaryFields): Scene {
  return {
    id: document.id,
    uuid: document.uuid,
    name: document.name,
    active: document.active,
    width: document.width ?? 0,
    height: document.height ?? 0,
    backgroundSrc: readBackgroundSrc(document),
    navigation: document.navigation ?? false,
    navName: document.navName ?? null,
    navOrder: document.navOrder ?? 0,
    folderName: document.folder?.name ?? null,
    grid: {
      type: gridTypeFromCode(document.grid?.type ?? SQUARE_GRID_CODE),
      size: document.grid?.size ?? DEFAULT_GRID_SIZE,
      distance: document.grid?.distance ?? DEFAULT_GRID_DISTANCE,
      units: document.grid?.units ?? DEFAULT_GRID_UNITS
    }
  };
}

export function toSceneListing(document: FoundrySceneListingFields): SceneListing {
  return {
    id: document.id,
    name: document.name,
    active: document.active,
    image: readSceneImage(document)
  };
}

function setIfDefined(data: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined) {
    data[key] = value;
  }
}

function toFoundryGridData(grid: SceneGridChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (grid.type !== undefined) {
    data['type'] = gridTypeToCode(grid.type);
  }
  setIfDefined(data, 'size', grid.size);
  setIfDefined(data, 'distance', grid.distance);
  setIfDefined(data, 'units', grid.units);
  setIfDefined(data, 'style', grid.style);
  setIfDefined(data, 'color', grid.color);
  setIfDefined(data, 'alpha', grid.alpha);
  setIfDefined(data, 'thickness', grid.thickness);
  return data;
}

function definedOnly(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

/** Sets a nested object, merged into what an earlier attribute already put there; an empty one is left out. */
function mergeInto(data: Record<string, unknown>, key: string, partial: Record<string, unknown>): void {
  if (Object.keys(partial).length === 0) {
    return;
  }
  const existing = data[key];
  data[key] =
    typeof existing === 'object' && existing !== null ? { ...(existing as Record<string, unknown>), ...partial } : partial;
}

function toFoundryGlobalLight(light: SceneGlobalLightChanges): Record<string, unknown> {
  const darkness = definedOnly({ min: light.darkness?.min, max: light.darkness?.max });
  return definedOnly({
    enabled: light.enabled,
    bright: light.bright,
    color: light.color,
    alpha: light.alpha,
    luminosity: light.luminosity,
    saturation: light.saturation,
    contrast: light.contrast,
    shadows: light.shadows,
    darkness: Object.keys(darkness).length > 0 ? darkness : undefined
  });
}

function toFoundryAmbience(ambience: SceneAmbienceChanges | undefined): Record<string, unknown> | undefined {
  if (ambience === undefined) {
    return undefined;
  }
  const data = definedOnly({ ...ambience });
  return Object.keys(data).length > 0 ? data : undefined;
}

/**
 * The environment and fog settings beyond darkness and exploration, written
 * to their nested paths from Foundry 12, to the flat keys of Foundry 11
 * (where only the global light switch, its threshold, the fog overlay and
 * colors exist; the service refuses the rest there).
 */
function applyEnvironmentSettings(data: Record<string, unknown>, changes: SceneChanges): void {
  const light = changes.globalLight;
  if (usesFlatEnvironmentKeys()) {
    setIfDefined(data, 'globalLight', light?.enabled);
    setIfDefined(data, 'globalLightThreshold', light?.darkness?.max);
    setIfDefined(data, 'fogOverlay', changes.fogOverlaySrc);
    setIfDefined(data, 'fogExploredColor', changes.fogExploredColor);
    setIfDefined(data, 'fogUnexploredColor', changes.fogUnexploredColor);
    return;
  }

  const globalLight = light === undefined ? {} : toFoundryGlobalLight(light);
  mergeInto(
    data,
    'environment',
    definedOnly({
      darknessLock: changes.darknessLock,
      cycle: changes.blendAmbience,
      globalLight: Object.keys(globalLight).length > 0 ? globalLight : undefined,
      base: toFoundryAmbience(changes.baseAmbience),
      dark: toFoundryAmbience(changes.darkAmbience)
    })
  );

  const colors = definedOnly({ explored: changes.fogExploredColor, unexplored: changes.fogUnexploredColor });
  mergeInto(
    data,
    'fog',
    definedOnly({
      overlay: changes.fogOverlaySrc,
      colors: Object.keys(colors).length > 0 ? colors : undefined
    })
  );
}

function toFoundryInitialView(view: SceneInitialViewChanges | null): Record<string, unknown> {
  return view === null ? { x: null, y: null, scale: null } : definedOnly({ x: view.x, y: view.y, scale: view.scale });
}

/** Weather, vision, initial view, links and the like: same keys in every generation. */
function applySceneSettings(data: Record<string, unknown>, changes: SceneChanges): void {
  // The weather field is a required string: "no weather" is stored as "".
  setIfDefined(data, 'weather', changes.weather === null ? '' : changes.weather);
  setIfDefined(data, 'tokenVision', changes.tokenVision);
  applyEnvironmentSettings(data, changes);
  if (changes.initialView !== undefined) {
    mergeInto(data, 'initial', toFoundryInitialView(changes.initialView));
  }
  setIfDefined(data, 'playlist', changes.playlistId);
  setIfDefined(data, 'playlistSound', changes.playlistSoundId);
  setIfDefined(data, 'journal', changes.journalId);
  setIfDefined(data, 'journalEntryPage', changes.journalPageId);
  setIfDefined(data, 'foregroundElevation', changes.foregroundElevation);
  setIfDefined(data, 'backgroundColor', changes.backgroundColor);
  setIfDefined(data, 'initialLevel', changes.initialLevelId);
}

/**
 * Only the attributes that are set become document fields, so an update stays
 * a partial update.
 *
 * Fog exploration and darkness are written to the flat `fogExploration` and
 * `darkness` keys before Foundry 14; the core migrates those to `fog` and
 * `environment` itself. Foundry 14 dropped that migration, and turned fog
 * exploration from a flag into the numeric `fog.mode`.
 */
export function toFoundrySceneData(changes: SceneChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  setIfDefined(data, 'name', changes.name);
  setIfDefined(data, 'width', changes.width);
  setIfDefined(data, 'height', changes.height);

  if (changes.grid !== undefined) {
    const grid = toFoundryGridData(changes.grid);
    if (Object.keys(grid).length > 0) {
      data['grid'] = grid;
    }
  }

  if (changes.backgroundSrc !== undefined) {
    data['background'] = { src: changes.backgroundSrc };
  }
  setIfDefined(data, 'foreground', changes.foregroundSrc);
  setIfDefined(data, 'padding', changes.padding);
  setIfDefined(data, 'navigation', changes.navigation);
  setIfDefined(data, 'navName', changes.navName);
  setIfDefined(data, 'navOrder', changes.navOrder);

  if (changes.fogExploration !== undefined) {
    if (isV14Plus()) {
      data['fog'] = { mode: fogModeCode(changes.fogExploration) };
    } else {
      data['fogExploration'] = changes.fogExploration;
    }
  }

  if (changes.darkness !== undefined) {
    if (isV14Plus()) {
      data['environment'] = { darknessLevel: changes.darkness };
    } else {
      data['darkness'] = changes.darkness;
    }
  }

  setIfDefined(data, 'folder', changes.folderId);
  applySceneSettings(data, changes);

  return data;
}

/**
 * On Foundry 14 the images are fields of a level. They go to the first level,
 * the one the background is read from, through the scene's `levels`: that is
 * how the core's own scene sheet submits level fields. The legacy
 * `background` / `foreground` keys are pruned from an update there before
 * anything reads them.
 */
export function toFoundrySceneUpdateData(
  changes: SceneChanges,
  current: Pick<FoundrySceneDocument, 'firstLevel'>
): Record<string, unknown> {
  const level = isV14Plus() ? current.firstLevel : undefined;
  if (level === undefined) {
    return toFoundrySceneData(changes);
  }

  const { backgroundSrc, foregroundSrc, fogOverlaySrc, foregroundElevation, backgroundColor, ...rest } = changes;
  const data = toFoundrySceneData(rest);

  // BaseScene._LEVELS_PROPERTY_MAP of Foundry 14: background.src, foreground
  // → foreground.src, fog.overlay → fog.src, foregroundElevation →
  // elevation.top, backgroundColor → background.color.
  const levelFields: Record<string, unknown> = {};
  mergeInto(levelFields, 'background', definedOnly({ src: backgroundSrc, color: backgroundColor }));
  mergeInto(levelFields, 'foreground', definedOnly({ src: foregroundSrc }));
  mergeInto(levelFields, 'fog', definedOnly({ src: fogOverlaySrc }));
  mergeInto(levelFields, 'elevation', definedOnly({ top: foregroundElevation }));
  if (Object.keys(levelFields).length > 0) {
    data['levels'] = [{ _id: level.id, ...levelFields }];
  }

  return data;
}

/** An empty path and no path both mean "no image". */
function isSameImage(requested: string | null, stored: string | null | undefined): boolean {
  return (requested === '' ? null : requested) === (stored === '' || stored === undefined ? null : stored);
}

/**
 * The images a draft asked for that the scene created from it does not have.
 *
 * Foundry 14 keeps them on the first level, and prunes the legacy
 * `background` / `foreground` keys from the creation data before
 * `Scene#_preCreate` gets to move them there. A core that does move them
 * leaves nothing missing, and a scene without a level has nowhere to take
 * them. Earlier cores store the images on the scene itself.
 */
export function missingSceneImages(
  draft: SceneImages,
  created: Pick<FoundrySceneDocument, 'firstLevel'>
): SceneImages | null {
  const level = isV14Plus() ? created.firstLevel : undefined;
  if (level === undefined) {
    return null;
  }

  const missing: {
    backgroundSrc?: string | null;
    foregroundSrc?: string | null;
    fogOverlaySrc?: string | null;
    foregroundElevation?: number;
    backgroundColor?: string;
  } = {};
  if (draft.backgroundSrc !== undefined && !isSameImage(draft.backgroundSrc, level.background?.src)) {
    missing.backgroundSrc = draft.backgroundSrc;
  }
  if (draft.foregroundSrc !== undefined && !isSameImage(draft.foregroundSrc, level.foreground?.src)) {
    missing.foregroundSrc = draft.foregroundSrc;
  }
  const stored = level._source;
  if (draft.fogOverlaySrc !== undefined && !isSameImage(draft.fogOverlaySrc, stored?.fog?.src)) {
    missing.fogOverlaySrc = draft.fogOverlaySrc;
  }
  if (draft.foregroundElevation !== undefined && draft.foregroundElevation !== stored?.elevation?.top) {
    missing.foregroundElevation = draft.foregroundElevation;
  }
  if (draft.backgroundColor !== undefined && draft.backgroundColor !== stored?.background?.color) {
    missing.backgroundColor = draft.backgroundColor;
  }
  return Object.keys(missing).length > 0 ? missing : null;
}

export function toFoundryCloneData(overrides: SceneCloneOverrides): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  setIfDefined(data, 'name', overrides.name);
  setIfDefined(data, 'folder', overrides.folderId);
  return data;
}
