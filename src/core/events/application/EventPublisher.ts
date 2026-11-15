import {
  ChannelOutbox,
  DEFAULT_EVENT_RATE_POLICY,
  coalescedKeysSupersededBy,
  coalescingOf,
  type EventClock,
  type EventRatePolicy,
  type EventScheduler,
  type EventSink,
  type EventTimer,
  type GameEventOccurrence,
  type PublishedEvent,
  type QueuedEvent,
  type SubscriptionRegistry
} from '@/core/events/domain';

export interface EventPublisherDependencies {
  readonly subscriptions: SubscriptionRegistry;
  readonly sink: EventSink;
  readonly scheduler: EventScheduler;
  readonly clock: EventClock;
  readonly policy?: EventRatePolicy | undefined;
}

export interface OutboxState {
  readonly queued: number;
  readonly dropped: number;
  readonly lastSeq: number;
}

interface PendingEvent {
  event: PublishedEvent;
  readonly timer: EventTimer;
}

/**
 * Fans events out to the channels subscribed to them. Sending is always
 * deferred to a timer, so a Foundry hook never waits on the network, and it
 * is rate-guarded per channel. Nothing here throws into the caller.
 */
export class EventPublisher {
  private readonly outboxes = new Map<string, ChannelOutbox>();
  private readonly pending = new Map<string, PendingEvent>();
  private readonly policy: EventRatePolicy;
  private flushTimer: EventTimer | null = null;
  private lastFlushAt = Number.NEGATIVE_INFINITY;

  constructor(private readonly deps: EventPublisherDependencies) {
    this.policy = deps.policy ?? DEFAULT_EVENT_RATE_POLICY;
  }

  publish(event: GameEventOccurrence): void {
    try {
      const published: PublishedEvent = { ...event, ts: this.deps.clock.now() };
      for (const key of coalescedKeysSupersededBy(event)) {
        this.releasePending(key);
      }
      const coalescing = coalescingOf(event);
      if (coalescing === null) {
        this.dispatch(published);
        return;
      }
      const waiting = this.pending.get(coalescing.key);
      if (waiting !== undefined) {
        waiting.event = published;
        return;
      }
      const timer = this.deps.scheduler.schedule(() => {
        this.releasePending(coalescing.key);
      }, coalescing.windowMs);
      this.pending.set(coalescing.key, { event: published, timer });
    } catch {
      // Publishing runs inside Foundry hooks and must never break them.
    }
  }

  outboxState(channel: string): OutboxState {
    const outbox = this.outboxes.get(channel);
    return { queued: outbox?.size ?? 0, dropped: outbox?.dropped ?? 0, lastSeq: outbox?.lastSeq ?? 0 };
  }

  /** The channel went away: its queue, counters and sequence start over. */
  forgetChannel(channel: string): void {
    this.outboxes.delete(channel);
  }

  /** Nobody listens any more: merged events still waiting are discarded. */
  discardPending(): void {
    for (const waiting of this.pending.values()) {
      waiting.timer.cancel();
    }
    this.pending.clear();
  }

  private releasePending(key: string): void {
    const waiting = this.pending.get(key);
    if (waiting === undefined) {
      return;
    }
    this.pending.delete(key);
    waiting.timer.cancel();
    this.dispatch(waiting.event);
  }

  private dispatch(event: PublishedEvent): void {
    const channels = this.deps.subscriptions.channelsFor(event.name);
    for (const channel of channels) {
      this.outboxFor(channel).enqueue(event);
    }
    if (channels.length > 0) {
      this.scheduleFlush();
    }
  }

  private outboxFor(channel: string): ChannelOutbox {
    let outbox = this.outboxes.get(channel);
    if (outbox === undefined) {
      outbox = new ChannelOutbox(this.policy.queueCapacity);
      this.outboxes.set(channel, outbox);
    }
    return outbox;
  }

  private scheduleFlush(): void {
    if (this.flushTimer !== null) {
      return;
    }
    const delay = Math.max(0, this.lastFlushAt + this.policy.flushIntervalMs - this.deps.clock.now());
    this.flushTimer = this.deps.scheduler.schedule(() => {
      this.flushTimer = null;
      this.flush();
    }, delay);
  }

  private flush(): void {
    this.lastFlushAt = this.deps.clock.now();
    let backlog = false;
    for (const [channel, outbox] of this.outboxes) {
      // A closed channel keeps its queue: its disconnect clears it right after.
      if (outbox.size === 0 || !this.isOpen(channel)) {
        continue;
      }
      for (const event of outbox.take(this.policy.maxEventsPerFlush)) {
        if (!this.send(channel, event)) {
          outbox.recordLost();
        }
      }
      backlog ||= outbox.size > 0;
    }
    if (backlog) {
      this.scheduleFlush();
    }
  }

  private isOpen(channel: string): boolean {
    try {
      return this.deps.sink.isOpen(channel);
    } catch {
      return false;
    }
  }

  private send(channel: string, event: QueuedEvent): boolean {
    try {
      return this.deps.sink.send(channel, event);
    } catch {
      return false;
    }
  }
}
