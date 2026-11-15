/**
 * The per-channel rate guard: at most `maxEventsPerFlush` events leave every
 * `flushIntervalMs`; the rest wait in a queue of `queueCapacity`, which drops
 * its oldest event when full.
 */
export interface EventRatePolicy {
  readonly queueCapacity: number;
  readonly maxEventsPerFlush: number;
  readonly flushIntervalMs: number;
}

/** 100 events a second per channel, two seconds of backlog. */
export const DEFAULT_EVENT_RATE_POLICY: EventRatePolicy = {
  queueCapacity: 200,
  maxEventsPerFlush: 10,
  flushIntervalMs: 100
};
