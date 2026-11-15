import { FlagScopeUnavailableError, InvalidFlagKeyError } from '@/core/documents/domain/errors/documentErrors';

/** Flags live in the document record; a larger blob belongs in a journal page or a file. */
export const FLAG_VALUE_MAX_BYTES = 64 * 1024;

const RESERVED_SEGMENTS: ReadonlySet<string> = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * A dotted path of plain keys. The core reads `-=` / `==` prefixes as delete / replace operators and expands the
 * path into nested objects, so those prefixes and prototype names are refused.
 */
export function requireFlagKey(key: string): void {
  if (key.length === 0) {
    throw new InvalidFlagKeyError(key, 'it is empty');
  }
  for (const segment of key.split('.')) {
    if (segment.length === 0) {
      throw new InvalidFlagKeyError(key, 'it has an empty segment');
    }
    if (segment.startsWith('-=') || segment.startsWith('==')) {
      throw new InvalidFlagKeyError(key, `segment "${segment}" starts with an update operator`);
    }
    if (RESERVED_SEGMENTS.has(segment)) {
      throw new InvalidFlagKeyError(key, `segment "${segment}" is reserved`);
    }
  }
}

/** The scopes the core accepts for writing: core, world, the system id and the active modules. */
export function requireActiveFlagScope(scope: string, activeScopes: readonly string[]): void {
  if (!activeScopes.includes(scope)) {
    throw new FlagScopeUnavailableError(scope, activeScopes);
  }
}

export interface FlagLookup {
  readonly found: boolean;
  readonly value: unknown;
}

export function readFlag(flags: Readonly<Record<string, unknown>>, scope: string, key: string): FlagLookup {
  let current: unknown = flags[scope];
  for (const segment of key.split('.')) {
    if (current === null || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return { found: false, value: null };
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return { found: true, value: current };
}
