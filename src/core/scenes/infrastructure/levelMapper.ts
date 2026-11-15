import {
  LEVEL_FIT_MODES,
  type LevelChanges,
  type LevelFitMode,
  type SceneLevel,
  type SceneLevels
} from '@/core/scenes/domain';
import type { FoundryLevelDocument, FoundrySceneDocument } from './foundrySceneTypes';
import { DEFAULT_BACKGROUND_COLOR } from './sceneSettingsMapper';

// BaseLevel defaults of Foundry 14.368, for fields a document leaves unset.
const DEFAULT_TINT = '#ffffff';
const DEFAULT_ALPHA_THRESHOLD = 0.75;
const DEFAULT_ANCHOR = 0.5;
const DEFAULT_FIT: LevelFitMode = 'fill';
// Level#_initializeSource: a level created without a top reaches four grid cells up.
const DEFAULT_TOP_IN_CELLS = 4;
const DEFAULT_GRID_DISTANCE = 5;

function fitMode(value: string | undefined): LevelFitMode {
  return LEVEL_FIT_MODES.find((mode) => mode === value) ?? DEFAULT_FIT;
}

/** Read from `_source`: the client turns open elevations into ±Infinity and colors into Color objects. */
export function toSceneLevel(level: FoundryLevelDocument): SceneLevel {
  const source = level._source ?? {};
  const textures = source.textures;
  return {
    id: level.id,
    name: source.name ?? level.name ?? '',
    elevation: { bottom: source.elevation?.bottom ?? null, top: source.elevation?.top ?? null },
    background: {
      src: source.background?.src ?? null,
      color: source.background?.color ?? DEFAULT_BACKGROUND_COLOR,
      tint: source.background?.tint ?? DEFAULT_TINT,
      alphaThreshold: source.background?.alphaThreshold ?? DEFAULT_ALPHA_THRESHOLD
    },
    foreground: {
      src: source.foreground?.src ?? null,
      tint: source.foreground?.tint ?? DEFAULT_TINT,
      alphaThreshold: source.foreground?.alphaThreshold ?? DEFAULT_ALPHA_THRESHOLD
    },
    fogOverlaySrc: source.fog?.src ?? null,
    positioning: {
      anchorX: textures?.anchorX ?? DEFAULT_ANCHOR,
      anchorY: textures?.anchorY ?? DEFAULT_ANCHOR,
      offsetX: textures?.offsetX ?? 0,
      offsetY: textures?.offsetY ?? 0,
      fit: fitMode(textures?.fit),
      scaleX: textures?.scaleX ?? 1,
      scaleY: textures?.scaleY ?? 1,
      rotation: textures?.rotation ?? 0
    },
    visibleLevelIds: [...(source.visibility?.levels ?? [])],
    sort: source.sort ?? level.sort ?? 0
  };
}

export type FoundryLevelSceneFields = Pick<FoundrySceneDocument, 'id' | 'levels' | 'initialLevel' | 'firstLevel' | '_source'>;

function levelSort(level: FoundryLevelDocument): number {
  return level._source?.sort ?? level.sort ?? 0;
}

/** In the order the client stacks them (`Scene#levels.sorted`, by `sort`). */
export function toSceneLevels(scene: FoundryLevelSceneFields): SceneLevels {
  const collection = scene.levels;
  const ordered = collection?.sorted ?? [...(collection?.contents ?? [])].sort((a, b) => levelSort(a) - levelSort(b));
  return {
    sceneId: scene.id,
    levels: ordered.map(toSceneLevel),
    initialLevelId: scene.initialLevel?.id ?? null,
    firstLevelId: scene.firstLevel?.id ?? null,
    defaultTop: (scene._source?.grid?.distance ?? DEFAULT_GRID_DISTANCE) * DEFAULT_TOP_IN_CELLS
  };
}

function definedOnly(values: Record<string, unknown>): Record<string, unknown> | undefined {
  const defined = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
  return Object.keys(defined).length > 0 ? defined : undefined;
}

/** Only the attributes that are set become document fields, so an update stays partial. */
export function toFoundryLevelData(changes: LevelChanges): Record<string, unknown> {
  const fields = {
    name: changes.name,
    elevation: changes.elevation && definedOnly({ ...changes.elevation }),
    background: changes.background && definedOnly({ ...changes.background }),
    foreground: changes.foreground && definedOnly({ ...changes.foreground }),
    fog: changes.fogOverlaySrc === undefined ? undefined : { src: changes.fogOverlaySrc },
    textures: changes.positioning && definedOnly({ ...changes.positioning }),
    visibility: changes.visibleLevelIds === undefined ? undefined : { levels: [...changes.visibleLevelIds] },
    sort: changes.sort
  };
  return definedOnly(fields) ?? {};
}
