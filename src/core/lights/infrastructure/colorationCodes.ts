import type { LightColoration } from '@/core/lights/domain';

// `AdaptiveLightingShader.SHADER_TECHNIQUES[*].id`, verified against Foundry
// 13.351 (0–10) and 14.368 (0–10, 100, 101). The ids are static constants of
// the shader class, not part of CONFIG.
const COLORATION_CODE: Readonly<Record<LightColoration, number>> = {
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

const COLORATION_BY_CODE: ReadonlyMap<number, LightColoration> = new Map(
  Object.entries(COLORATION_CODE).map(([coloration, code]) => [code, coloration as LightColoration])
);

export function colorationToCode(coloration: LightColoration): number {
  return COLORATION_CODE[coloration];
}

/** null for a stored null or for a code a module put there. */
export function colorationFromCode(code: number | null | undefined): LightColoration | null {
  return code === null || code === undefined ? null : (COLORATION_BY_CODE.get(code) ?? null);
}
