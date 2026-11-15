import type {
  EventSubscriptionQuery,
  SubscribeEventsCommand,
  UnsubscribeEventsCommand
} from '@/core/events/application';
import type { SubscribeEventsRequest, UnsubscribeEventsRequest } from './eventSchemas';

export function toSubscribeEventsCommand(request: SubscribeEventsRequest, channel: string | undefined): SubscribeEventsCommand {
  return { channel, events: request.events };
}

export function toUnsubscribeEventsCommand(
  request: UnsubscribeEventsRequest,
  channel: string | undefined
): UnsubscribeEventsCommand {
  return { channel, events: request?.events ?? undefined };
}

export function toEventSubscriptionQuery(channel: string | undefined): EventSubscriptionQuery {
  return { channel };
}
