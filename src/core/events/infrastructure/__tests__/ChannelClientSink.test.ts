import type { QueuedEvent } from '../../domain';
import { ChannelClientSink, type EventChannelClient, type EventChannelMessage } from '../ChannelClientSink';
import { changedKeysOf, worldDocument } from '../eventMappers';

class FakeClient implements EventChannelClient {
  connected = true;
  readonly messages: EventChannelMessage[] = [];

  isConnected(): boolean {
    return this.connected;
  }

  sendEvent(message: EventChannelMessage): boolean {
    if (!this.connected) {
      return false;
    }
    this.messages.push(message);
    return true;
  }
}

const event: QueuedEvent = { name: 'game-paused', data: { paused: true }, ts: 1700000000000, seq: 4 };

describe('ChannelClientSink', () => {
  it('wraps the event in the wire envelope of its channel', () => {
    const sink = new ChannelClientSink();
    const mcp = new FakeClient();
    const api = new FakeClient();
    sink.attach('MCP', mcp);
    sink.attach('API', api);

    expect(sink.send('MCP', event)).toBe(true);

    expect(mcp.messages).toEqual([{ type: 'event', event: 'game-paused', data: { paused: true }, ts: 1700000000000, seq: 4 }]);
    expect(api.messages).toEqual([]);
  });

  it('reports a channel open only while its client is connected', () => {
    const sink = new ChannelClientSink();
    const client = new FakeClient();
    sink.attach('MCP', client);

    expect(sink.isOpen('MCP')).toBe(true);
    client.connected = false;
    expect(sink.isOpen('MCP')).toBe(false);
    expect(sink.send('MCP', event)).toBe(false);
    expect(sink.isOpen('API')).toBe(false);
    expect(sink.send('API', event)).toBe(false);
  });

  it('forgets a detached client', () => {
    const sink = new ChannelClientSink();
    sink.attach('MCP', new FakeClient());
    sink.detach('MCP');

    expect(sink.isOpen('MCP')).toBe(false);
  });
});

describe('event mapper helpers', () => {
  it('lists changed top-level keys without the internal ones', () => {
    // The diff shape the v13 / v14 data models return from updateSource (Node probe):
    // dotted paths come back expanded, unchanged values are absent.
    expect(changedKeysOf({ name: 'Hero 2', system: { hp: 5 }, flags: { x: { y: 1 } }, _id: 'a', _stats: {} })).toEqual([
      'flags',
      'name',
      'system'
    ]);
    expect(changedKeysOf({ x: 1, rotation: 90 }, new Set(['x']))).toEqual(['rotation']);
    expect(changedKeysOf(null)).toEqual([]);
  });

  it('reads world documents only', () => {
    expect(worldDocument({ id: 'a', pack: null })).toEqual({ id: 'a', pack: null });
    expect(worldDocument({ id: 'a' })).toEqual({ id: 'a' });
    expect(worldDocument({ id: 'a', pack: 'dnd5e.monsters' })).toBeNull();
    expect(worldDocument('a')).toBeNull();
  });
});
