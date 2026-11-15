import { TARGETS_COALESCING_MS, TOKEN_MOVE_COALESCING_MS } from '@/core/events/domain/model/eventCatalogue';
import type { GameEventOccurrence } from '@/core/events/domain/model/GameEvent';

export interface Coalescing {
  /** Events with the same key inside the window merge into one: the latest wins. */
  readonly key: string;
  readonly windowMs: number;
}

function tokenMoveKey(sceneId: string | null, tokenId: string): string {
  return `token-moved:${sceneId ?? ''}.${tokenId}`;
}

/** How an event is merged with the burst it belongs to; null when it is sent as it comes. */
export function coalescingOf(event: GameEventOccurrence): Coalescing | null {
  switch (event.name) {
    case 'token-moved':
      return { key: tokenMoveKey(event.data.sceneId, event.data.tokenId), windowMs: TOKEN_MOVE_COALESCING_MS };
    case 'targets-changed':
      return { key: `targets-changed:${event.data.userId}`, windowMs: TARGETS_COALESCING_MS };
    default:
      return null;
  }
}

/**
 * Keys of merged events that must go out before this event, so the receiver
 * never sees a token move after the token was deleted.
 */
export function coalescedKeysSupersededBy(event: GameEventOccurrence): string[] {
  return event.name === 'token-deleted' ? [tokenMoveKey(event.data.sceneId, event.data.tokenId)] : [];
}
