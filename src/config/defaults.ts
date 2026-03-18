import type { ModuleConfig } from '@/config/types';

export const SERVER_URL = 'https://foundry-mcp.com';
export const WS_URL = 'wss://foundry-mcp.com/ws';

export const DEFAULT_CONFIG: ModuleConfig = {
  apiServer: {
    updateInterval: 5000,
    endpoints: {
      worldData: '/update',
      compendium: '/update-compendium'
    }
  },
  webSocket: {
    enabled: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10
  },
  features: {
    autoLoadCompendium: true,
    collectWorldData: true,
    periodicUpdates: true
  },
  compendium: {
    autoLoad: []
  },
  logging: {
    enabled: true,
    level: 'info'
  }
};
