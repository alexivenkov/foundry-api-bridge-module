import type { GetEventTypesParams, GetEventTypesResult } from '@/commands/types';
import { defaultEventHub } from '@/core/events';
import type { EventHandlerDependencies } from './SubscribeEventsHandler';
import { toWireEventTypes } from './eventWireMappers';

export function createGetEventTypesHandler(
  deps: EventHandlerDependencies = {}
): (params: GetEventTypesParams) => Promise<GetEventTypesResult> {
  const service = (deps.hub ?? defaultEventHub()).subscriptions;

  // The command takes no parameters, so there is nothing to validate.
  return function getEventTypesHandler(_params: GetEventTypesParams): Promise<GetEventTypesResult> {
    return Promise.resolve(toWireEventTypes(service.listEventTypes()));
  };
}

export const getEventTypesHandler = createGetEventTypesHandler();
