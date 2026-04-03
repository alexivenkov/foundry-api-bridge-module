import type { ModuleConfig } from '@/config/types';

export const DEFAULT_CONFIG: ModuleConfig = {
  webSocket: {
    enabled: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10
  },
  logging: {
    enabled: true,
    level: 'info'
  }
};
