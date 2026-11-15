import { foundryGeneration } from '@/compat/foundryVersion';
import type { RegionBehaviorCatalog } from '@/core/regions/domain';
import { regionGlobalsFromGlobalThis, type RegionGlobalsProvider } from './foundryRegionBehaviorTypes';

/**
 * What the running world registers. Types come from `game.documentTypes` (core types
 * plus those of the system and modules), events from `CONST.REGION_EVENTS` (its
 * deprecated aliases are non-enumerable getters and stay out), and the movement
 * actions from the real `modifyMovementCost` schema, which holds a difficulty only
 * for actions without a derived terrain difficulty.
 */
export class FoundryRegionBehaviorCatalog implements RegionBehaviorCatalog {
  constructor(
    private readonly globals: RegionGlobalsProvider = regionGlobalsFromGlobalThis,
    private readonly generation: () => number = foundryGeneration
  ) {}

  registeredTypes(): readonly string[] | null {
    const types = this.globals().game?.documentTypes?.['RegionBehavior'];
    return Array.isArray(types) ? types.filter((type) => type !== 'base') : null;
  }

  regionEvents(): readonly string[] | null {
    const events = this.globals().CONST?.REGION_EVENTS;
    return events !== undefined ? Object.values(events) : null;
  }

  movementCostActions(): readonly string[] | null {
    const fields = this.globals().CONFIG?.RegionBehavior?.dataModels?.['modifyMovementCost']?.schema?.fields?.[
      'difficulties'
    ]?.fields;
    return fields !== undefined ? Object.keys(fields) : null;
  }

  extendedTeleport(): boolean {
    return this.generation() >= 14;
  }
}
