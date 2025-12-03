import type { ModuleConfig } from '@/config/types';

export const DEFAULT_CONFIG: ModuleConfig = {
  apiServer: {
    url: 'http://localhost:3001',
    updateInterval: 5000,
    endpoints: {
      worldData: '/update',
      compendium: '/update-compendium'
    }
  },
  webSocket: {
    enabled: true,
    url: 'ws://localhost:3001/ws',
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
