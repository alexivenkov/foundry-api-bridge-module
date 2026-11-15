import type { CommandContext, EventSubscriptionResult, GetEventSubscriptionsParams } from '@/commands/types';
import { defaultEventHub, toEventSubscriptionQuery } from '@/core/events';
import type { EventHandlerDependencies } from './SubscribeEventsHandler';
import { toWireEventSubscription } from './eventWireMappers';

export function createGetEventSubscriptionsHandler(
  deps: EventHandlerDependencies = {}
): (params: GetEventSubscriptionsParams, context?: CommandContext) => Promise<EventSubscriptionResult> {
  const service = (deps.hub ?? defaultEventHub()).subscriptions;

  // The command takes no parameters, so there is nothing to validate.
  return function getEventSubscriptionsHandler(
    _params: GetEventSubscriptionsParams,
    context?: CommandContext
  ): Promise<EventSubscriptionResult> {
    try {
      return Promise.resolve(toWireEventSubscription(service.describe(toEventSubscriptionQuery(context?.channel))));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const getEventSubscriptionsHandler = createGetEventSubscriptionsHandler();
