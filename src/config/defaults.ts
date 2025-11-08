import type { ModuleConfig } from './types';

export const DEFAULT_CONFIG: ModuleConfig = {
  apiServer: {
    url: 'http://localhost:3001',
    updateInterval: 5000,
    endpoints: {
      worldData: '/update',
      compendium: '/update-compendium'
    }
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
