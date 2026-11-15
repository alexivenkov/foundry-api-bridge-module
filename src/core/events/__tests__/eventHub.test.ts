import { FakeTimeline } from '../application/__tests__/fakePorts';
import { FakeHooks, globalsWith } from '../infrastructure/__tests__/fakeHooks';
import type { EventChannelClient, EventChannelMessage } from '../infrastructure';
import { createFoundryEventHub, dropEventChannel } from '../composition';

class FakeClient implements EventChannelClient {
  connected = true;
  readonly messages: EventChannelMessage[] = [];

  isConnected(): boolean {
    return this.connected;
  }

  sendEvent(message: EventChannelMessage): boolean {
    this.messages.push(message);
    return true;
  }
}

function setup(): { hooks: FakeHooks; timeline: FakeTimeline; mcp: FakeClient; api: FakeClient; hub: ReturnType<typeof createFoundryEventHub> } {
  const hooks = new FakeHooks();
  const timeline = new FakeTimeline();
  const hub = createFoundryEventHub({ globals: globalsWith(hooks), scheduler: timeline, clock: timeline });
  const mcp = new FakeClient();
  const api = new FakeClient();
  hub.channels.attach('MCP', mcp);
  hub.channels.attach('API', api);
  return { hooks, timeline, mcp, api, hub };
}

const scene = { id: 's1', name: 'Keep', pack: null };
const token = (x: number): Record<string, unknown> => ({
  id: 't1',
  name: 'Goblin',
  actorId: null,
  x,
  y: 0,
  elevation: 0,
  pack: null,
  parent: scene
});

describe('event hub', () => {
  it('pushes nothing and registers no hook until a channel subscribes', () => {
    const { hooks, timeline, mcp } = setup();

    hooks.callAll('pauseGame', true, {});
    timeline.advance(1000);

    expect(hooks.registeredHooks()).toEqual([]);
    expect(mcp.messages).toEqual([]);
  });

  it('pushes a burst of moves of one token as one event, only on the subscribed channel', () => {
    const { hooks, timeline, mcp, api, hub } = setup();
    hub.subscriptions.subscribe({ channel: 'MCP', events: ['token-moved'] });

    hooks.callAll('updateToken', token(50), { _id: 't1', x: 50 }, {}, 'u1');
    timeline.advance(100);
    hooks.callAll('updateToken', token(100), { _id: 't1', x: 100 }, {}, 'u1');
    timeline.advance(400);

    expect(mcp.messages).toEqual([
      {
        type: 'event',
        event: 'token-moved',
        data: { tokenId: 't1', sceneId: 's1', name: 'Goblin', actorId: null, x: 100, y: 0, elevation: 0, userId: 'u1' },
        ts: 1_000_100,
        seq: 1
      }
    ]);
    expect(api.messages).toEqual([]);
  });

  it('ends the subscriptions of a dropped channel and removes the hooks nobody needs', () => {
    const { hooks, timeline, mcp, hub } = setup();
    hub.subscriptions.subscribe({ channel: 'MCP', events: ['game-paused'] });
    hub.subscriptions.subscribe({ channel: 'API', events: ['token-moved'] });
    expect(hooks.registeredHooks()).toEqual(['pauseGame', 'updateToken']);

    hub.subscriptions.dropChannel('MCP');
    hooks.callAll('pauseGame', true, {});
    timeline.advance(100);

    expect(hooks.registeredHooks()).toEqual(['updateToken']);
    expect(mcp.messages).toEqual([]);
    expect(hub.subscriptions.subscribe({ channel: 'MCP', events: ['game-paused'] }).lastSeq).toBe(0);
  });

  it('dropping a channel of the shared hub never throws', () => {
    expect(() => {
      dropEventChannel('MCP');
    }).not.toThrow();
  });
});
