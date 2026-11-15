import { SubscriptionRegistry, type EventClock, type EventRatePolicy, type EventScheduler } from './domain';
import { EventPublisher, EventSubscriptionService } from './application';
import {
  ChannelClientSink,
  FoundryHookSource,
  systemClock,
  timerScheduler,
  type EventChannelClient,
  type EventGlobalsProvider
} from './infrastructure';

export interface EventWiring {
  readonly globals?: EventGlobalsProvider;
  readonly scheduler?: EventScheduler;
  readonly clock?: EventClock;
  readonly policy?: EventRatePolicy;
}

export interface EventHub {
  readonly subscriptions: EventSubscriptionService;
  readonly channels: ChannelClientSink;
}

// Composition root of the context. Unlike the other contexts it holds state
// (subscriptions, queues), so the handlers and the connection wiring share one hub.
export function createFoundryEventHub(wiring: EventWiring = {}): EventHub {
  const registry = new SubscriptionRegistry();
  const channels = new ChannelClientSink();
  const publisher = new EventPublisher({
    subscriptions: registry,
    sink: channels,
    scheduler: wiring.scheduler ?? timerScheduler,
    clock: wiring.clock ?? systemClock,
    policy: wiring.policy
  });
  const subscriptions = new EventSubscriptionService({
    subscriptions: registry,
    publisher,
    source: new FoundryHookSource(wiring.globals)
  });
  return { subscriptions, channels };
}

let sharedHub: EventHub | null = null;

/** The module's single hub. Reads no Foundry global until something subscribes. */
export function defaultEventHub(): EventHub {
  sharedHub ??= createFoundryEventHub();
  return sharedHub;
}

/** Makes a connection available for events under its label (`MCP`, `API`). */
export function attachEventChannel(channel: string, client: EventChannelClient): void {
  defaultEventHub().channels.attach(channel, client);
}

/** The connection closed: its subscriptions end. Never throws into the connection code. */
export function dropEventChannel(channel: string): void {
  try {
    defaultEventHub().subscriptions.dropChannel(channel);
  } catch (error) {
    console.warn(`Foundry API Bridge | [${channel}] Could not drop the event subscriptions:`, error);
  }
}
