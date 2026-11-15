import type { TokenDisposition, TokenNameDisplay } from '@/core/tokens/domain/model/Token';

export const TOKEN_SHAPES = ['ellipse-1', 'ellipse-2', 'trapezoid-1', 'trapezoid-2', 'rectangle-1', 'rectangle-2'] as const;
export type TokenShape = (typeof TOKEN_SHAPES)[number];

export const TOKEN_TEXTURE_FITS = ['fill', 'contain', 'cover', 'width', 'height'] as const;
export type TokenTextureFit = (typeof TOKEN_TEXTURE_FITS)[number];

export const TOKEN_RING_EFFECTS = ['pulse', 'gradient', 'background-wave', 'invisibility', 'color-over-subject'] as const;
export type TokenRingEffect = (typeof TOKEN_RING_EFFECTS)[number];

export const TOKEN_TURN_MARKER_MODES = ['disabled', 'default', 'custom'] as const;
export type TokenTurnMarkerMode = (typeof TOKEN_TURN_MARKER_MODES)[number];

/** The light vocabulary of the `lights` context: shader techniques named after `SHADER_TECHNIQUES` keys. */
export const TOKEN_LIGHT_COLORATIONS = [
  'legacy',
  'luminance',
  'internal-halo',
  'external-halo',
  'color-burn',
  'internal-burn',
  'external-burn',
  'low-absorption',
  'high-absorption',
  'invert-absorption',
  'natural-light',
  'natural-attenuation',
  'adaptive-attenuation'
] as const;
export type TokenLightColoration = (typeof TOKEN_LIGHT_COLORATIONS)[number];

const ATTENUATION_COLORATIONS: readonly TokenLightColoration[] = ['natural-attenuation', 'adaptive-attenuation'];

/** The techniques Foundry 14 added. */
export function isAttenuationColoration(coloration: TokenLightColoration): boolean {
  return ATTENUATION_COLORATIONS.includes(coloration);
}

/** Bars and nameplates share the core's display modes. */
export type TokenDisplayMode = TokenNameDisplay;

export interface TokenTexture {
  readonly src: string;
  readonly tint: string;
  readonly fit: TokenTextureFit;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly alphaThreshold: number;
  /** Foundry 13 and older, like `offsetY` and `rotation`. */
  readonly offsetX: number | undefined;
  readonly offsetY: number | undefined;
  readonly rotation: number | undefined;
}

export interface TokenLightAnimation {
  readonly type: string | null;
  readonly speed: number;
  readonly intensity: number;
  readonly reverse: boolean;
}

export interface TokenLightDarknessRange {
  readonly min: number;
  readonly max: number;
}

export interface TokenLight {
  readonly dim: number;
  readonly bright: number;
  readonly angle: number;
  readonly color: string | null;
  readonly alpha: number;
  readonly coloration: TokenLightColoration | null;
  readonly luminosity: number;
  readonly attenuation: number;
  readonly saturation: number;
  readonly contrast: number;
  readonly shadows: number;
  readonly animation: TokenLightAnimation;
  readonly darkness: TokenLightDarknessRange;
  /** Foundry 12+, like `priority`. */
  readonly negative: boolean | undefined;
  readonly priority: number | undefined;
}

export interface TokenSight {
  readonly enabled: boolean;
  /** null = unlimited. */
  readonly range: number | null;
  readonly angle: number;
  readonly visionMode: string;
  readonly color: string | null;
  readonly attenuation: number;
  readonly brightness: number;
  readonly saturation: number;
  readonly contrast: number;
}

export interface TokenDetectionMode {
  readonly id: string;
  readonly enabled: boolean;
  /** null = unlimited. */
  readonly range: number | null;
}

export interface TokenRing {
  readonly enabled: boolean;
  readonly ringColor: string | null;
  readonly backgroundColor: string | null;
  readonly effects: readonly TokenRingEffect[];
  readonly subjectScale: number;
  readonly subjectTexture: string | null;
}

export interface TokenTurnMarker {
  readonly mode: TokenTurnMarkerMode;
  readonly animation: string | null;
  readonly src: string | null;
  readonly disposition: boolean;
}

/**
 * What a token looks like and perceives — the fields a placed token shares
 * with a prototype token. Fields a Foundry generation does not store are
 * `undefined`: `ring` before 12, `turnMarker` and `movementAction` before 13,
 * `depth` before 14.
 */
export interface TokenAppearance {
  readonly width: number;
  readonly height: number;
  readonly depth: number | undefined;
  readonly texture: TokenTexture;
  readonly alpha: number;
  readonly rotation: number;
  readonly lockRotation: boolean;
  readonly disposition: TokenDisposition;
  readonly nameDisplay: TokenDisplayMode;
  readonly barDisplay: TokenDisplayMode;
  readonly bar1: string | null;
  readonly bar2: string | null;
  readonly light: TokenLight;
  readonly sight: TokenSight;
  readonly detectionModes: readonly TokenDetectionMode[];
  readonly occludableRadius: number;
  readonly ring: TokenRing | undefined;
  readonly turnMarker: TokenTurnMarker | undefined;
  readonly movementAction: string | null | undefined;
}

/** A placed token's appearance; `shape` is `undefined` before 13. */
export interface TokenAppearanceDetail extends TokenAppearance {
  readonly shape: TokenShape | undefined;
  readonly locked: boolean;
  readonly sort: number;
}

export interface TokenTextureChanges {
  readonly src?: string | undefined;
  readonly tint?: string | undefined;
  readonly fit?: TokenTextureFit | undefined;
  readonly anchorX?: number | undefined;
  readonly anchorY?: number | undefined;
  readonly scaleX?: number | undefined;
  readonly scaleY?: number | undefined;
  readonly alphaThreshold?: number | undefined;
  readonly offsetX?: number | undefined;
  readonly offsetY?: number | undefined;
  readonly rotation?: number | undefined;
}

export interface TokenLightAnimationChanges {
  readonly type?: string | null | undefined;
  readonly speed?: number | undefined;
  readonly intensity?: number | undefined;
  readonly reverse?: boolean | undefined;
}

export interface TokenLightDarknessRangeChanges {
  readonly min?: number | undefined;
  readonly max?: number | undefined;
}

export interface TokenLightChanges {
  readonly dim?: number | undefined;
  readonly bright?: number | undefined;
  readonly angle?: number | undefined;
  readonly color?: string | null | undefined;
  readonly alpha?: number | undefined;
  readonly coloration?: TokenLightColoration | undefined;
  readonly luminosity?: number | undefined;
  readonly attenuation?: number | undefined;
  readonly saturation?: number | undefined;
  readonly contrast?: number | undefined;
  readonly shadows?: number | undefined;
  readonly animation?: TokenLightAnimationChanges | undefined;
  readonly darkness?: TokenLightDarknessRangeChanges | undefined;
  readonly negative?: boolean | undefined;
  readonly priority?: number | undefined;
}

export interface TokenSightChanges {
  readonly enabled?: boolean | undefined;
  readonly range?: number | null | undefined;
  readonly angle?: number | undefined;
  readonly visionMode?: string | undefined;
  readonly color?: string | null | undefined;
  readonly attenuation?: number | undefined;
  readonly brightness?: number | undefined;
  readonly saturation?: number | undefined;
  readonly contrast?: number | undefined;
}

/** A sight request: the changes, and whether the vision mode's own defaults come with it. */
export interface TokenSightRequest extends TokenSightChanges {
  readonly applyModeDefaults?: boolean | undefined;
}

export interface TokenRingChanges {
  readonly enabled?: boolean | undefined;
  readonly ringColor?: string | null | undefined;
  readonly backgroundColor?: string | null | undefined;
  readonly effects?: readonly TokenRingEffect[] | undefined;
  readonly subjectScale?: number | undefined;
  readonly subjectTexture?: string | null | undefined;
}

export interface TokenTurnMarkerChanges {
  readonly mode?: TokenTurnMarkerMode | undefined;
  readonly animation?: string | null | undefined;
  readonly src?: string | null | undefined;
  readonly disposition?: boolean | undefined;
}

/**
 * Appearance fields a caller may set on a token or a prototype; an omitted one
 * is left alone. `detectionModes` replaces the whole list; `null` clears a
 * bar, a color, an image or the movement action.
 */
export interface TokenAppearanceChanges {
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly depth?: number | undefined;
  readonly texture?: TokenTextureChanges | undefined;
  readonly alpha?: number | undefined;
  readonly barDisplay?: TokenDisplayMode | undefined;
  readonly bar1?: string | null | undefined;
  readonly bar2?: string | null | undefined;
  readonly light?: TokenLightChanges | undefined;
  readonly sight?: TokenSightChanges | undefined;
  readonly detectionModes?: readonly TokenDetectionMode[] | undefined;
  readonly occludableRadius?: number | undefined;
  readonly ring?: TokenRingChanges | undefined;
  readonly turnMarker?: TokenTurnMarkerChanges | undefined;
  readonly movementAction?: string | null | undefined;
}

/** The same, with a sight request that may ask for the vision mode's defaults. */
export interface TokenAppearanceRequest extends Omit<TokenAppearanceChanges, 'sight'> {
  readonly sight?: TokenSightRequest | undefined;
}
