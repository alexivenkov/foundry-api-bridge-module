export const TILE_TEXTURE_FITS = ['fill', 'contain', 'cover', 'width', 'height'] as const;
export type TileTextureFit = (typeof TILE_TEXTURE_FITS)[number];

/** `surface` and several modes at once exist on Foundry 14+ only. */
export const TILE_OCCLUSION_MODES = ['fade', 'radial', 'vision', 'surface'] as const;
export type TileOcclusionMode = (typeof TILE_OCCLUSION_MODES)[number];

export interface TileTexture {
  readonly src: string | null;
  readonly tint: string;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly fit: TileTextureFit;
  readonly alphaThreshold: number;
  /** Foundry 12–13 only. */
  readonly offsetX?: number;
  readonly offsetY?: number;
  readonly rotation?: number;
}

export interface TileRestrictions {
  readonly light: boolean;
  readonly weather: boolean;
}

export interface TileOcclusion {
  readonly modes: readonly TileOcclusionMode[];
  readonly alpha: number;
}

export interface TileVideo {
  readonly loop: boolean;
  readonly autoplay: boolean;
  readonly volume: number;
}

/** An image or video placed on the scene; overhead tiles (roofs) are the ones at or above the foreground elevation. */
export interface Tile {
  readonly id: string;
  /** Foundry 14+ only. */
  readonly name?: string | null;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly elevation: number;
  readonly sort: number;
  readonly rotation: number;
  readonly alpha: number;
  readonly hidden: boolean;
  readonly locked: boolean;
  readonly texture: TileTexture;
  readonly restrictions: TileRestrictions;
  readonly occlusion: TileOcclusion;
  readonly video: TileVideo;
  /** Foundry 14+ only. */
  readonly levels?: readonly string[];
}

export interface TileTextureChanges {
  readonly src?: string | null | undefined;
  readonly tint?: string | undefined;
  readonly scaleX?: number | undefined;
  readonly scaleY?: number | undefined;
  readonly anchorX?: number | undefined;
  readonly anchorY?: number | undefined;
  readonly fit?: TileTextureFit | undefined;
  readonly alphaThreshold?: number | undefined;
  readonly offsetX?: number | undefined;
  readonly offsetY?: number | undefined;
  readonly rotation?: number | undefined;
}

/**
 * What a caller may set. An omitted attribute is left to the core default (create) or kept (update);
 * nested groups are partial, `null` removes the image or the name, `occlusion.modes` and `levels` replace.
 */
export interface TileChanges {
  readonly x?: number | undefined;
  readonly y?: number | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly elevation?: number | undefined;
  readonly sort?: number | undefined;
  readonly rotation?: number | undefined;
  readonly alpha?: number | undefined;
  readonly hidden?: boolean | undefined;
  readonly locked?: boolean | undefined;
  readonly texture?: TileTextureChanges | undefined;
  readonly restrictions?: { readonly light?: boolean | undefined; readonly weather?: boolean | undefined } | undefined;
  readonly occlusion?:
    | { readonly modes?: readonly TileOcclusionMode[] | undefined; readonly alpha?: number | undefined }
    | undefined;
  readonly video?:
    | {
        readonly loop?: boolean | undefined;
        readonly autoplay?: boolean | undefined;
        readonly volume?: number | undefined;
      }
    | undefined;
  readonly name?: string | null | undefined;
  readonly levels?: readonly string[] | undefined;
}

export interface TileDraft extends TileChanges {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
