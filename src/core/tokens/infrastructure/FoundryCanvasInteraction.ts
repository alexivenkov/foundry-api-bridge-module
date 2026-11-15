import type {
  CanvasTokenSelection,
  SelectedToken,
  SpeechBubbleOptions,
  SpeechBubbleSupport,
  SpeechBubbles
} from '@/core/tokens/domain';

interface FoundryCanvasToken {
  id: string;
  document: { id: string; name: string; actorId?: string | null };
  control(options: { releaseOthers: boolean }): boolean;
}

/** `ChatBubbles` (Foundry 13–14, `canvas.hud.bubbles`). */
interface FoundryChatBubbles {
  broadcast?: (token: unknown, message: string, options: Record<string, unknown>) => Promise<unknown>;
  say?: (token: unknown, message: string, options: Record<string, unknown>) => Promise<unknown>;
}

export interface FoundryCanvasInteractionGlobals {
  canvas?: {
    ready?: boolean;
    scene?: { id: string } | null;
    tokens?: {
      get(id: string): FoundryCanvasToken | undefined;
      controlled: FoundryCanvasToken[];
      releaseAll(): number;
      active?: boolean;
      activate?: () => unknown;
      setTargets?: (targetIds: string[], options: { mode: 'replace' }) => void;
    } | null;
    hud?: { bubbles?: FoundryChatBubbles | null } | null;
  } | null;
  game?: {
    user?: { targets: Set<{ id: string }>; updateTokenTargets?: (targetIds: string[]) => void };
    scenes?: { get(id: string): { tokens: { get(id: string): unknown } } | undefined };
  };
}

export type CanvasInteractionGlobalsProvider = () => FoundryCanvasInteractionGlobals;

const fromGlobalThis: CanvasInteractionGlobalsProvider = () => globalThis as unknown as FoundryCanvasInteractionGlobals;

/**
 * Selection (`PlaceableObject#control`, `TokenLayer#controlled` /
 * `releaseAll`) and targets of the GM user. Foundry 14 controls a token only
 * while the token layer is the active one, so selecting activates it, as the
 * core does when an actor is dropped on the canvas. Foundry 13.351 and 14.368 set the
 * whole target set with `TokenLayer#setTargets(ids, {mode: "replace"})`;
 * older cores had `User#updateTokenTargets(ids)`, which is used where
 * `setTargets` is missing (not verified, 11 / 12 are not installed).
 */
export class FoundryCanvasTokenSelection implements CanvasTokenSelection {
  constructor(private readonly globals: CanvasInteractionGlobalsProvider = fromGlobalThis) {}

  isAvailable(): boolean {
    return Boolean(this.globals().canvas?.tokens);
  }

  viewedSceneId(): string | null {
    return this.globals().canvas?.scene?.id ?? null;
  }

  isOnCanvas(tokenId: string): boolean {
    return this.globals().canvas?.tokens?.get(tokenId) !== undefined;
  }

  select(tokenIds: readonly string[], releaseOthers: boolean): readonly string[] {
    const layer = this.globals().canvas?.tokens;
    if (!layer) {
      return [];
    }
    if (layer.active === false) {
      layer.activate?.();
    }
    if (releaseOthers) {
      layer.releaseAll();
    }
    for (const tokenId of tokenIds) {
      layer.get(tokenId)?.control({ releaseOthers: false });
    }
    return layer.controlled.map((token) => token.id);
  }

  selected(): readonly SelectedToken[] {
    return (this.globals().canvas?.tokens?.controlled ?? []).map((token) => ({
      id: token.document.id,
      name: token.document.name,
      actorId: token.document.actorId ?? null
    }));
  }

  setTargets(tokenIds: readonly string[]): readonly string[] {
    const globals = this.globals();
    const layer = globals.canvas?.tokens;
    if (layer?.setTargets) {
      layer.setTargets([...tokenIds], { mode: 'replace' });
    } else {
      globals.game?.user?.updateTokenTargets?.([...tokenIds]);
    }
    return [...(globals.game?.user?.targets ?? [])].map((token) => token.id);
  }
}

/**
 * `ChatBubbles#broadcast(token, message, options)` emits the bubble to every
 * other client over the socket and shows it here (Foundry 13.351 / 14.368);
 * clients show it only while viewing the token's scene and with the
 * `core.chatBubbles` setting on. A `ChatBubbles` without `broadcast` can only
 * speak locally.
 */
export class FoundrySpeechBubbles implements SpeechBubbles {
  constructor(private readonly globals: CanvasInteractionGlobalsProvider = fromGlobalThis) {}

  support(): SpeechBubbleSupport {
    const bubbles = this.globals().canvas?.hud?.bubbles;
    if (!bubbles) {
      return 'unavailable';
    }
    return typeof bubbles.broadcast === 'function' ? 'broadcast' : 'local-only';
  }

  async broadcast(sceneId: string, tokenId: string, html: string, options: SpeechBubbleOptions): Promise<boolean> {
    const globals = this.globals();
    const bubbles = globals.canvas?.hud?.bubbles;
    const token = globals.game?.scenes?.get(sceneId)?.tokens.get(tokenId);
    if (!bubbles?.broadcast || token === undefined) {
      return false;
    }
    const shown = await bubbles.broadcast(token, html, { pan: options.pan, requireVisible: options.requireVisible });
    return Boolean(shown);
  }
}
