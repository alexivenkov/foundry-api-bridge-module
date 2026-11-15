import type { EffectIconVisibility } from '@/core/effects/domain';

/**
 * `CONST.ACTIVE_EFFECT_MODES` of Foundry 13 (CUSTOM 0 … OVERRIDE 5), named
 * the way Foundry 14 names the same change types (`BaseActiveEffect`
 * migrates mode n to these names, and to `custom.n` for any other number).
 */
export const LEGACY_CHANGE_MODES: Readonly<Record<string, number>> = {
  custom: 0,
  multiply: 1,
  add: 2,
  downgrade: 3,
  upgrade: 4,
  override: 5
};

export function changeTypeForMode(mode: number): string {
  const entry = Object.entries(LEGACY_CHANGE_MODES).find(([, code]) => code === mode);
  return entry ? entry[0] : `custom.${String(mode)}`;
}

/** `CONST.ACTIVE_EFFECT_SHOW_ICON` of Foundry 14. */
const SHOW_ICON_CODES: Readonly<Record<EffectIconVisibility, number>> = {
  never: 0,
  conditional: 1,
  always: 2
};

export function toShowIconCode(visibility: EffectIconVisibility): number {
  return SHOW_ICON_CODES[visibility];
}

export function fromShowIconCode(code: number): EffectIconVisibility | undefined {
  const entry = (Object.entries(SHOW_ICON_CODES) as [EffectIconVisibility, number][]).find(([, value]) => value === code);
  return entry?.[0];
}
