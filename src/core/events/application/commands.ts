import type { EventSelector } from '@/core/events/domain';

export interface SubscribeEventsCommand {
  /** The connection the command arrived on; absent when it came without one. */
  readonly channel: string | undefined;
  readonly events: readonly EventSelector[];
}

export interface UnsubscribeEventsCommand {
  readonly channel: string | undefined;
  /** Absent: every event. */
  readonly events: readonly EventSelector[] | undefined;
}

export interface EventSubscriptionQuery {
  readonly channel: string | undefined;
}

export interface EventSubscriptionState {
  readonly channel: string;
  readonly events: readonly EventSelector[];
  readonly queued: number;
  readonly dropped: number;
  readonly lastSeq: number;
}
