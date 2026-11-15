import type { WorldSession, WorldSessionInspector } from '@/core/world/domain';

export interface WorldSessionServiceDependencies {
  readonly session: WorldSessionInspector;
}

/** The live state `get-world-info` adds to the world's identity: modules, scene, users, pause, clock. */
export class WorldSessionService {
  constructor(private readonly deps: WorldSessionServiceDependencies) {}

  getSession(): WorldSession {
    return this.deps.session.readSession();
  }
}
