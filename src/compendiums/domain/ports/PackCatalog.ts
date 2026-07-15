import type { PackDescriptor, PackSummary } from '@/compendiums/domain/model';

// Synchronous by design: the Foundry pack registry lives in memory and its
// index sizes are populated with world data before the module activates.
export interface PackCatalog {
  listPacks(): readonly PackSummary[];
  findPack(packId: string): PackDescriptor | null;
}
