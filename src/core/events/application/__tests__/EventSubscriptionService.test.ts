import { EVENT_CATALOGUE, EVENT_NAMES, SubscriptionRegistry } from '../../domain';
import { EventPublisher } from '../EventPublisher';
import { EventSubscriptionService } from '../EventSubscriptionService';
import { FakeSink, FakeSource, FakeTimeline } from './fakePorts';

function setup(): {
  service: EventSubscriptionService;
  source: FakeSource;
  sink: FakeSink;
  timeline: FakeTimeline;
} {
  const subscriptions = new SubscriptionRegistry();
  const sink = new FakeSink();
  const timeline = new FakeTimeline();
  const source = new FakeSource();
  const publisher = new EventPublisher({ subscriptions, sink, scheduler: timeline, clock: timeline });
  return { service: new EventSubscriptionService({ subscriptions, publisher, source }), source, sink, timeline };
}

describe('EventSubscriptionService', () => {
  it('lists the catalogue', () => {
    expect(setup().service.listEventTypes()).toBe(EVENT_CATALOGUE);
  });

  it('subscribes a channel additively and makes the source watch those events', () => {
    const { service, source } = setup();

    service.subscribe({ channel: 'MCP', events: ['token-moved'] });
    const state = service.subscribe({ channel: 'MCP', events: ['combat-started'] });

    expect(state).toEqual({
      channel: 'MCP',
      events: ['combat-started', 'token-moved'],
      queued: 0,
      dropped: 0,
      lastSeq: 0
    });
    expect([...source.watched]).toEqual(['combat-started', 'token-moved']);
  });

  it('watches the union of every channel', () => {
    const { service, source } = setup();

    service.subscribe({ channel: 'MCP', events: ['token-moved'] });
    service.subscribe({ channel: 'API', events: ['*'] });

    expect(source.watched.size).toBe(EVENT_NAMES.length);
    expect(service.describe({ channel: 'API' }).events).toEqual(['*']);
  });

  it('unsubscribes names, or everything when none are given, and stops the source when nobody is left', () => {
    const { service, source } = setup();
    service.subscribe({ channel: 'MCP', events: ['token-moved', 'game-paused'] });

    expect(service.unsubscribe({ channel: 'MCP', events: ['token-moved'] }).events).toEqual(['game-paused']);
    expect(service.unsubscribe({ channel: 'MCP', events: undefined }).events).toEqual([]);
    expect(source.watched.size).toBe(0);
  });

  it('delivers what the source reports to the subscribed channel', () => {
    const { service, source, sink, timeline } = setup();
    service.subscribe({ channel: 'API', events: ['game-paused'] });

    source.listener?.({ name: 'game-paused', data: { paused: true } });
    timeline.advance(0);

    expect(sink.sentTo('API')).toHaveLength(1);
    expect(service.describe({ channel: 'API' }).lastSeq).toBe(1);
  });

  it('drops a disconnected channel: subscription, queue and sequence', () => {
    const { service, source } = setup();
    service.subscribe({ channel: 'MCP', events: ['game-paused'] });
    service.subscribe({ channel: 'API', events: ['token-moved'] });
    source.listener?.({ name: 'game-paused', data: { paused: true } });

    service.dropChannel('MCP');

    expect(service.describe({ channel: 'MCP' })).toEqual({ channel: 'MCP', events: [], queued: 0, dropped: 0, lastSeq: 0 });
    expect([...source.watched]).toEqual(['token-moved']);
  });

  it('refuses a command that came without a channel', () => {
    const { service, source } = setup();
    const text = 'Event subscriptions need a server connection: send this command over the MCP or API channel';

    expect(() => service.subscribe({ channel: undefined, events: ['*'] })).toThrow(text);
    expect(() => service.unsubscribe({ channel: '', events: undefined })).toThrow(text);
    expect(() => service.describe({ channel: undefined })).toThrow(text);
    expect(source.calls).toBe(0);
  });
});
