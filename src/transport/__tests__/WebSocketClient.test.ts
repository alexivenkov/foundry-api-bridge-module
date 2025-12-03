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
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
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

      for (let i = 0; i < 5; i++) {
        mockSocket.simulateClose();
        jest.advanceTimersByTime(1000);
      }

      expect(callCount).toBe(4); // initial + 3 reconnects
      expect(consoleSpy).toHaveBeenCalledWith('Max reconnect attempts reached');
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