import type { ResolvedUuidRecord } from '@/compendiums/domain/model';

export interface UuidResolver {
  /**
   * Resolve an absolute Foundry UUID (world, compendium, or embedded
   * document) to its full record, or null when it does not resolve.
   * Relative UUIDs (starting with '.') are not supported.
   */
  resolve(uuid: string): Promise<ResolvedUuidRecord | null>;
}
