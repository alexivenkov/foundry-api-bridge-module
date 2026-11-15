import type { SelectedToken, SpeechBubbleOptions } from '@/core/tokens/domain/model/CanvasInteraction';

/** The GM's canvas: what it shows, what the GM has selected and targeted. */
export interface CanvasTokenSelection {
  isAvailable(): boolean;
  viewedSceneId(): string | null;
  isOnCanvas(tokenId: string): boolean;
  /** Returns every token selected afterwards. */
  select(tokenIds: readonly string[], releaseOthers: boolean): readonly string[];
  selected(): readonly SelectedToken[];
  /** Replaces the whole target set; returns every token targeted afterwards. */
  setTargets(tokenIds: readonly string[]): readonly string[];
}

export type SpeechBubbleSupport = 'broadcast' | 'local-only' | 'unavailable';

export interface SpeechBubbles {
  support(): SpeechBubbleSupport;
  /** Shows the bubble to every client; resolves to whether this client showed it. */
  broadcast(sceneId: string, tokenId: string, html: string, options: SpeechBubbleOptions): Promise<boolean>;
}
