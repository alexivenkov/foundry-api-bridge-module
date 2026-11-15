import type { WorldSession } from '@/core/world/domain/model/WorldSession';

/** Everything here is in memory, so the read is synchronous. */
export interface WorldSessionInspector {
  readSession(): WorldSession;
}
