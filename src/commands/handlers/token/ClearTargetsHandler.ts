import type { ClearTargetsParams, ClearTargetsResult } from '@/commands/types';

interface FoundryUser {
  id: string;
  targets: Set<FoundryTokenPlaceable>;
}

interface SetTargetOptions {
  user: FoundryUser;
  releaseOthers: boolean;
}

interface FoundryTokenPlaceable {
  id: string;
  setTarget(targeted: boolean, options: SetTargetOptions): void;
}

interface ClearTargetsGlobals {
  game: { user: FoundryUser };
}

function getGlobals(): ClearTargetsGlobals {
  return globalThis as unknown as ClearTargetsGlobals;
}

export function clearTargetsHandler(_params: ClearTargetsParams): Promise<ClearTargetsResult> {
  try {
    const globals = getGlobals();
    const user = globals.game.user;
    const targets = [...user.targets];

    for (const t of targets) {
      t.setTarget(false, { user, releaseOthers: false });
    }

    return Promise.resolve({ cleared: true, count: targets.length });
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
