import { WebSocketClient, type WebSocketLike } from '../WebSocketClient';
import type { EventMessage } from '../../commands/types';

const WS_CONNECTING = 0;
const WS_OPEN = 1;

class MockWebSocket implements WebSocketLike {
  readyState = WS_CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readonly sent: string[] = [];

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
  }

  open(): void {
    this.readyState = WS_OPEN;
    this.onopen?.(new Event('open'));
  }
}

const message: EventMessage = {
  type: 'event',
  event: 'token-moved',
  data: { tokenId: 't1', sceneId: 's1', x: 100, y: 200 },
  ts: 1700000000000,
  seq: 7
};

describe('WebSocketClient.sendEvent', () => {
  let socket: MockWebSocket;
  let client: WebSocketClient;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation();
    socket = new MockWebSocket();
    client = new WebSocketClient({ url: 'ws://localhost:8080', heartbeatInterval: 0 }, () => socket);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('sends the event envelope as JSON, without an id', () => {
    client.connect();
    socket.open();

    expect(client.sendEvent(message)).toBe(true);

    expect(socket.sent).toEqual([JSON.stringify(message)]);
    expect(JSON.parse(socket.sent[0] ?? '{}')).not.toHaveProperty('id');
  });

  it('sends nothing and warns about nothing while the socket is not open', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();

    expect(client.sendEvent(message)).toBe(false);
    client.connect();
    expect(client.sendEvent(message)).toBe(false);

    expect(socket.sent).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('leaves the response path untouched', () => {
    client.connect();
    socket.open();

    client.send({ id: 'c-1', success: true, data: {} });
    client.sendEvent(message);

    expect(socket.sent.map((raw) => (JSON.parse(raw) as { id?: string; type?: string }).id ?? 'event')).toEqual(['c-1', 'event']);
  });
});
