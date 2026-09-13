import { WebSocketClient, WebSocketLike } from '@/transport/WebSocketClient';
import type { Command, CommandResponse } from '@/commands/types';

// WebSocket readyState constants (not available in Node.js)
const WS_CONNECTING = 0;
const WS_OPEN = 1;
const WS_CLOSED = 3;

const MockCloseEvent = class {
  type: string;
  constructor(type: string) {
    this.type = type;
  }
} as unknown as typeof CloseEvent;

class MockWebSocket implements WebSocketLike {
  readyState: number = WS_CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  private sentMessages: string[] = [];

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = WS_CLOSED;
  }

  getSentMessages(): string[] {
    return this.sentMessages;
  }

  simulateOpen(): void {
    this.readyState = WS_OPEN;
    this.onopen?.(new Event('open'));
  }

  simulateClose(): void {
    this.readyState = WS_CLOSED;
    this.onclose?.(new MockCloseEvent('close'));
  }

  simulateMessage(data: unknown): void {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  simulateError(): void {
    this.onerror?.(new Event('error'));
  }
}

describe('WebSocketClient', () => {
  let mockSocket: MockWebSocket;
  let client: WebSocketClient;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    mockSocket = new MockWebSocket();
    client = new WebSocketClient(
      { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 3 },
      () => mockSocket
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function sentPings(socket: MockWebSocket): unknown[] {
    return socket.getSentMessages()
      .map(m => JSON.parse(m) as { type?: string })
      .filter(m => m.type === 'ping');
  }

  describe('connect', () => {
    it('should create socket connection', () => {
      client.connect();
      expect(mockSocket.onopen).not.toBeNull();
    });

    it('should not reconnect if already connected', () => {
      client.connect();
      mockSocket.simulateOpen();

      const firstSocket = mockSocket;
      client.connect();

      expect(mockSocket).toBe(firstSocket);
    });

    it('should call onConnect handler when connected', () => {
      const connectHandler = jest.fn();
      client.onConnect(connectHandler);
      client.connect();
      mockSocket.simulateOpen();

      expect(connectHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('should close socket', () => {
      client.connect();
      mockSocket.simulateOpen();
      client.disconnect();

      expect(mockSocket.readyState).toBe(WS_CLOSED);
    });

    it('should call onDisconnect handler', () => {
      const disconnectHandler = jest.fn();
      client.onDisconnect(disconnectHandler);
      client.connect();
      mockSocket.simulateOpen();
      client.disconnect();
      mockSocket.simulateClose();

      expect(disconnectHandler).toHaveBeenCalledTimes(1);
    });

    it('should not attempt reconnect after manual disconnect', () => {
      client.connect();
      mockSocket.simulateOpen();
      client.disconnect();
      mockSocket.simulateClose();

      jest.advanceTimersByTime(5000);
      expect(mockSocket.readyState).toBe(WS_CLOSED);
    });
  });

  describe('send', () => {
    it('should send serialized response', () => {
      client.connect();
      mockSocket.simulateOpen();

      const response: CommandResponse = { id: '123', success: true, data: { total: 15 } };
      client.send(response);

      expect(mockSocket.getSentMessages()).toEqual([JSON.stringify(response)]);
    });

    it('should not send when disconnected', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const response: CommandResponse = { id: '123', success: true };
      client.send(response);

      expect(mockSocket.getSentMessages()).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('onMessage', () => {
    it('should call handler with parsed command', () => {
      const messageHandler = jest.fn();
      client.onMessage(messageHandler);
      client.connect();
      mockSocket.simulateOpen();

      const command: Command = { id: '123', type: 'roll-dice', params: { formula: '2d6' } };
      mockSocket.simulateMessage(command);

      expect(messageHandler).toHaveBeenCalledWith(command);
    });

    it('should reject invalid command format', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const messageHandler = jest.fn();
      client.onMessage(messageHandler);
      client.connect();
      mockSocket.simulateOpen();

      mockSocket.simulateMessage({ invalid: 'data' });

      expect(messageHandler).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('reconnection', () => {
    it('should attempt reconnect after unexpected disconnect', () => {
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 3 },
        factoryMock
      );

      client.connect();
      mockSocket.simulateOpen();
      mockSocket.simulateClose();

      expect(factoryMock).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(factoryMock).toHaveBeenCalledTimes(2);
    });

    it('should stop after max reconnect attempts', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      let callCount = 0;

      const factoryMock = jest.fn(() => {
        callCount++;
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 3 },
        factoryMock
      );

      client.connect();

      // Exponential backoff: attempt 1 = 1000ms, attempt 2 = 2000ms, attempt 3 = 4000ms
      mockSocket.simulateClose();
      jest.advanceTimersByTime(1000); // attempt 1
      mockSocket.simulateClose();
      jest.advanceTimersByTime(2000); // attempt 2
      mockSocket.simulateClose();
      jest.advanceTimersByTime(4000); // attempt 3
      mockSocket.simulateClose(); // triggers max reached
      jest.advanceTimersByTime(8000); // no more reconnects

      expect(callCount).toBe(4); // initial + 3 reconnects
      expect(consoleSpy).toHaveBeenCalledWith('Foundry API Bridge | Max reconnect attempts reached. Use module settings to reconfigure.');
      consoleSpy.mockRestore();
    });
  });

  describe('exponential backoff', () => {
    it('should increase delay exponentially with each attempt', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 5 },
        factoryMock
      );

      client.connect();

      // Attempt 1: delay = 1000 * 2^0 = 1000ms
      mockSocket.simulateClose();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Reconnecting in 1000ms (attempt 1/5)')
      );

      jest.advanceTimersByTime(1000);

      // Attempt 2: delay = 1000 * 2^1 = 2000ms
      mockSocket.simulateClose();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Reconnecting in 2000ms (attempt 2/5)')
      );

      jest.advanceTimersByTime(2000);

      // Attempt 3: delay = 1000 * 2^2 = 4000ms
      mockSocket.simulateClose();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Reconnecting in 4000ms (attempt 3/5)')
      );

      consoleSpy.mockRestore();
    });

    it('should reset reconnect counter after successful reconnect', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 3 },
        factoryMock
      );

      client.connect();

      // Disconnect, reconnect attempt 1
      mockSocket.simulateClose();
      jest.advanceTimersByTime(1000);

      // Reconnect succeeds
      mockSocket.simulateOpen();

      // Disconnect again — should start from attempt 1 again
      mockSocket.simulateClose();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Reconnecting in 1000ms (attempt 1/3)')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('disconnect during reconnect', () => {
    it('should cancel pending reconnect timer on manual disconnect', () => {
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 5 },
        factoryMock
      );

      client.connect();
      mockSocket.simulateClose(); // schedules reconnect

      // Manually disconnect before timer fires
      client.disconnect();

      jest.advanceTimersByTime(10000);
      // Should only have initial connect + no reconnects after manual disconnect
      expect(factoryMock).toHaveBeenCalledTimes(1);
    });

    it('should allow reconnect after disconnect then connect', () => {
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 3 },
        factoryMock
      );

      // Connect, then manually disconnect
      client.connect();
      mockSocket.simulateOpen();
      client.disconnect();

      // Connect again — should work
      client.connect();
      mockSocket.simulateOpen();
      expect(client.isConnected()).toBe(true);
      expect(factoryMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('message edge cases', () => {
    it('should handle non-JSON message without crashing', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const messageHandler = jest.fn();
      client.onMessage(messageHandler);
      client.connect();
      mockSocket.simulateOpen();

      // Send raw non-JSON string
      mockSocket.onmessage?.(new MessageEvent('message', { data: 'not json at all' }));

      expect(messageHandler).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Foundry API Bridge | Failed to parse WebSocket message:',
        expect.any(SyntaxError)
      );
      consoleSpy.mockRestore();
    });

    it('should reject command missing id field', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const messageHandler = jest.fn();
      client.onMessage(messageHandler);
      client.connect();
      mockSocket.simulateOpen();

      mockSocket.simulateMessage({ type: 'roll-dice', params: {} });

      expect(messageHandler).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should reject command missing type field', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const messageHandler = jest.fn();
      client.onMessage(messageHandler);
      client.connect();
      mockSocket.simulateOpen();

      mockSocket.simulateMessage({ id: '123', params: {} });

      expect(messageHandler).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should reject command missing params field', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const messageHandler = jest.fn();
      client.onMessage(messageHandler);
      client.connect();
      mockSocket.simulateOpen();

      mockSocket.simulateMessage({ id: '123', type: 'roll-dice' });

      expect(messageHandler).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should accept command with params: null', () => {
      const messageHandler = jest.fn();
      client.onMessage(messageHandler);
      client.connect();
      mockSocket.simulateOpen();

      mockSocket.simulateMessage({ id: '123', type: 'get-combat-state', params: null });

      expect(messageHandler).toHaveBeenCalledWith({
        id: '123',
        type: 'get-combat-state',
        params: null
      });
    });

    it('should reject null message data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const messageHandler = jest.fn();
      client.onMessage(messageHandler);
      client.connect();
      mockSocket.simulateOpen();

      mockSocket.simulateMessage(null);

      expect(messageHandler).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should reject array message data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const messageHandler = jest.fn();
      client.onMessage(messageHandler);
      client.connect();
      mockSocket.simulateOpen();

      mockSocket.simulateMessage([1, 2, 3]);

      expect(messageHandler).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not crash when no message handler is registered', () => {
      client.connect();
      mockSocket.simulateOpen();

      // No handler registered — should not throw
      const command = { id: '123', type: 'roll-dice', params: { formula: '1d20' } };
      expect(() => mockSocket.simulateMessage(command)).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should not trigger reconnect on error event alone', () => {
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 3 },
        factoryMock
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      client.connect();
      mockSocket.simulateOpen();
      mockSocket.simulateError();

      jest.advanceTimersByTime(5000);
      // Only the initial connect, error alone should not reconnect
      expect(factoryMock).toHaveBeenCalledTimes(1);
      consoleSpy.mockRestore();
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('should return true when connected', () => {
      client.connect();
      mockSocket.simulateOpen();
      expect(client.isConnected()).toBe(true);
    });

    it('should return false after disconnect', () => {
      client.connect();
      mockSocket.simulateOpen();
      client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('backoff ceiling and jitter', () => {
    it('caps the delay at maxReconnectDelay', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectDelay: 2500, maxReconnectAttempts: 0 },
        factoryMock
      );

      client.connect();
      mockSocket.simulateClose(); // 1000
      jest.advanceTimersByTime(1000);
      mockSocket.simulateClose(); // 2000
      jest.advanceTimersByTime(2000);
      mockSocket.simulateClose(); // 4000 → capped to 2500

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Reconnecting in 2500ms (attempt 3)'));

      jest.advanceTimersByTime(2500);
      mockSocket.simulateClose(); // still 2500
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Reconnecting in 2500ms (attempt 4)'));
      consoleSpy.mockRestore();
    });

    it('adds up to one second of jitter to every delay', () => {
      (Math.random as jest.Mock).mockReturnValue(0.5);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      client.connect();
      mockSocket.simulateClose();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Reconnecting in 1500ms (attempt 1/3)'));
      consoleSpy.mockRestore();
    });

    it('keeps reconnecting forever when maxReconnectAttempts is 0', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectDelay: 1000, maxReconnectAttempts: 0 },
        factoryMock
      );

      client.connect();
      for (let i = 0; i < 25; i++) {
        mockSocket.simulateClose();
        jest.advanceTimersByTime(1000);
      }

      expect(factoryMock).toHaveBeenCalledTimes(26);
      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('Max reconnect attempts reached'));
      warnSpy.mockRestore();
    });

    it('defaults to unlimited attempts and a 60 s ceiling', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient({ url: 'ws://localhost:8080' }, factoryMock);
      client.connect();
      // 5000 · 2^(n-1) passes 60 000 at attempt 5 (80 000)
      const delays = [5000, 10000, 20000, 40000, 60000];
      for (const d of delays) {
        mockSocket.simulateClose();
        jest.advanceTimersByTime(d);
      }
      mockSocket.simulateClose();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Reconnecting in 60000ms (attempt 6)'));
      consoleSpy.mockRestore();
    });
  });

  describe('reconnectNow', () => {
    it('skips the pending backoff and reconnects immediately', () => {
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 60000, maxReconnectAttempts: 0 },
        factoryMock
      );

      client.connect();
      mockSocket.simulateClose(); // reconnect scheduled in 60 s
      client.reconnectNow();

      expect(factoryMock).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(60000);
      expect(factoryMock).toHaveBeenCalledTimes(2); // the old timer was cancelled
    });

    it('does nothing while connected, connecting, or after a manual disconnect', () => {
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient({ url: 'ws://localhost:8080', reconnectInterval: 1000 }, factoryMock);

      client.connect(); // connecting
      client.reconnectNow();
      mockSocket.simulateOpen(); // connected
      client.reconnectNow();
      expect(factoryMock).toHaveBeenCalledTimes(1);

      client.disconnect();
      mockSocket.simulateClose();
      client.reconnectNow();
      expect(factoryMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('heartbeat', () => {
    const heartbeat = { url: 'ws://localhost:8080', reconnectInterval: 1000, heartbeatInterval: 5000, heartbeatTimeout: 2000 };

    it('sends a ping one second after connecting and then every interval', () => {
      client = new WebSocketClient(heartbeat, () => mockSocket);
      client.connect();
      mockSocket.simulateOpen();

      expect(sentPings(mockSocket)).toHaveLength(0);
      jest.advanceTimersByTime(1000);
      expect(sentPings(mockSocket)).toHaveLength(1);
      expect(sentPings(mockSocket)[0]).toEqual({ type: 'ping', ts: expect.any(Number) });

      // The pong must arrive, otherwise the next ping is held back.
      mockSocket.simulateMessage({ type: 'pong' });
      jest.advanceTimersByTime(5000);
      expect(sentPings(mockSocket)).toHaveLength(2);
    });

    it('does not hand pong frames to the command handler', () => {
      const messageHandler = jest.fn();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      client = new WebSocketClient(heartbeat, () => mockSocket);
      client.onMessage(messageHandler);
      client.connect();
      mockSocket.simulateOpen();

      mockSocket.simulateMessage({ type: 'pong', ts: 123 });

      expect(messageHandler).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('drops the socket and reconnects when a server that answered before stops answering', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const disconnectHandler = jest.fn();
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(heartbeat, factoryMock);
      client.onDisconnect(disconnectHandler);
      client.connect();
      mockSocket.simulateOpen();
      const firstSocket = mockSocket;

      jest.advanceTimersByTime(1000); // ping 1
      mockSocket.simulateMessage({ type: 'pong' }); // server supports the heartbeat
      jest.advanceTimersByTime(5000); // ping 2, never answered
      jest.advanceTimersByTime(2000); // timeout

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No pong within 2000ms'));
      expect(firstSocket.readyState).toBe(WS_CLOSED);
      expect(disconnectHandler).toHaveBeenCalledTimes(1);
      expect(client.isConnected()).toBe(false);

      jest.advanceTimersByTime(1000); // backoff attempt 1
      expect(factoryMock).toHaveBeenCalledTimes(2);

      // A late close event from the dead socket must not schedule a second reconnect.
      firstSocket.onclose?.(new MockCloseEvent('close'));
      jest.advanceTimersByTime(10000);
      expect(factoryMock).toHaveBeenCalledTimes(2);
      expect(disconnectHandler).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });

    it('never drops a connection to a server that has not answered a ping yet', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      client = new WebSocketClient(heartbeat, () => mockSocket);
      client.connect();
      mockSocket.simulateOpen();

      jest.advanceTimersByTime(1000 + 2000 + 5000 * 3); // several unanswered pings

      expect(client.isConnected()).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('starts a fresh capability check on every new connection', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(heartbeat, factoryMock);
      client.connect();
      mockSocket.simulateOpen();
      jest.advanceTimersByTime(1000);
      mockSocket.simulateMessage({ type: 'pong' });

      mockSocket.simulateClose();
      jest.advanceTimersByTime(1000); // reconnected to a server that never answers
      mockSocket.simulateOpen();
      jest.advanceTimersByTime(1000 + 2000 + 5000);

      expect(client.isConnected()).toBe(true);
      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('No pong'));
      warnSpy.mockRestore();
    });

    it('pingNow sends a ping immediately while connected', () => {
      client = new WebSocketClient(heartbeat, () => mockSocket);
      client.connect();
      mockSocket.simulateOpen();

      client.pingNow();

      expect(sentPings(mockSocket)).toHaveLength(1);
      client.pingNow(); // one outstanding ping at a time
      expect(sentPings(mockSocket)).toHaveLength(1);
    });

    it('stops pinging after disconnect', () => {
      client = new WebSocketClient(heartbeat, () => mockSocket);
      client.connect();
      mockSocket.simulateOpen();
      client.disconnect();

      jest.advanceTimersByTime(20000);
      expect(sentPings(mockSocket)).toHaveLength(0);
    });

    it('is disabled when heartbeatInterval is 0', () => {
      client = new WebSocketClient({ ...heartbeat, heartbeatInterval: 0 }, () => mockSocket);
      client.connect();
      mockSocket.simulateOpen();

      jest.advanceTimersByTime(20000);
      client.pingNow();
      expect(sentPings(mockSocket)).toHaveLength(0);
    });
  });

  describe('logPrefix', () => {
    it('should prefix log messages when logPrefix is provided', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 3, logPrefix: 'MCP' },
        factoryMock
      );

      client.connect();
      mockSocket.simulateOpen();

      expect(consoleSpy).toHaveBeenCalledWith('Foundry API Bridge | [MCP] WebSocket connected');
      consoleSpy.mockRestore();
    });

    it('should not include prefix when logPrefix is omitted (backward compat)', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      client.connect();
      mockSocket.simulateOpen();

      expect(consoleSpy).toHaveBeenCalledWith('Foundry API Bridge | WebSocket connected');
      consoleSpy.mockRestore();
    });

    it('should prefix warn messages when logPrefix is provided', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 3, logPrefix: 'API' },
        () => mockSocket
      );

      const response: CommandResponse = { id: '123', success: true };
      client.send(response);

      expect(consoleSpy).toHaveBeenCalledWith('Foundry API Bridge | [API] WebSocket is not connected');
      consoleSpy.mockRestore();
    });

    it('should prefix error messages when logPrefix is provided', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 3, logPrefix: 'API' },
        factoryMock
      );

      client.connect();
      mockSocket.simulateOpen();
      mockSocket.simulateMessage({ invalid: 'data' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Foundry API Bridge | [API] Invalid command format:',
        expect.anything()
      );
      consoleSpy.mockRestore();
    });

    it('should prefix reconnect messages when logPrefix is provided', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const factoryMock = jest.fn(() => {
        mockSocket = new MockWebSocket();
        return mockSocket;
      });

      client = new WebSocketClient(
        { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 5, logPrefix: 'MCP' },
        factoryMock
      );

      client.connect();
      mockSocket.simulateClose();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Foundry API Bridge | [MCP] Reconnecting in 1000ms (attempt 1/5)')
      );
      consoleSpy.mockRestore();
    });
  });
});