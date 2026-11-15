import type { PackOwnership, PackOwnershipLevel, PackOwnershipRole } from '@/compendiums/domain';

// The compendium configuration stores ownership by `CONST.USER_ROLES` name with
// `CONST.DOCUMENT_OWNERSHIP_LEVELS` names as values; the core pins GAMEMASTER
// to OWNER (`CompendiumCollection.CONFIG_FIELD`, v13 / v14).
const ROLE_NAMES: Readonly<Record<PackOwnershipRole, string>> = {
  player: 'PLAYER',
  trusted: 'TRUSTED',
  assistant: 'ASSISTANT'
};

const LEVEL_NAMES: Readonly<Record<PackOwnershipLevel, string>> = {
  inherit: 'INHERIT',
  none: 'NONE',
  limited: 'LIMITED',
  observer: 'OBSERVER',
  owner: 'OWNER'
};

const LEVELS_BY_NAME = new Map<string, PackOwnershipLevel>(
  (Object.entries(LEVEL_NAMES) as [PackOwnershipLevel, string][]).map(([level, name]) => [name, level])
);

// A role missing from the stored object adds nothing to a user's level, the
// same as INHERIT (`CompendiumCollection#getUserLevel`).
export function fromCoreOwnership(stored: Readonly<Record<string, string | undefined>>): PackOwnership {
  const level = (role: PackOwnershipRole): PackOwnershipLevel =>
    LEVELS_BY_NAME.get(stored[ROLE_NAMES[role]] ?? '') ?? 'inherit';
  return { player: level('player'), trusted: level('trusted'), assistant: level('assistant') };
}

export function toCoreOwnership(ownership: PackOwnership): Record<string, string> {
  return {
    GAMEMASTER: 'OWNER',
    ASSISTANT: LEVEL_NAMES[ownership.assistant],
    TRUSTED: LEVEL_NAMES[ownership.trusted],
    PLAYER: LEVEL_NAMES[ownership.player]
  };
}
