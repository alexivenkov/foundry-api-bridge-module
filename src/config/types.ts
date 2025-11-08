export interface ModuleConfig {
  apiServer: ApiServerConfig;
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
