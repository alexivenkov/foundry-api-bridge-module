const DEFAULT_SERVER_URL = 'http://localhost:3001';
const DEFAULT_WS_URL = 'ws://localhost:3001/ws';

export function isDefaultOrEmptySettings(serverUrl: string, wsUrl: string, apiKey: string): boolean {
  if (!apiKey) return true;
  if (!serverUrl || serverUrl === DEFAULT_SERVER_URL) return true;
  if (!wsUrl || wsUrl === DEFAULT_WS_URL) return true;
  return false;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidPackId(packId: string): boolean {
  return /^[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/.test(packId);
}
