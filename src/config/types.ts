export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] | undefined;
};

export interface ModuleConfig {
  apiServer: ApiServerConfig;
  webSocket: WebSocketConfig;
  features: FeaturesConfig;
  compendium: CompendiumConfig;
  logging: LoggingConfig;
}

export interface ApiServerConfig {
  url: string;
  updateInterval: number;
  endpoints: {
    worldData: string;
    compendium: string;
  };
}

export interface WebSocketConfig {
  enabled: boolean;
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface FeaturesConfig {
  autoLoadCompendium: boolean;
  collectWorldData: boolean;
  periodicUpdates: boolean;
}

export interface CompendiumConfig {
  autoLoad: string[];
}

export interface LoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
}
