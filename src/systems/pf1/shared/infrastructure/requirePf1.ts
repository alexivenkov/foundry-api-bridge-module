import { requireSystem } from '@/systems';
import { ValidationError } from '@/systems/shared/domain/errors';

/** The pf1 line these commands are written against (pf1 11.x runs on Foundry 12–13). */
const SUPPORTED_MAJOR = 11;
/** pf1 12 (Foundry 14 only) changes `d20Roll`, roll modes, skill ids and the spellcasting API. */
const FIRST_UNSUPPORTED_FOUNDRY = 14;

interface Pf1VersionGlobals {
  system?: { version?: string };
  release?: { generation?: number };
}

/**
 * `requireSystem('pf1', …)` plus a version check, so a pf1 12 world gets a
 * clear refusal instead of a confusing failure deep inside a roll. Foundry 14
 * is checked too because development builds of pf1 12 still report 11.x.
 */
export function requirePf1(operation: string): void {
  requireSystem('pf1', operation);
  const game = (globalThis as unknown as { game?: Pf1VersionGlobals }).game;
  const version = game?.system?.version ?? '';
  const major = Number.parseInt(version, 10);
  const generation = game?.release?.generation;
  if ((Number.isFinite(major) && major > SUPPORTED_MAJOR) || (generation !== undefined && generation >= FIRST_UNSUPPORTED_FOUNDRY)) {
    throw new ValidationError(
      `${operation} supports pf1 11.x on Foundry 12–13; this world runs pf1 ${version || 'unknown'} on Foundry ${String(generation ?? 'unknown')}`
    );
  }
}
