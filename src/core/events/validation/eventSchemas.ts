import { z } from 'zod';
import { ALL_EVENTS, EVENT_NAMES, type EventSelector } from '@/core/events/domain';

// New commands, validated strictly; unknown keys are ignored.

const SELECTORS: [EventSelector, ...EventSelector[]] = [ALL_EVENTS, ...EVENT_NAMES];
const VALID_EVENTS = `${EVENT_NAMES.join(', ')} or '${ALL_EVENTS}'`;

const eventSelectorSchema = z.enum(SELECTORS, {
  error: (issue) => `unknown event '${String(issue.input)}'; valid events: ${VALID_EVENTS}`
});

export const subscribeEventsRequestSchema = z.object({
  events: z.array(eventSelectorSchema).min(1)
});

/** Absent (or null) params or events: stop every event. */
export const unsubscribeEventsRequestSchema = z
  .object({
    events: z.array(eventSelectorSchema).min(1).nullish()
  })
  .nullish();

export type SubscribeEventsRequest = z.infer<typeof subscribeEventsRequestSchema>;
export type UnsubscribeEventsRequest = z.infer<typeof unsubscribeEventsRequestSchema>;
