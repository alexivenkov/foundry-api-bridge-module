import { isV14Plus } from '@/compat/foundryVersion';
import type { TableResultKind } from '@/core/tables/domain';

// CONST.TABLE_RESULT_TYPES up to Foundry 11. Later versions store strings and
// migrate these numbers on the way in — until 14, which dropped the migration.
const LEGACY_TYPE_CODE: Readonly<Record<TableResultKind, number>> = { text: 0, document: 1, compendium: 2 };
const KIND_BY_LEGACY_CODE: Readonly<Record<number, TableResultKind>> = { 0: 'text', 1: 'document', 2: 'compendium' };

/**
 * The `type` to send when creating a result. Below Foundry 14 it is the legacy
 * number, which the core migrates itself. Foundry 14 takes only the string; its
 * compendium type is gone since 13 and is a document result.
 */
export function resultTypeForCreate(kind: TableResultKind): number | string {
  if (!isV14Plus()) {
    return LEGACY_TYPE_CODE[kind];
  }
  return kind === 'text' ? 'text' : 'document';
}

/**
 * The kind of a result stored the pre-13 way: `type` is a number up to Foundry
 * 11 and a string in 12, where `pack` is the compendium type.
 */
export function legacyResultKind(type: number | string): TableResultKind {
  if (typeof type === 'number') {
    return KIND_BY_LEGACY_CODE[type] ?? 'text';
  }
  if (type === 'document') {
    return 'document';
  }
  return type === 'pack' ? 'compendium' : 'text';
}

/**
 * Since Foundry 13 a compendium entry is a `document` result like any other;
 * only where its reference leads tells the two apart.
 */
export function currentResultKind(type: number | string, pointsIntoCompendium: boolean): TableResultKind {
  if (type === 'text') {
    return 'text';
  }
  return pointsIntoCompendium ? 'compendium' : 'document';
}
