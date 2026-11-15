import {
  ALL_EVENTS,
  ChannelOutbox,
  EVENT_CATALOGUE,
  EVENT_NAMES,
  EventSelection,
  SubscriptionRegistry,
  coalescedKeysSupersededBy,
  coalescingOf,
  isGameEventName,
  textPreview,
  type PublishedEvent
} from '..';

const moved = (tokenId: string, x: number): PublishedEvent => ({
  name: 'token-moved',
  data: { tokenId, sceneId: 's1', name: 'Goblin', actorId: null, x, y: 0, elevation: 0, userId: null },
  ts: 1
});

describe('event catalogue', () => {
  it('names every event once, in kebab-case, with a one-line description', () => {
    expect(new Set(EVENT_NAMES).size).toBe(EVENT_NAMES.length);
    expect(EVENT_NAMES).toHaveLength(29);
    for (const { name, description } of EVENT_CATALOGUE) {
      expect(name).toMatch(/^[a-z]+(-[a-z]+)+$/);
      expect(description.length).toBeGreaterThan(10);
      expect(description).not.toContain('\n');
    }
  });

  it('recognises catalogue names only', () => {
    expect(isGameEventName('token-moved')).toBe(true);
    expect(isGameEventName('*')).toBe(false);
    expect(isGameEventName('toString')).toBe(false);
    expect(isGameEventName('token-teleported')).toBe(false);
  });
});

describe('EventSelection', () => {
  it('starts empty and matches nothing', () => {
    expect(EventSelection.NONE.isEmpty).toBe(true);
    expect(EventSelection.NONE.includes('token-moved')).toBe(false);
    expect(EventSelection.NONE.toSelectors()).toEqual([]);
  });

  it('adds names and lists them in catalogue order', () => {
    const selection = EventSelection.of(['token-moved']).with(['combat-started', 'token-moved']);

    expect(selection.includes('combat-started')).toBe(true);
    expect(selection.includes('token-created')).toBe(false);
    expect(selection.toSelectors()).toEqual(['combat-started', 'token-moved']);
  });

  it('matches every event under the wildcard and reports it as *', () => {
    const selection = EventSelection.of(['token-moved', ALL_EVENTS]);

    expect(selection.includes('targets-changed')).toBe(true);
    expect(selection.toSelectors()).toEqual(['*']);
    expect(selection.eventNames()).toEqual(EVENT_NAMES);
    expect(selection.with(['token-moved']).toSelectors()).toEqual(['*']);
  });

  it('removes names; removing from * keeps every other event', () => {
    const selection = EventSelection.of(['*']).without(['token-moved']);

    expect(selection.includes('token-moved')).toBe(false);
    expect(selection.includes('token-created')).toBe(true);
    expect(selection.toSelectors()).toHaveLength(EVENT_NAMES.length - 1);
  });

  it('removes everything when no names or * are given', () => {
    const selection = EventSelection.of(['token-moved', 'combat-started']);

    expect(selection.without(undefined).isEmpty).toBe(true);
    expect(selection.without(['*']).isEmpty).toBe(true);
    expect(selection.without(['token-moved']).toSelectors()).toEqual(['combat-started']);
  });
});

describe('SubscriptionRegistry', () => {
  it('finds the channels of an event and the union of all events', () => {
    const registry = new SubscriptionRegistry();
    registry.replace('MCP', EventSelection.of(['token-moved']));
    registry.replace('API', EventSelection.of(['*']));

    expect(registry.channelsFor('token-moved')).toEqual(['MCP', 'API']);
    expect(registry.channelsFor('combat-started')).toEqual(['API']);
    expect(registry.wantedEvents().size).toBe(EVENT_NAMES.length);
  });

  it('forgets a channel that is dropped or left with nothing', () => {
    const registry = new SubscriptionRegistry();
    registry.replace('MCP', EventSelection.of(['token-moved']));
    registry.replace('API', EventSelection.of(['combat-started']));

    registry.drop('MCP');
    registry.replace('API', EventSelection.NONE);

    expect(registry.wantedEvents().size).toBe(0);
    expect(registry.selectionOf('MCP').isEmpty).toBe(true);
  });
});

describe('ChannelOutbox', () => {
  it('numbers queued events from 1 and hands them out in order', () => {
    const outbox = new ChannelOutbox(10);
    outbox.enqueue(moved('a', 1));
    outbox.enqueue(moved('b', 2));

    expect(outbox.lastSeq).toBe(2);
    expect(outbox.take(1).map((event) => event.seq)).toEqual([1]);
    expect(outbox.size).toBe(1);
    expect(outbox.take(5).map((event) => event.seq)).toEqual([2]);
  });

  it('drops the oldest event when full and counts it, leaving a sequence gap', () => {
    const outbox = new ChannelOutbox(2);
    outbox.enqueue(moved('a', 1));
    outbox.enqueue(moved('b', 2));
    outbox.enqueue(moved('c', 3));

    expect(outbox.dropped).toBe(1);
    expect(outbox.take(10).map((event) => event.seq)).toEqual([2, 3]);
  });

  it('counts an event that could not be sent as dropped', () => {
    const outbox = new ChannelOutbox(2);
    outbox.recordLost();

    expect(outbox.dropped).toBe(1);
  });
});

describe('coalescing', () => {
  it('merges moves per token and target changes per user', () => {
    expect(coalescingOf(moved('a', 1))).toEqual({ key: 'token-moved:s1.a', windowMs: 400 });
    expect(
      coalescingOf({ name: 'targets-changed', data: { userId: 'u1', userName: 'Ann', sceneId: null, tokenIds: [] } })
    ).toEqual({ key: 'targets-changed:u1', windowMs: 150 });
    expect(coalescingOf({ name: 'game-paused', data: { paused: true } })).toBeNull();
  });

  it('lets a token deletion release the pending move of that token first', () => {
    const deleted = coalescedKeysSupersededBy({
      name: 'token-deleted',
      data: { tokenId: 'a', sceneId: 's1', name: 'Goblin', actorId: null, userId: null }
    });

    expect(deleted).toEqual(['token-moved:s1.a']);
    expect(coalescedKeysSupersededBy(moved('a', 1))).toEqual([]);
  });
});

describe('textPreview', () => {
  it('drops markup and scripts, decodes entities and collapses whitespace', () => {
    const html = '<div class="x"><p>Hit &amp; run</p>\n<script>alert(1)</script><p>&lt;b&gt; &amp;lt;</p></div>';

    expect(textPreview(html)).toBe('Hit & run <b> &lt;');
  });

  it('cuts long text with an ellipsis', () => {
    const preview = textPreview('word '.repeat(100), 20);

    expect(preview.length).toBeLessThanOrEqual(20);
    expect(preview.endsWith('…')).toBe(true);
  });

  it('keeps short text whole', () => {
    expect(textPreview('<b>15</b>', 300)).toBe('15');
  });
});
