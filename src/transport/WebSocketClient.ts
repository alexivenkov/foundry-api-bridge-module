import type { Command, CommandResponse } from '@/commands';

export interface WebSocketClientConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  logPrefix?: string;
}

export type MessageHandler = (command: Command) => void;
export type ConnectionHandler = () => void;

export interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

const DEFAULT_RECONNECT_INTERVAL = 5000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;
const WS_OPEN = 1; // WS_OPEN constant for Node.js compatibility
const LOG_BASE = 'Foundry API Bridge | ';

export class WebSocketClient {
  private socket: WebSocketLike | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageHandler: MessageHandler | null = null;
  private connectHandler: ConnectionHandler | null = null;
  private disconnectHandler: ConnectionHandler | null = null;
  private isManualClose = false;

  private readonly config: Required<WebSocketClientConfig>;
  private readonly createSocket: WebSocketFactory;

  constructor(
    config: WebSocketClientConfig,
    socketFactory?: WebSocketFactory
  ) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval ?? DEFAULT_RECONNECT_INTERVAL,
      maxReconnectAttempts: config.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS,
      logPrefix: config.logPrefix ?? '',
    };
    this.createSocket = socketFactory ?? ((url: string): WebSocketLike => new WebSocket(url));
  }

  connect(): void {
    if (this.socket?.readyState === WS_OPEN) {
      return;
    }

    this.isManualClose = false;
    this.socket = this.createSocket(this.config.url);
    this.setupSocketHandlers();
  }

  disconnect(): void {
    this.isManualClose = true;
    this.clearReconnectTimer();
    this.socket?.close();
    this.socket = null;
  }

  send(response: CommandResponse): void {
    if (this.socket?.readyState !== WS_OPEN) {
      this.log('warn', 'WebSocket is not connected');
      return;
    }

    this.socket.send(JSON.stringify(response));
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  onConnect(handler: ConnectionHandler): void {
    this.connectHandler = handler;
  }

  onDisconnect(handler: ConnectionHandler): void {
    this.disconnectHandler = handler;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WS_OPEN;
  }

  private log(method: 'log' | 'warn' | 'error', msg: string, ...rest: unknown[]): void {
    const prefix = this.config.logPrefix ? `[${this.config.logPrefix}] ` : '';
    const line = `${LOG_BASE}${prefix}${msg}`;
    if (rest.length > 0) {
      console[method](line, ...rest);
    } else {
      console[method](line);
    }
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = (): void => {
      this.reconnectAttempts = 0;
      this.log('log', 'WebSocket connected');
      this.connectHandler?.();
    };

    this.socket.onclose = (): void => {
      this.log('log', 'WebSocket disconnected');
      this.disconnectHandler?.();

      if (!this.isManualClose) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (event: Event): void => {
      this.log('error', 'WebSocket error:', event);
    };

    this.socket.onmessage = (event: MessageEvent): void => {
      this.handleMessage(event);
    };
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string) as unknown;

      if (!this.isValidCommand(data)) {
        this.log('error', 'Invalid command format:', data);
        return;
      }

      this.messageHandler?.(data);
    } catch (error) {
      this.log('error', 'Failed to parse WebSocket message:', error);
    }
  }

  private isValidCommand(data: unknown): data is Command {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const obj = data as Record<string, unknown>;
    return (
      typeof obj['id'] === 'string' &&
      typeof obj['type'] === 'string' &&
      'params' in obj
    );
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('warn', 'Max reconnect attempts reached. Use module settings to reconfigure.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    this.log('log', `Reconnecting in ${String(delay)}ms (attempt ${String(this.reconnectAttempts)}/${String(this.config.maxReconnectAttempts)})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
