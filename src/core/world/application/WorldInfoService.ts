import type { WorldInfo, WorldInspector } from '@/core/world/domain';

export interface WorldInfoServiceDependencies {
  readonly world: WorldInspector;
}

export class WorldInfoService {
  constructor(private readonly deps: WorldInfoServiceDependencies) {}

  getWorldInfo(): WorldInfo {
    const compendiums = this.deps.world.listCompendiums();
    return {
      identity: this.deps.world.readIdentity(),
      counts: this.deps.world.countDocuments(),
      compendiums
    };
  }
}
