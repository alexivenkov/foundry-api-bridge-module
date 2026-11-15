import type { CommandContext, EventSubscriptionResult, SubscribeEventsParams } from '@/commands/types';
import { parseRequest } from '@/core/shared';
import {
  defaultEventHub,
  subscribeEventsRequestSchema,
  toSubscribeEventsCommand,
  type EventHub
} from '@/core/events';
import { toWireEventSubscription } from './eventWireMappers';

export interface EventHandlerDependencies {
  /** The shared hub by default; tests pass their own. */
  hub?: EventHub;
}

export function createSubscribeEventsHandler(
  deps: EventHandlerDependencies = {}
): (params: SubscribeEventsParams, context?: CommandContext) => Promise<EventSubscriptionResult> {
  const service = (deps.hub ?? defaultEventHub()).subscriptions;

  return function subscribeEventsHandler(
    params: SubscribeEventsParams,
    context?: CommandContext
  ): Promise<EventSubscriptionResult> {
    try {
      const command = toSubscribeEventsCommand(parseRequest(subscribeEventsRequestSchema, params), context?.channel);
      return Promise.resolve(toWireEventSubscription(service.subscribe(command)));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

export const subscribeEventsHandler = createSubscribeEventsHandler();
