/**
 * Keys are issued by foundry-mcp.com as `pk_` followed by base64url characters.
 * Pasting one into the settings field goes wrong in predictable ways: a line
 * break or a non-breaking space in the middle, a trailing "Copy" picked up with
 * the mouse, an OAuth token instead of a key. Until 8.15.0 every one of them
 * looked like an endless connect/disconnect loop.
 */

export type ApiKeyRejection = 'empty' | 'prefix' | 'charset' | 'length';

export type ApiKeyValidation =
  | { ok: true; key: string }
  | { ok: false; reason: ApiKeyRejection; detail: string };

export type InvalidApiKey = Extract<ApiKeyValidation, { ok: false }>;

const KEY_PREFIX = 'pk_';
/**
 * Not pinned to the 35 characters the current generator emits: an older or a
 * future generator may differ, and the server's 4001 close has the final word.
 */
const MIN_LENGTH = 20;
const MAX_LENGTH = 64;
/** `+/=` admit keys from a plain base64 generator. */
const ALLOWED_CHARS = /^[A-Za-z0-9_\-+/=]*$/u;
/**
 * Whitespace plus the invisible characters a copy-paste can pick up: NBSP,
 * zero-width space and joiners, word joiner, BOM. A key never contains any of
 * them, so dropping them anywhere in the string is safe.
 */
const INVISIBLE_CHARS = /[\s ​-‍⁠﻿]/gu;

export function normalizeApiKey(raw: string): string {
  return raw.replace(INVISIBLE_CHARS, '');
}

export function validateApiKey(raw: string): ApiKeyValidation {
  const key = normalizeApiKey(raw);

  if (key === '') {
    return { ok: false, reason: 'empty', detail: 'no key configured' };
  }
  if (!key.startsWith(KEY_PREFIX)) {
    return { ok: false, reason: 'prefix', detail: `expected a key starting with "${KEY_PREFIX}"` };
  }
  if (!ALLOWED_CHARS.test(key)) {
    return { ok: false, reason: 'charset', detail: `unexpected characters: ${listUnexpectedChars(key)}` };
  }
  if (key.length < MIN_LENGTH || key.length > MAX_LENGTH) {
    return {
      ok: false,
      reason: 'length',
      detail: `length ${String(key.length)}, expected ${String(MIN_LENGTH)}..${String(MAX_LENGTH)}`
    };
  }

  return { ok: true, key };
}

function listUnexpectedChars(key: string): string {
  const seen = new Set<string>();
  for (const ch of key) {
    if (!ALLOWED_CHARS.test(ch)) {
      seen.add(ch);
    }
  }
  return [...seen].map(ch => JSON.stringify(ch)).join(', ');
}
