import type { LightFeatures } from '@/core/lights/domain';

// BaseAmbientLight / LightData verified against Foundry 13.351 and 14.368:
// elevation, negative and priority exist in both, name / locked / levels and
// the coloration techniques 100 / 101 only in 14. 12 is not installed: 13
// still migrates negative luminosity to `negative` "since v12", so darkness
// sources (with their priority) and elevation are taken as 12 additions.
// Generation 0 means "not known yet" and reads as the newest.
export function lightFeaturesFor(generation: number): LightFeatures {
  const since = (first: number): boolean => generation === 0 || generation >= first;
  return {
    elevation: since(12),
    darknessSources: since(12),
    attenuationColorations: since(14),
    levels: since(14)
  };
}
