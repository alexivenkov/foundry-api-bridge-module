import type { PackOwnership, PackOwnershipLevel, PackOwnershipRole } from '@/compendiums/domain/model';

export const PACK_OWNERSHIP_LEVELS: readonly PackOwnershipLevel[] = Object.freeze([
  'inherit',
  'none',
  'limited',
  'observer',
  'owner'
]);

export const PACK_OWNERSHIP_ROLES: readonly PackOwnershipRole[] = Object.freeze([
  'player',
  'trusted',
  'assistant'
]);

// The core fills a role missing from a written ownership object with its own
// initial value (assistant: owner, the others: inherit), so a partial change
// is merged onto the pack's current ownership before it is written.
export function mergePackOwnership(
  current: PackOwnership,
  changes: Partial<PackOwnership>
): PackOwnership {
  return {
    player: changes.player ?? current.player,
    trusted: changes.trusted ?? current.trusted,
    assistant: changes.assistant ?? current.assistant
  };
}
