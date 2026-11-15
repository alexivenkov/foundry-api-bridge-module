import type { GameEventName, GameEventPayloads } from './eventPayloads';

/** Something that happened in the game, as the event source reports it. */
export type GameEventOccurrence = {
  [N in GameEventName]: { readonly name: N; readonly data: GameEventPayloads[N] };
}[GameEventName];

/** An occurrence with the time it happened (epoch milliseconds). */
export type PublishedEvent = GameEventOccurrence & { readonly ts: number };

/** A published event queued for one channel, numbered within that channel. */
export type QueuedEvent = PublishedEvent & { readonly seq: number };
