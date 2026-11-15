import type { SoundFeatures } from '@/core/ambient-sounds/domain';

// BaseAmbientSound and Sound#playAtPosition verified against Foundry 13.351
// and 14.368: elevation and effects exist in both, name / locked / levels only
// in 14. 12 is not installed: its audio rewrite brought the effects (13 still
// carries `Sound#play` shims "since 12"), and 13 deprecates listener points
// without elevation "since 13", so an elevated positional sound needs 13.
// Generation 0 means "not known yet" and reads as the newest.
export function soundFeaturesFor(generation: number): SoundFeatures {
  const since = (first: number): boolean => generation === 0 || generation >= first;
  return {
    elevation: since(12),
    effects: since(12),
    positionalElevation: since(13),
    levels: since(14)
  };
}
