import { foundryGeneration } from '@/compat/foundryVersion';
import type { LightEnvironment, LightFeatures, LightKind } from '@/core/lights/domain';
import type { FoundryLightGlobals } from './foundryLightTypes';
import { lightFeaturesFor } from './lightFeatures';

export type LightGlobalsProvider = () => FoundryLightGlobals;

const fromGlobalThis: LightGlobalsProvider = () => globalThis as unknown as FoundryLightGlobals;

/**
 * Light sources look their animation up in `CONFIG.Canvas.lightAnimations`,
 * darkness sources in `CONFIG.Canvas.darknessAnimations` (`BaseLightSource`
 * / `PointDarknessSource.ANIMATIONS`, Foundry 13–14); modules add their own.
 */
export class FoundryLightEnvironment implements LightEnvironment {
  constructor(
    private readonly globals: LightGlobalsProvider = fromGlobalThis,
    private readonly generation: () => number = foundryGeneration
  ) {}

  features(): LightFeatures {
    return lightFeaturesFor(this.generation());
  }

  animationTypes(kind: LightKind): readonly string[] | null {
    const canvas = this.globals().CONFIG?.Canvas;
    const registry = kind === 'darkness' ? canvas?.darknessAnimations : canvas?.lightAnimations;
    return registry ? Object.keys(registry) : null;
  }
}
