import type { Command, CommandResponse } from '@/commands';

export interface WebSocketClientConfig {
  url: string;
  /** Base delay before the first reconnect attempt; doubles on every further attempt. */
  reconnectInterval?: number;
  /** Ceiling for the reconnect delay, so a long outage never means a 40-minute wait. */
  maxReconnectDelay?: number;
  /** Attempts before giving up. 0 = keep trying for as long as the world is open. */
  maxReconnectAttempts?: number;
  /** Interval between application-level pings while connected. 0 disables the heartbeat. */
  heartbeatInterval?: number;
  /** How long a ping may go unanswered before the socket is declared dead. */
  heartbeatTimeout?: number;
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
const DEFAULT_MAX_RECONNECT_DELAY = 60_000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 0; // unlimited
const DEFAULT_HEARTBEAT_INTERVAL = 25_000;
const DEFAULT_HEARTBEAT_TIMEOUT = 10_000;
/** The first ping goes out shortly after open so a dead-on-arrival socket is caught quickly. */
const FIRST_HEARTBEAT_DELAY = 1000;
/** Random extra delay added to every reconnect so many worlds do not retry in lockstep. */
const RECONNECT_JITTER_MS = 1000;
const WS_CONNECTING = 0;
const WS_OPEN = 1; // WS_OPEN constant for Node.js compatibility
const LOG_BASE = 'Foundry API Bridge | ';

export class WebSocketClient {
  private socket: WebSocketLike | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private awaitingPong = false;
  /**
   * Set once the server answers a ping on the current connection. Until then
   * a missing pong proves nothing: servers that predate the heartbeat never
   * answer, and the connection must keep working against them.
   */
  private pongSupported = false;
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
      maxReconnectDelay: config.maxReconnectDelay ?? DEFAULT_MAX_RECONNECT_DELAY,
      maxReconnectAttempts: config.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS,
      heartbeatInterval: config.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL,
      heartbeatTimeout: config.heartbeatTimeout ?? DEFAULT_HEARTBEAT_TIMEOUT,
      logPrefix: config.logPrefix ?? '',
    };
    this.createSocket = socketFactory ?? ((url: string): WebSocketLike => new WebSocket(url));
  }

  connect(): void {
    if (this.socket?.readyState === WS_OPEN || this.socket?.readyState === WS_CONNECTING) {
      return;
    }

    this.isManualClose = false;
    this.pongSupported = false;
    this.socket = this.createSocket(this.config.url);
    this.setupSocketHandlers();
  }

  disconnect(): void {
    this.isManualClose = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.socket?.close();
    this.socket = null;
  }

  /**
   * Skip the remaining backoff delay and reconnect immediately. Used when the
   * browser reports the network is back or the tab becomes visible again.
   * No-op while connected, while a connection attempt is in flight, or after
   * a manual disconnect.
   */
  reconnectNow(): void {
    if (this.isManualClose) return;
    if (this.socket?.readyState === WS_OPEN || this.socket?.readyState === WS_CONNECTING) return;
    if (this.reconnectTimer === null) return;

    this.clearReconnectTimer();
    this.log('log', 'Reconnecting now');
    this.connect();
  }

  /**
   * Send a ping right away instead of waiting for the next heartbeat tick.
   * Used after the tab wakes up, when a socket that looks open may be dead.
   */
  pingNow(): void {
    if (this.config.heartbeatInterval <= 0) return;
    this.sendPing();
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
      this.startHeartbeat();
      this.connectHandler?.();
    };

    this.socket.onclose = (): void => {
      this.stopHeartbeat();
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

      if (this.isPong(data)) {
        this.pongSupported = true;
        this.clearPongTimer();
        return;
      }

      if (!this.isValidCommand(data)) {
        this.log('error', 'Invalid command format:', data);
        return;
      }

      this.messageHandler?.(data);
    } catch (error) {
      this.log('error', 'Failed to parse WebSocket message:', error);
    }
  }

  private isPong(data: unknown): boolean {
    return typeof data === 'object' && data !== null
      && (data as Record<string, unknown>)['type'] === 'pong';
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

  // ── Heartbeat ────────────────────────────────────────────────────────────
  //
  // Browsers answer protocol-level pings on their own and never expose them,
  // so a socket that died behind a NAT or during laptop sleep stays "open"
  // from the page's point of view until the OS gives up on it, which can take
  // many minutes. The application-level ping/pong below closes that gap: an
  // unanswered ping on a server that has proven it answers them means the
  // connection is gone, and we reconnect instead of waiting.

  private startHeartbeat(): void {
    this.stopHeartbeat();
    if (this.config.heartbeatInterval <= 0) return;

    this.heartbeatTimer = setTimeout(() => {
      this.sendPing();
      this.heartbeatTimer = setInterval(() => {
        this.sendPing();
      }, this.config.heartbeatInterval);
    }, Math.min(FIRST_HEARTBEAT_DELAY, this.config.heartbeatInterval));
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearTimeout(this.heartbeatTimer);
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearPongTimer();
  }

  private sendPing(): void {
    if (this.socket?.readyState !== WS_OPEN) return;
    if (this.awaitingPong) return;

    this.socket.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
    this.awaitingPong = true;
    this.pongTimer = setTimeout(() => {
      this.pongTimer = null;
      this.awaitingPong = false;
      if (this.pongSupported) {
        this.dropDeadSocket();
      }
    }, this.config.heartbeatTimeout);
  }

  private clearPongTimer(): void {
    if (this.pongTimer !== null) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
    this.awaitingPong = false;
  }

  /**
   * The server stopped answering pings: treat the socket as gone. Its handlers
   * are detached first so a late close event from the dead socket cannot
   * schedule a second reconnect on top of the one started here.
   */
  private dropDeadSocket(): void {
    const dead = this.socket;
    if (!dead) return;

    this.stopHeartbeat();
    this.log('warn', `No pong within ${String(this.config.heartbeatTimeout)}ms, treating the connection as dead`);

    dead.onopen = null;
    dead.onclose = null;
    dead.onmessage = null;
    dead.onerror = null;
    this.socket = null;
    try {
      dead.close();
    } catch {
      // The socket is already gone; nothing to clean up.
    }

    this.disconnectHandler?.();
    if (!this.isManualClose) {
      this.scheduleReconnect();
    }
  }

  // ── Reconnect ────────────────────────────────────────────────────────────

  private scheduleReconnect(): void {
    const max = this.config.maxReconnectAttempts;
    if (max > 0 && this.reconnectAttempts >= max) {
      this.log('warn', 'Max reconnect attempts reached. Use module settings to reconfigure.');
      return;
    }

    this.reconnectAttempts++;
    const exponential = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.floor(Math.random() * RECONNECT_JITTER_MS);
    const delay = Math.min(exponential, this.config.maxReconnectDelay) + jitter;
    const attempt = max > 0
      ? `${String(this.reconnectAttempts)}/${String(max)}`
      : String(this.reconnectAttempts);
    this.log('log', `Reconnecting in ${String(delay)}ms (attempt ${attempt})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
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
