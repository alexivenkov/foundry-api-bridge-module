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
    mockSocket = new MockWebSocket();
    client = new WebSocketClient(
      { url: 'ws://localhost:8080', reconnectInterval: 1000, maxReconnectAttempts: 3 },
      () => mockSocket
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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
});