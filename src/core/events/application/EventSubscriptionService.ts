import {
  EVENT_CATALOGUE,
  EventChannelRequiredError,
  type EventTypeDescriptor,
  type GameEventSource,
  type SubscriptionRegistry
} from '@/core/events/domain';
import type {
  EventSubscriptionQuery,
  EventSubscriptionState,
  SubscribeEventsCommand,
  UnsubscribeEventsCommand
} from './commands';
import type { EventPublisher } from './EventPublisher';

export interface EventSubscriptionServiceDependencies {
  readonly subscriptions: SubscriptionRegistry;
  readonly publisher: EventPublisher;
  readonly source: GameEventSource;
}

/**
 * Per-channel subscriptions. The event source watches exactly the union of
 * what the channels asked for, so with no subscriber no Foundry hook is touched.
 */
export class EventSubscriptionService {
  constructor(private readonly deps: EventSubscriptionServiceDependencies) {}

  listEventTypes(): readonly EventTypeDescriptor[] {
    return EVENT_CATALOGUE;
  }

  subscribe(command: SubscribeEventsCommand): EventSubscriptionState {
    const channel = requireChannel(command.channel);
    const { subscriptions } = this.deps;
    subscriptions.replace(channel, subscriptions.selectionOf(channel).with(command.events));
    this.refreshSource();
    return this.stateOf(channel);
  }

  unsubscribe(command: UnsubscribeEventsCommand): EventSubscriptionState {
    const channel = requireChannel(command.channel);
    const { subscriptions } = this.deps;
    subscriptions.replace(channel, subscriptions.selectionOf(channel).without(command.events));
    this.refreshSource();
    return this.stateOf(channel);
  }

  describe(query: EventSubscriptionQuery): EventSubscriptionState {
    return this.stateOf(requireChannel(query.channel));
  }

  /** The channel disconnected: a server that reconnects subscribes again. */
  dropChannel(channel: string): void {
    this.deps.subscriptions.drop(channel);
    this.deps.publisher.forgetChannel(channel);
    this.refreshSource();
  }

  private refreshSource(): void {
    const wanted = this.deps.subscriptions.wantedEvents();
    if (wanted.size === 0) {
      this.deps.publisher.discardPending();
    }
    const { publisher } = this.deps;
    this.deps.source.watch(wanted, (event) => {
      publisher.publish(event);
    });
  }

  private stateOf(channel: string): EventSubscriptionState {
    return {
      channel,
      events: this.deps.subscriptions.selectionOf(channel).toSelectors(),
      ...this.deps.publisher.outboxState(channel)
    };
  }
}

function requireChannel(channel: string | undefined): string {
  if (channel === undefined || channel === '') {
    throw new EventChannelRequiredError();
  }
  return channel;
}
