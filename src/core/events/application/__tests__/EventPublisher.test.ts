import { EventSelection, SubscriptionRegistry, type GameEventOccurrence } from '../../domain';
import { EventPublisher } from '../EventPublisher';
import { FakeSink, FakeTimeline } from './fakePorts';

const policy = { queueCapacity: 5, maxEventsPerFlush: 2, flushIntervalMs: 100 };

const paused: GameEventOccurrence = { name: 'game-paused', data: { paused: true } };
const chat = (messageId: string): GameEventOccurrence => ({
  name: 'chat-message-created',
  data: {
    messageId,
    authorId: 'gm',
    speaker: { alias: '', actorId: null, tokenId: null, sceneId: null },
    whisper: [],
    blind: false,
    hasRolls: false,
    preview: 'hi'
  }
});
const moved = (tokenId: string, x: number): GameEventOccurrence => ({
  name: 'token-moved',
  data: { tokenId, sceneId: 's1', name: 'Goblin', actorId: null, x, y: 0, elevation: 0, userId: 'gm' }
});

function setup(subscribe: Record<string, readonly ('*' | GameEventOccurrence['name'])[]> = { MCP: ['*'] }): {
  publisher: EventPublisher;
  sink: FakeSink;
  timeline: FakeTimeline;
  registry: SubscriptionRegistry;
} {
  const registry = new SubscriptionRegistry();
  for (const [channel, events] of Object.entries(subscribe)) {
    registry.replace(channel, EventSelection.of(events));
  }
  const sink = new FakeSink();
  const timeline = new FakeTimeline();
  const publisher = new EventPublisher({ subscriptions: registry, sink, scheduler: timeline, clock: timeline, policy });
  return { publisher, sink, timeline, registry };
}

describe('EventPublisher', () => {
  it('sends on a timer, never inside the publishing call, stamped with time and sequence', () => {
    const { publisher, sink, timeline } = setup();

    publisher.publish(paused);
    expect(sink.sent).toHaveLength(0);

    timeline.advance(0);
    expect(sink.sentTo('MCP')).toEqual([{ name: 'game-paused', data: { paused: true }, ts: 1_000_000, seq: 1 }]);
  });

  it('sends only to the channels subscribed to the event, numbering each channel apart', () => {
    const { publisher, sink, timeline } = setup({ MCP: ['game-paused'], API: ['*'] });

    publisher.publish(chat('m1'));
    publisher.publish(paused);
    timeline.advance(0);

    expect(sink.sentTo('MCP').map((e) => [e.name, e.seq])).toEqual([['game-paused', 1]]);
    expect(sink.sentTo('API').map((e) => [e.name, e.seq])).toEqual([
      ['chat-message-created', 1],
      ['game-paused', 2]
    ]);
  });

  it('drops an event nobody subscribed to', () => {
    const { publisher, sink, timeline } = setup({ MCP: ['game-paused'] });

    publisher.publish(chat('m1'));
    timeline.advance(1000);

    expect(sink.sent).toHaveLength(0);
    expect(publisher.outboxState('MCP')).toEqual({ queued: 0, dropped: 0, lastSeq: 0 });
  });

  it('sends at most maxEventsPerFlush per interval and drops the oldest beyond the queue', () => {
    const { publisher, sink, timeline } = setup();

    for (let i = 1; i <= 7; i += 1) {
      publisher.publish(chat(`m${String(i)}`));
    }
    expect(publisher.outboxState('MCP')).toEqual({ queued: 5, dropped: 2, lastSeq: 7 });

    timeline.advance(0);
    expect(sink.sentTo('MCP').map((e) => e.seq)).toEqual([3, 4]);
    timeline.advance(99);
    expect(sink.sentTo('MCP')).toHaveLength(2);
    timeline.advance(1);
    expect(sink.sentTo('MCP').map((e) => e.seq)).toEqual([3, 4, 5, 6]);
    timeline.advance(100);
    expect(sink.sentTo('MCP').map((e) => e.seq)).toEqual([3, 4, 5, 6, 7]);
    expect(publisher.outboxState('MCP')).toEqual({ queued: 0, dropped: 2, lastSeq: 7 });
  });

  it('keeps the rate limit for a steady trickle of single events', () => {
    const { publisher, sink, timeline } = setup();

    publisher.publish(chat('m1'));
    timeline.advance(0);
    publisher.publish(chat('m2'));
    timeline.advance(10);

    expect(sink.sentTo('MCP')).toHaveLength(1);
    timeline.advance(90);
    expect(sink.sentTo('MCP')).toHaveLength(2);
  });

  it('holds events while the channel is closed', () => {
    const { publisher, sink, timeline } = setup();
    sink.open.delete('MCP');

    publisher.publish(paused);
    timeline.advance(1000);

    expect(sink.sent).toHaveLength(0);
    expect(publisher.outboxState('MCP').queued).toBe(1);
  });

  it('merges a burst of moves of one token into one event with the last position', () => {
    const { publisher, sink, timeline } = setup();

    publisher.publish(moved('a', 1));
    timeline.advance(100);
    publisher.publish(moved('a', 2));
    publisher.publish(moved('b', 9));
    timeline.advance(250);
    publisher.publish(moved('a', 3));
    expect(sink.sent).toHaveLength(0);

    timeline.advance(50);
    expect(sink.sentTo('MCP').map((e) => (e.name === 'token-moved' ? [e.data.tokenId, e.data.x, e.ts] : null))).toEqual([
      ['a', 3, 1_000_350]
    ]);
    timeline.advance(100);
    expect(sink.sentTo('MCP')).toHaveLength(2);
  });

  it('sends a pending move of a token before its deletion', () => {
    const { publisher, sink, timeline } = setup();

    publisher.publish(moved('a', 1));
    publisher.publish({
      name: 'token-deleted',
      data: { tokenId: 'a', sceneId: 's1', name: 'Goblin', actorId: null, userId: 'gm' }
    });
    timeline.advance(0);

    expect(sink.sentTo('MCP').map((e) => e.name)).toEqual(['token-moved', 'token-deleted']);
    timeline.advance(1000);
    expect(sink.sentTo('MCP')).toHaveLength(2);
  });

  it('discards pending merged events when nobody listens any more', () => {
    const { publisher, sink, timeline, registry } = setup();

    publisher.publish(moved('a', 1));
    registry.drop('MCP');
    publisher.discardPending();
    timeline.advance(1000);

    expect(sink.sent).toHaveLength(0);
    expect(timeline.pendingTimers).toBe(0);
  });

  it('never throws when the sink fails, and counts the event as dropped', () => {
    const { publisher, sink, timeline } = setup();
    sink.failing = true;

    expect(() => {
      publisher.publish(paused);
      timeline.advance(0);
    }).not.toThrow();
    expect(publisher.outboxState('MCP')).toEqual({ queued: 0, dropped: 1, lastSeq: 1 });
  });

  it('never throws when the clock fails', () => {
    const registry = new SubscriptionRegistry();
    registry.replace('MCP', EventSelection.of(['*']));
    const timeline = new FakeTimeline();
    const publisher = new EventPublisher({
      subscriptions: registry,
      sink: new FakeSink(),
      scheduler: timeline,
      clock: {
        now(): number {
          throw new Error('broken');
        }
      }
    });

    expect(() => {
      publisher.publish(paused);
    }).not.toThrow();
  });

  it('starts a forgotten channel over: empty queue, sequence from 1', () => {
    const { publisher, sink, timeline } = setup();

    publisher.publish(paused);
    publisher.forgetChannel('MCP');
    expect(publisher.outboxState('MCP')).toEqual({ queued: 0, dropped: 0, lastSeq: 0 });

    timeline.advance(0);
    publisher.publish(paused);
    timeline.advance(100);
    expect(sink.sentTo('MCP').map((e) => e.seq)).toEqual([1]);
  });
});
