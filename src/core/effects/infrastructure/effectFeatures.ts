import type { EffectFeatures } from '@/core/effects/domain';

// BaseActiveEffect verified against Foundry 13.351 and 14.368: `type` / `system`
// exist in both; `duration.{value,units,expiry,expired}`, `system.changes` with
// `type` / `phase`, and `showIcon` only in 14. 12 is not installed: effect
// subtypes are taken as a 12 addition. Generation 0 means "not known yet" and
// reads as the newest.
export function effectFeaturesFor(generation: number): EffectFeatures {
  const since = (first: number): boolean => generation === 0 || generation >= first;
  return {
    subtypes: since(12),
    durationUnits: since(14),
    changePhases: since(14),
    iconVisibility: since(14)
  };
}
