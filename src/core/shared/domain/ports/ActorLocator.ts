import type { ActorIdentity } from '@/core/shared/domain/model/ActorTarget';

export interface TargetToken {
  readonly id: string;
  /** The actor the token stands for; null when it stands for none. */
  readonly actor: ActorIdentity | null;
}

// Synchronous by design: world actors and scene tokens live in memory.
export interface ActorLocator {
  findWorldActor(actorId: string): ActorIdentity | null;
  findToken(sceneId: string, tokenId: string): TargetToken | null;
}
