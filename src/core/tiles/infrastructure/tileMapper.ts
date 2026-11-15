import {
  TILE_TEXTURE_FITS,
  type Tile,
  type TileChanges,
  type TileTexture,
  type TileTextureChanges,
  type TileTextureFit
} from '@/core/tiles/domain';
import type { FoundryTileSource, FoundryTileTextureSource } from './foundryTileTypes';
import {
  occlusionModeCode,
  occlusionModeFlags,
  occlusionModesFromCode,
  occlusionModesFromFlags
} from './tileCodes';

const GENERATION_WITHOUT_TEXTURE_OFFSET = 14;
const GENERATION_WITH_OCCLUSION_SET = 14;
const GENERATION_WITH_NAMES_AND_LEVELS = 14;

function readFit(fit: string | undefined): TileTextureFit {
  return TILE_TEXTURE_FITS.find((candidate) => candidate === fit) ?? 'fill';
}

function toTexture(source: FoundryTileTextureSource | undefined, generation: number): TileTexture {
  const texture: TileTexture = {
    src: source?.src ? source.src : null,
    tint: source?.tint ?? '#ffffff',
    scaleX: source?.scaleX ?? 1,
    scaleY: source?.scaleY ?? 1,
    anchorX: source?.anchorX ?? 0.5,
    anchorY: source?.anchorY ?? 0.5,
    fit: readFit(source?.fit),
    alphaThreshold: source?.alphaThreshold ?? 0.75
  };
  if (generation >= GENERATION_WITHOUT_TEXTURE_OFFSET) {
    return texture;
  }
  return {
    ...texture,
    offsetX: source?.offsetX ?? 0,
    offsetY: source?.offsetY ?? 0,
    rotation: source?.rotation ?? 0
  };
}

export function toTile(source: FoundryTileSource, generation: number): Tile {
  const tile: Tile = {
    id: source._id,
    x: source.x ?? 0,
    y: source.y ?? 0,
    width: source.width ?? 0,
    height: source.height ?? 0,
    elevation: source.elevation ?? 0,
    sort: source.sort ?? 0,
    rotation: source.rotation ?? 0,
    alpha: source.alpha ?? 1,
    hidden: source.hidden ?? false,
    locked: source.locked ?? false,
    texture: toTexture(source.texture, generation),
    restrictions: {
      light: source.restrictions?.light ?? false,
      weather: source.restrictions?.weather ?? false
    },
    occlusion: {
      modes:
        generation >= GENERATION_WITH_OCCLUSION_SET
          ? occlusionModesFromFlags(source.occlusion?.modes)
          : occlusionModesFromCode(source.occlusion?.mode),
      alpha: source.occlusion?.alpha ?? 0
    },
    video: {
      loop: source.video?.loop ?? true,
      autoplay: source.video?.autoplay ?? true,
      volume: source.video?.volume ?? 0
    }
  };
  if (generation < GENERATION_WITH_NAMES_AND_LEVELS) {
    return tile;
  }
  return { ...tile, name: source.name ? source.name : null, levels: [...(source.levels ?? [])] };
}

function definedEntries(values: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      data[key] = value;
    }
  }
  return data;
}

function assignGroup(data: Record<string, unknown>, key: string, group: Record<string, unknown>): void {
  if (Object.keys(group).length > 0) {
    data[key] = group;
  }
}

function toTextureData(texture: TileTextureChanges): Record<string, unknown> {
  return definedEntries({ ...texture });
}

/**
 * Only the attributes that are set become document fields, so an update stays
 * partial: the core merges nested groups and replaces `occlusion.modes` and
 * `levels`. Occlusion is written as the generation stores it.
 */
export function toFoundryTileData(changes: TileChanges, generation: number): Record<string, unknown> {
  const data = definedEntries({
    x: changes.x,
    y: changes.y,
    width: changes.width,
    height: changes.height,
    elevation: changes.elevation,
    sort: changes.sort,
    rotation: changes.rotation,
    alpha: changes.alpha,
    hidden: changes.hidden,
    locked: changes.locked,
    name: changes.name,
    levels: changes.levels !== undefined ? [...changes.levels] : undefined
  });

  if (changes.texture !== undefined) {
    assignGroup(data, 'texture', toTextureData(changes.texture));
  }
  if (changes.restrictions !== undefined) {
    assignGroup(data, 'restrictions', definedEntries({ ...changes.restrictions }));
  }
  if (changes.video !== undefined) {
    assignGroup(data, 'video', definedEntries({ ...changes.video }));
  }
  if (changes.occlusion !== undefined) {
    const { modes, alpha } = changes.occlusion;
    const occlusion = definedEntries({ alpha });
    if (modes !== undefined) {
      if (generation >= GENERATION_WITH_OCCLUSION_SET) {
        occlusion['modes'] = occlusionModeFlags(modes);
      } else {
        occlusion['mode'] = occlusionModeCode(modes);
      }
    }
    assignGroup(data, 'occlusion', occlusion);
  }

  return data;
}
