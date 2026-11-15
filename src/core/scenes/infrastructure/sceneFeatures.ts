import { foundryGeneration } from '@/compat/foundryVersion';
import type { SceneFeatures } from '@/core/scenes/domain';

// BaseScene verified against Foundry 13.351 and 14.368: `environment`, `fog`
// and the grid's `style` / `thickness` exist in both; levels only in 14. That
// 12 introduced `environment`, `fog` and the grid style comes from the
// migrations 13 still carries ("deprecated since v12"); 11 stored the flat
// keys `darkness`, `globalLight`, `globalLightThreshold`, `fogExploration`,
// `fogOverlay`, `fogExploredColor` and `fogUnexploredColor` (12 and 11 are
// not installed). Generation 0 means "not known yet": it reads as 13, as the
// rest of the scene context has always read it.
export function sceneFeaturesFor(generation: number): SceneFeatures {
  const nested = generation === 0 || generation >= 12;
  return { environmentDetails: nested, gridStyle: nested, levels: generation >= 14 };
}

/** Foundry 11 keeps environment and fog settings in flat scene fields. */
export function usesFlatEnvironmentKeys(generation: number = foundryGeneration()): boolean {
  return generation > 0 && generation < 12;
}

/**
 * `Scene#pullUsers` is verified in Foundry 13 and 14. Older cores, where it is
 * not verified, are sent the `pullToScene` socket message it emits itself.
 */
export function hasPullUsers(generation: number = foundryGeneration()): boolean {
  return generation === 0 || generation >= 13;
}
