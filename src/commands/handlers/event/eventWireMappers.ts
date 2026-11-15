import type { EventSubscriptionResult, GetEventTypesResult } from '@/commands/types';
import type { EventSubscriptionState, EventTypeDescriptor } from '@/core/events';

export function toWireEventSubscription(state: EventSubscriptionState): EventSubscriptionResult {
  return {
    channel: state.channel,
    events: [...state.events],
    queued: state.queued,
    dropped: state.dropped,
    lastSeq: state.lastSeq
  };
}

export function toWireEventTypes(descriptors: readonly EventTypeDescriptor[]): GetEventTypesResult {
  return { eventTypes: descriptors.map(({ name, description }) => ({ name, description })) };
}
