import { foundryGeneration } from '@/compat/foundryVersion';
import type { DoorSoundOption, WallEnvironment, WallFeatures } from '@/core/walls/domain';
import type { FoundryWallGlobals } from './foundryWallTypes';

export type WallGlobalsProvider = () => FoundryWallGlobals;

const fromGlobalThis: WallGlobalsProvider = () => globalThis as unknown as FoundryWallGlobals;

/**
 * `BaseWall#animation` exists in Foundry 13.351 and 14.368; 12 is not
 * installed and is treated as not having it. Generation 0 means "not known
 * yet" and reads as the newest.
 */
export function wallFeaturesFor(generation: number): WallFeatures {
  return { doorAnimation: generation === 0 || generation >= 13 };
}

/** `CONFIG.Wall.doorSounds` and `CONFIG.Wall.animationTypes` (Foundry 13–14); modules add their own entries. */
export class FoundryWallEnvironment implements WallEnvironment {
  constructor(
    private readonly globals: WallGlobalsProvider = fromGlobalThis,
    private readonly generation: () => number = foundryGeneration
  ) {}

  features(): WallFeatures {
    return wallFeaturesFor(this.generation());
  }

  doorSounds(): readonly DoorSoundOption[] | null {
    const globals = this.globals();
    const sounds = globals.CONFIG?.Wall?.doorSounds;
    if (!sounds) {
      return null;
    }
    const localize = (key: string): string => globals.game?.i18n?.localize(key) ?? key;
    return Object.entries(sounds).map(([id, sound]) => ({
      id,
      label: sound?.label !== undefined ? localize(sound.label) : id
    }));
  }

  doorAnimationTypes(): readonly string[] | null {
    const types = this.globals().CONFIG?.Wall?.animationTypes;
    return types ? Object.keys(types) : null;
  }
}
