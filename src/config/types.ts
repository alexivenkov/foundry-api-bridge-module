export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] | undefined;
};

export interface ModuleConfig {
  webSocket: WebSocketConfig;
  logging: LoggingConfig;
}

export interface WebSocketConfig {
  enabled: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface LoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
}
