import type { TokenTargeting } from '@/core/tokens/domain';

interface FoundryUser {
  id: string;
  targets: Set<FoundryTokenPlaceable>;
}

interface FoundryTokenPlaceable {
  id: string;
  setTarget(targeted: boolean, options: { user: FoundryUser; releaseOthers: boolean }): void;
}

export interface FoundryTargetingGlobals {
  game: { user: FoundryUser };
  canvas?: { tokens?: { get(id: string): FoundryTokenPlaceable | undefined } | null } | null | undefined;
}

export type TargetingGlobalsProvider = () => FoundryTargetingGlobals;

const fromGlobalThis: TargetingGlobalsProvider = () => globalThis as unknown as FoundryTargetingGlobals;

/** Targets are per user and client-local: this acts for the GM the module runs as. */
export class FoundryTokenTargeting implements TokenTargeting {
  constructor(private readonly globals: TargetingGlobalsProvider = fromGlobalThis) {}

  isAvailable(): boolean {
    return Boolean(this.globals().canvas?.tokens);
  }

  setTarget(tokenId: string, targeted: boolean, releaseOthers: boolean): boolean {
    const globals = this.globals();
    const placeable = globals.canvas?.tokens?.get(tokenId);
    if (placeable === undefined) {
      return false;
    }
    placeable.setTarget(targeted, { user: globals.game.user, releaseOthers });
    return true;
  }

  clearTargets(): number {
    const user = this.globals().game.user;
    const targets = [...user.targets];
    for (const target of targets) {
      target.setTarget(false, { user, releaseOthers: false });
    }
    return targets.length;
  }
}
