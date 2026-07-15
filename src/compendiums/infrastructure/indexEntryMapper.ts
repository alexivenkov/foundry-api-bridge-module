import type { PackIndexEntry } from '@/compendiums/domain';
import type { RawIndexEntry } from './foundryPackTypes';

export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (path.length === 0) return undefined;

  // Foundry's getIndex({fields}) may store a requested dot-path as a literal
  // flat key on the entry; prefer it over nested traversal.
  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return obj[path];
  }

  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function toPackIndexEntry(
  entry: RawIndexEntry,
  requestedFields?: readonly string[]
): PackIndexEntry {
  const id = entry._id ?? entry.id ?? '';
  const name = entry.name ?? '';
  const img = entry.img !== undefined && entry.img !== null ? entry.img : null;
  const type = entry.type !== undefined && entry.type !== null ? entry.type : null;

  if (requestedFields === undefined || requestedFields.length === 0) {
    return { id, name, img, type };
  }

  const fields: Record<string, unknown> = {};
  for (const field of requestedFields) {
    fields[field] = getNestedValue(entry as Record<string, unknown>, field);
  }
  return { id, name, img, type, fields };
}
