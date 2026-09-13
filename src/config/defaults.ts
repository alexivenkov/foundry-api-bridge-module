import type { ModuleConfig } from '@/config/types';

export const DEFAULT_CONFIG: ModuleConfig = {
  webSocket: {
    enabled: true,
    reconnectInterval: 5000,
    // 0 = keep trying while the world is open (the delay is capped at 60 s).
    maxReconnectAttempts: 0
  },
  logging: {
    enabled: true,
    level: 'info'
  }
};
