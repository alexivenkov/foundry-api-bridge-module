import type { TileOcclusionMode } from '@/core/tiles/domain';

// CONST.OCCLUSION_MODES, verified against the installed cores. Foundry 13.351
// stores one `occlusion.mode` (NONE 0, FADE 1, RADIAL 3, VISION 4; ROOF 2 is
// gone since 12). Foundry 14.368 stores a set `occlusion.modes` of bit flags
// (FADE 1, SURFACE 2, RADIAL 4, VISION 8) in which NONE is not a valid member.

export const NO_OCCLUSION_CODE = 0;

const SINGLE_MODE_CODE: Readonly<Record<Exclude<TileOcclusionMode, 'surface'>, number>> = {
  fade: 1,
  radial: 3,
  vision: 4
};
const SINGLE_MODE_BY_CODE: Readonly<Record<number, TileOcclusionMode>> = { 1: 'fade', 3: 'radial', 4: 'vision' };

const MODE_FLAG: Readonly<Record<TileOcclusionMode, number>> = { fade: 1, surface: 2, radial: 4, vision: 8 };
const MODE_BY_FLAG: Readonly<Record<number, TileOcclusionMode>> = { 1: 'fade', 2: 'surface', 4: 'radial', 8: 'vision' };

/** Foundry 12–13. The service has refused `surface` and several modes before this runs. */
export function occlusionModeCode(modes: readonly TileOcclusionMode[]): number {
  const mode = modes[0];
  return mode === undefined || mode === 'surface' ? NO_OCCLUSION_CODE : SINGLE_MODE_CODE[mode];
}

export function occlusionModesFromCode(code: number | undefined): TileOcclusionMode[] {
  const mode = code !== undefined ? SINGLE_MODE_BY_CODE[code] : undefined;
  return mode !== undefined ? [mode] : [];
}

/** Foundry 14+. */
export function occlusionModeFlags(modes: readonly TileOcclusionMode[]): number[] {
  return modes.map((mode) => MODE_FLAG[mode]);
}

export function occlusionModesFromFlags(flags: readonly number[] | undefined): TileOcclusionMode[] {
  const modes: TileOcclusionMode[] = [];
  for (const flag of flags ?? []) {
    const mode = MODE_BY_FLAG[flag];
    if (mode !== undefined && !modes.includes(mode)) {
      modes.push(mode);
    }
  }
  return modes;
}
