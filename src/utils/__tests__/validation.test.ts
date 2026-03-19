import { isValidUrl, isValidPackId, isDefaultOrEmptySettings } from '@/utils/validation';

describe('isValidUrl', () => {
  it('returns true for valid HTTP URL', () => {
    expect(isValidUrl('http://localhost:3001')).toBe(true);
  });

  it('returns true for valid HTTPS URL', () => {
    expect(isValidUrl('https://api.example.com')).toBe(true);
  });

  it('returns false for invalid URL', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });
});

describe('isDefaultOrEmptySettings', () => {
  it('returns true when apiKey is empty', () => {
    expect(isDefaultOrEmptySettings('https://foundry-mcp.com', 'wss://foundry-mcp.com/ws', '')).toBe(true);
  });

  it('returns true when serverUrl is default localhost', () => {
    expect(isDefaultOrEmptySettings('http://localhost:3001', 'wss://foundry-mcp.com/ws', 'pk_test')).toBe(true);
  });

  it('returns true when wsUrl is default localhost', () => {
    expect(isDefaultOrEmptySettings('https://foundry-mcp.com', 'ws://localhost:3001/ws', 'pk_test')).toBe(true);
  });

  it('returns true when serverUrl is empty', () => {
    expect(isDefaultOrEmptySettings('', 'wss://foundry-mcp.com/ws', 'pk_test')).toBe(true);
  });

  it('returns true when wsUrl is empty', () => {
    expect(isDefaultOrEmptySettings('https://foundry-mcp.com', '', 'pk_test')).toBe(true);
  });

  it('returns true when all settings are empty', () => {
    expect(isDefaultOrEmptySettings('', '', '')).toBe(true);
  });

  it('returns true when all settings are defaults', () => {
    expect(isDefaultOrEmptySettings('http://localhost:3001', 'ws://localhost:3001/ws', '')).toBe(true);
  });

  it('returns false when all settings are properly configured', () => {
    expect(isDefaultOrEmptySettings('https://foundry-mcp.com', 'wss://foundry-mcp.com/ws', 'pk_abc123')).toBe(false);
  });

  it('returns false with custom non-localhost URLs and apiKey', () => {
    expect(isDefaultOrEmptySettings('http://192.168.1.100:3001', 'ws://192.168.1.100:3001/ws', 'pk_key')).toBe(false);
  });
});

describe('isValidPackId', () => {
  it('returns true for valid pack ID', () => {
    expect(isValidPackId('dnd5e.monsters')).toBe(true);
  });

  it('returns true for pack ID with hyphens', () => {
    expect(isValidPackId('world.ddb-oota-ddb-monsters')).toBe(true);
  });

  it('returns false for pack ID without dot', () => {
    expect(isValidPackId('monsters')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidPackId('')).toBe(false);
  });
});
