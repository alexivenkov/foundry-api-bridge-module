/**
 * The stored (`_source`) appearance fields of a Token document and of an
 * actor's prototype token (`BaseToken` / `PrototypeToken`), verified against
 * Foundry 13.351 and 14.368 through the real data models. Colors are
 * `#rrggbb` strings or null there. Version-dependent fields are optional:
 * `texture.offsetX` / `offsetY` / `rotation` exist up to 13; `shape`,
 * `turnMarker` and `movementAction` from 13; `ring` from 12; `depth` from 14;
 * `detectionModes` is an array up to 13 and a record keyed by mode id in 14.
 */
export interface FoundryTokenTextureSource {
  src: string | null;
  anchorX: number;
  anchorY: number;
  offsetX?: number;
  offsetY?: number;
  fit: string;
  scaleX: number;
  scaleY: number;
  rotation?: number;
  tint: string | null;
  alphaThreshold: number;
}

export interface FoundryTokenLightSource {
  negative?: boolean;
  priority?: number;
  alpha: number;
  angle: number;
  bright: number;
  color: string | null;
  coloration: number | null;
  dim: number;
  attenuation: number;
  luminosity: number;
  saturation: number;
  contrast: number;
  shadows: number;
  animation: { type: string | null; speed: number; intensity: number; reverse: boolean };
  darkness: { min: number; max: number };
}

export interface FoundryTokenSightSource {
  enabled: boolean;
  range: number | null;
  angle: number;
  visionMode: string;
  color: string | null;
  attenuation: number;
  brightness: number;
  saturation: number;
  contrast: number;
}

export interface FoundryDetectionModeEntry {
  id?: string;
  enabled?: boolean;
  range?: number | null;
}

export type FoundryDetectionModesSource = FoundryDetectionModeEntry[] | Record<string, FoundryDetectionModeEntry>;

export interface FoundryTokenRingSource {
  enabled: boolean;
  colors: { ring: string | null; background: string | null };
  effects: number;
  subject: { scale: number; texture: string | null };
}

export interface FoundryTokenTurnMarkerSource {
  mode: number;
  animation: string | null;
  src: string | null;
  disposition: boolean;
}

/** The fields a placed token shares with a prototype token. */
export interface FoundryTokenAppearanceSource {
  name: string;
  displayName: number;
  actorLink: boolean;
  width: number;
  height: number;
  depth?: number;
  texture: FoundryTokenTextureSource;
  lockRotation: boolean;
  rotation: number;
  alpha: number;
  disposition: number;
  displayBars: number;
  bar1: { attribute: string | null };
  bar2: { attribute: string | null };
  light: FoundryTokenLightSource;
  sight: FoundryTokenSightSource;
  detectionModes: FoundryDetectionModesSource;
  occludable: { radius: number };
  ring?: FoundryTokenRingSource;
  turnMarker?: FoundryTokenTurnMarkerSource;
  movementAction?: string | null;
}

export interface FoundryTokenSource extends FoundryTokenAppearanceSource {
  shape?: number;
  locked: boolean;
  sort: number;
}

export interface FoundryPrototypeTokenSource extends FoundryTokenAppearanceSource {
  randomImg: boolean;
  appendNumber: boolean;
  prependAdjective: boolean;
}

/** How appearance changes are written for the running generation. */
export interface AppearanceWriteOptions {
  /** Foundry 14 stores detection modes as a record keyed by mode id. */
  readonly detectionModesAsRecord: boolean;
  /**
   * Wraps a record so an update replaces it instead of merging into it
   * (`foundry.data.operators.ForcedReplacement` on 14); identity elsewhere.
   */
  readonly replace: (value: Record<string, unknown>) => unknown;
}
