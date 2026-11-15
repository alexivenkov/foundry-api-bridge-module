import type { TileChanges } from '@/core/tiles/domain/model/Tile';

/** What the running Foundry generation can store on a tile. */
export interface TileCapabilities {
  /** The commands are modelled on the Foundry 12+ tile (elevation, sort, restrictions). */
  readonly supported: boolean;
  readonly names: boolean;
  readonly levels: boolean;
  /** Texture offset and rotation: Foundry 12–13; Foundry 14 removed them. */
  readonly textureOffset: boolean;
  /** Several occlusion modes at once and the `surface` mode: Foundry 14+. */
  readonly occlusionModeSet: boolean;
}

/** The refusal for a change the generation cannot store, or null when it can. */
export function findUnsupportedTileFeature(
  capabilities: TileCapabilities,
  changes?: TileChanges
): string | null {
  if (!capabilities.supported) {
    return 'Tile commands require Foundry 12 or newer';
  }
  if (changes === undefined) {
    return null;
  }
  if (changes.name !== undefined && !capabilities.names) {
    return 'Tile names require Foundry 14 or newer';
  }
  if (changes.levels !== undefined && !capabilities.levels) {
    return 'Tile levels require Foundry 14 or newer';
  }
  const texture = changes.texture;
  const movesTexture =
    texture !== undefined &&
    (texture.offsetX !== undefined || texture.offsetY !== undefined || texture.rotation !== undefined);
  if (movesTexture && !capabilities.textureOffset) {
    return 'Tile texture offset and rotation are not available in Foundry 14 or newer';
  }
  const modes = changes.occlusion?.modes;
  if (modes !== undefined && !capabilities.occlusionModeSet) {
    if (modes.length > 1) {
      return 'Several occlusion modes at once require Foundry 14 or newer';
    }
    if (modes.includes('surface')) {
      return 'The surface occlusion mode requires Foundry 14 or newer';
    }
  }
  return null;
}
