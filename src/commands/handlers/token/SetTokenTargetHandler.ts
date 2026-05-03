import type { SetTokenTargetParams, SetTokenTargetResult } from '@/commands/types';

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

interface CanvasTokensLayer {
  get(id: string): FoundryTokenPlaceable | undefined;
  placeables: readonly FoundryTokenPlaceable[];
}

interface CanvasGlobals {
  game: { user: FoundryUser };
  canvas: { tokens: CanvasTokensLayer | null } | null;
}

function getGlobals(): CanvasGlobals {
  return globalThis as unknown as CanvasGlobals;
}

export function setTokenTargetHandler(
  params: SetTokenTargetParams
): Promise<SetTokenTargetResult> {
  try {
    const globals = getGlobals();
    const canvas = globals.canvas;
    if (!canvas || !canvas.tokens) {
      throw new Error('Canvas tokens layer not available');
    }

    const placeable = canvas.tokens.get(params.tokenId);
    if (!placeable) {
      throw new Error(`Token not found on canvas: ${params.tokenId}`);
    }

    placeable.setTarget(params.targeted, {
      user: globals.game.user,
      releaseOthers: params.releaseOthers ?? true
    });

    return Promise.resolve({
      tokenId: params.tokenId,
      targeted: params.targeted
    });
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
