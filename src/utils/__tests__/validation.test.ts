import { isValidUrl, isValidPackId } from '../validation';

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
