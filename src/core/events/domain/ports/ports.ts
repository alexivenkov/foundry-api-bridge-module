import type { GameEventOccurrence, QueuedEvent } from '@/core/events/domain/model/GameEvent';
import type { GameEventName } from '@/core/events/domain/model/eventPayloads';

/** The connections events leave through. */
export interface EventSink {
  isOpen(channel: string): boolean;
  /** False when the event could not be sent. */
  send(channel: string, event: QueuedEvent): boolean;
}

export type GameEventListener = (event: GameEventOccurrence) => void;

/** Where events come from (Foundry hooks). It produces only what it is told to watch. */
export interface GameEventSource {
  /** Replaces what is watched; an empty set stops every listener. */
  watch(events: ReadonlySet<GameEventName>, listener: GameEventListener): void;
}

export interface EventTimer {
  cancel(): void;
}

export interface EventScheduler {
  schedule(callback: () => void, delayMs: number): EventTimer;
}

export interface EventClock {
  /** Epoch milliseconds. */
  now(): number;
}
