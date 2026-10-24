import { normalizeApiKey, validateApiKey } from '@/settings/apiKeyFormat';

// pk_ + 32 base64url characters, the shape foundry-mcp.com issues.
const VALID_KEY = 'pk_aB3-_x9Qz0LmNoPqRsTuVwXyZ1234567';

describe('normalizeApiKey', () => {
  it('removes a line break in the middle of the key', () => {
    expect(normalizeApiKey('pk_aB3-_x9Qz0LmNo\nPqRsTuVwXyZ1234567')).toBe(VALID_KEY);
  });

  it('removes non-breaking, zero-width and BOM characters anywhere in the string', () => {
    expect(normalizeApiKey('﻿pk_aB3-_x9Qz0 LmNoPqRs​TuVwXyZ1234567⁠')).toBe(VALID_KEY);
  });

  it('removes surrounding whitespace and tabs', () => {
    expect(normalizeApiKey(`  \t${VALID_KEY}\r\n`)).toBe(VALID_KEY);
  });

  it('leaves a clean key untouched', () => {
    expect(normalizeApiKey(VALID_KEY)).toBe(VALID_KEY);
  });
});

describe('validateApiKey', () => {
  it('accepts pk_ followed by 32 base64url characters', () => {
    expect(validateApiKey(VALID_KEY)).toEqual({ ok: true, key: VALID_KEY });
  });

  it('returns the cleaned key when the pasted value had whitespace inside', () => {
    expect(validateApiKey('pk_aB3-_x9Qz0LmNo\nPqRsTu VwXyZ1234567')).toEqual({ ok: true, key: VALID_KEY });
  });

  it('accepts plain base64 characters (+ / =) for keys from an older generator', () => {
    const key = 'pk_abc+def/ghi=jklmnopqrstuv';
    expect(validateApiKey(key)).toEqual({ ok: true, key });
  });

  it('rejects an empty string as empty', () => {
    expect(validateApiKey('')).toMatchObject({ ok: false, reason: 'empty' });
  });

  it('rejects a whitespace-only string as empty', () => {
    expect(validateApiKey(' \n\t ')).toMatchObject({ ok: false, reason: 'empty' });
  });

  it('rejects a value without the pk_ prefix', () => {
    expect(validateApiKey('abc')).toMatchObject({ ok: false, reason: 'prefix' });
  });

  it('rejects an OAuth token pasted instead of a key', () => {
    expect(validateApiKey('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.abc')).toMatchObject({
      ok: false,
      reason: 'prefix'
    });
  });

  it('rejects characters outside the key alphabet and names them', () => {
    const result = validateApiKey('pk_aB3-_x9Qz0Lm!NoPqRsTuVwXyZ12#4567');
    expect(result).toMatchObject({ ok: false, reason: 'charset' });
    if (!result.ok) {
      expect(result.detail).toBe('unexpected characters: "!", "#"');
    }
  });

  it('rejects a key that is too short', () => {
    const result = validateApiKey('pk_short');
    expect(result).toMatchObject({ ok: false, reason: 'length' });
    if (!result.ok) {
      expect(result.detail).toBe('length 8, expected 20..64');
    }
  });

  it('rejects a key that is too long', () => {
    expect(validateApiKey(`pk_${'a'.repeat(62)}`)).toMatchObject({ ok: false, reason: 'length' });
  });

  it('accepts the shortest and longest allowed lengths', () => {
    expect(validateApiKey(`pk_${'a'.repeat(17)}`)).toMatchObject({ ok: true });
    expect(validateApiKey(`pk_${'a'.repeat(61)}`)).toMatchObject({ ok: true });
  });
});
