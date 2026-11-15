import type { CommandContext, EventSubscriptionResult, UnsubscribeEventsParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import { defaultEventHub, toUnsubscribeEventsCommand, unsubscribeEventsRequestSchema } from '@/core/events';
import type { EventHandlerDependencies } from './SubscribeEventsHandler';
import { toWireEventSubscription } from './eventWireMappers';

export function createUnsubscribeEventsHandler(
  deps: EventHandlerDependencies = {}
): (params: UnsubscribeEventsParams, context?: CommandContext) => Promise<EventSubscriptionResult> {
  const service = (deps.hub ?? defaultEventHub()).subscriptions;

  return function unsubscribeEventsHandler(
    params: UnsubscribeEventsParams,
    context?: CommandContext
  ): Promise<EventSubscriptionResult> {
    try {
      const command = toUnsubscribeEventsCommand(parseRequest(unsubscribeEventsRequestSchema, params), context?.channel);
      return Promise.resolve(toWireEventSubscription(service.unsubscribe(command)));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const unsubscribeEventsHandler = createUnsubscribeEventsHandler();
