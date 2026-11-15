import type { OwnershipLevel, OwnershipLevels } from '@/core/documents/domain';

// CONST.DOCUMENT_OWNERSHIP_LEVELS, identical in Foundry 13.351 and 14.368. The meta levels DEFAULT (-20) and
// NOCHANGE (-10) are form values of the ownership dialog and never stored.
const LEVEL_CODE: Readonly<Record<OwnershipLevel, number>> = { inherit: -1, none: 0, limited: 1, observer: 2, owner: 3 };
const LEVEL_BY_CODE: ReadonlyMap<number, OwnershipLevel> = new Map(
  Object.entries(LEVEL_CODE).map(([level, code]) => [code, level as OwnershipLevel])
);

export function ownershipLevelToCode(level: OwnershipLevel): number {
  return LEVEL_CODE[level];
}

export function ownershipLevelFromCode(code: unknown): OwnershipLevel | null {
  return typeof code === 'number' ? (LEVEL_BY_CODE.get(code) ?? null) : null;
}

/** The stored `ownership` object; a missing default reads as "none", as `Document#getUserLevel` does. */
export function readOwnership(source: unknown): OwnershipLevels | null {
  if (source === null || typeof source !== 'object') {
    return null;
  }
  const users = new Map<string, OwnershipLevel>();
  let defaultLevel: OwnershipLevel = 'none';
  for (const [key, code] of Object.entries(source as Record<string, unknown>)) {
    const level = ownershipLevelFromCode(code);
    if (level === null) {
      continue;
    }
    if (key === 'default') {
      defaultLevel = level;
    } else {
      users.set(key, level);
    }
  }
  return { defaultLevel, users };
}

export function toFoundryOwnership(ownership: OwnershipLevels): Record<string, number> {
  const data: Record<string, number> = { default: ownershipLevelToCode(ownership.defaultLevel) };
  for (const [userId, level] of ownership.users) {
    data[userId] = ownershipLevelToCode(level);
  }
  return data;
}
