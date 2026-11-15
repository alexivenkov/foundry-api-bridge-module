import { foundryGeneration } from '@/compat/foundryVersion';
import type { AppearanceWriteOptions } from './foundryTokenAppearanceTypes';

interface FoundryOperatorsGlobals {
  foundry?: {
    data?: {
      operators?: { ForcedReplacement?: { create(value: unknown): unknown } | undefined } | undefined;
    };
  };
}

/**
 * Foundry 14 keeps detection modes in a record and merges records on update,
 * so a replacement goes through `ForcedReplacement` (its `-=key` syntax is no
 * longer supported); up to 13 they are an array, which an update replaces.
 */
export function appearanceWriteOptions(
  generation: number = foundryGeneration(),
  globals: FoundryOperatorsGlobals = globalThis as unknown as FoundryOperatorsGlobals
): AppearanceWriteOptions {
  const asRecord = generation === 0 || generation >= 14;
  const replacement = globals.foundry?.data?.operators?.ForcedReplacement;
  return {
    detectionModesAsRecord: asRecord,
    replace: (value) => (asRecord && replacement ? replacement.create(value) : value)
  };
}
