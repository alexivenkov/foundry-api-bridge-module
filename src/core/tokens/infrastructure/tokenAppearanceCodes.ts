import type {
  TokenDisplayMode,
  TokenDisposition,
  TokenLightColoration,
  TokenRingEffect,
  TokenShape,
  TokenTurnMarkerMode
} from '@/core/tokens/domain';

// Core constants verified against Foundry 13.351 and 14.368: TOKEN_DISPOSITIONS,
// TOKEN_DISPLAY_MODES, TOKEN_SHAPES, TOKEN_TURN_MARKER_MODES, the static
// `TokenRing.effects` bits (client) and `AdaptiveLightingShader.SHADER_TECHNIQUES`
// ids (13: 0–10, 14 adds 100 and 101).

function invert<K extends string>(codes: Readonly<Record<K, number>>): ReadonlyMap<number, K> {
  return new Map(Object.entries(codes).map(([key, code]) => [code as number, key as K]));
}

export const DISPOSITION_CODE: Readonly<Record<TokenDisposition, number>> = {
  secret: -2,
  hostile: -1,
  neutral: 0,
  friendly: 1
};

export const DISPLAY_MODE_CODE: Readonly<Record<TokenDisplayMode, number>> = {
  none: 0,
  control: 10,
  'owner-hover': 20,
  hover: 30,
  owner: 40,
  always: 50
};

export const SHAPE_CODE: Readonly<Record<TokenShape, number>> = {
  'ellipse-1': 0,
  'ellipse-2': 1,
  'trapezoid-1': 2,
  'trapezoid-2': 3,
  'rectangle-1': 4,
  'rectangle-2': 5
};

export const TURN_MARKER_MODE_CODE: Readonly<Record<TokenTurnMarkerMode, number>> = {
  disabled: 0,
  default: 1,
  custom: 2
};

/** The `ENABLED` bit the token sheet sets next to the chosen effects. */
export const RING_EFFECTS_ENABLED = 0x01;

export const RING_EFFECT_BIT: Readonly<Record<TokenRingEffect, number>> = {
  pulse: 0x02,
  gradient: 0x04,
  'background-wave': 0x08,
  invisibility: 0x10,
  'color-over-subject': 0x20
};

export const COLORATION_CODE: Readonly<Record<TokenLightColoration, number>> = {
  legacy: 0,
  luminance: 1,
  'internal-halo': 2,
  'external-halo': 3,
  'color-burn': 4,
  'internal-burn': 5,
  'external-burn': 6,
  'low-absorption': 7,
  'high-absorption': 8,
  'invert-absorption': 9,
  'natural-light': 10,
  'natural-attenuation': 100,
  'adaptive-attenuation': 101
};

const DISPOSITION_BY_CODE = invert(DISPOSITION_CODE);
const DISPLAY_MODE_BY_CODE = invert(DISPLAY_MODE_CODE);
const SHAPE_BY_CODE = invert(SHAPE_CODE);
const TURN_MARKER_MODE_BY_CODE = invert(TURN_MARKER_MODE_CODE);
const COLORATION_BY_CODE = invert(COLORATION_CODE);

export function dispositionFromCode(code: number | undefined): TokenDisposition {
  return (code !== undefined ? DISPOSITION_BY_CODE.get(code) : undefined) ?? 'neutral';
}

export function displayModeFromCode(code: number | undefined): TokenDisplayMode {
  return (code !== undefined ? DISPLAY_MODE_BY_CODE.get(code) : undefined) ?? 'none';
}

/** `undefined` for a core without shapes, or a code a module put there. */
export function shapeFromCode(code: number | undefined): TokenShape | undefined {
  return code !== undefined ? SHAPE_BY_CODE.get(code) : undefined;
}

export function turnMarkerModeFromCode(code: number | undefined): TokenTurnMarkerMode {
  return (code !== undefined ? TURN_MARKER_MODE_BY_CODE.get(code) : undefined) ?? 'default';
}

/** null for a stored null or for a code a module put there. */
export function colorationFromCode(code: number | null | undefined): TokenLightColoration | null {
  return code === null || code === undefined ? null : (COLORATION_BY_CODE.get(code) ?? null);
}

export function ringEffectsFromBits(bits: number): TokenRingEffect[] {
  return (Object.entries(RING_EFFECT_BIT) as Array<[TokenRingEffect, number]>)
    .filter(([, bit]) => (bits & bit) !== 0)
    .map(([effect]) => effect);
}

export function ringEffectsToBits(effects: readonly TokenRingEffect[]): number {
  return effects.reduce((bits, effect) => bits | RING_EFFECT_BIT[effect], RING_EFFECTS_ENABLED);
}
