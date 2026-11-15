import type { ActorTarget } from '@/core/shared';
import type { ActorChanges, ActorDraft } from '@/core/actors/domain';

export interface GetActorQuery {
  readonly actorId: string;
}

export interface CreateActorCommand {
  readonly draft: ActorDraft;
}

export interface UpdateActorCommand {
  readonly target: ActorTarget;
  readonly changes: ActorChanges;
}

export interface DeleteActorCommand {
  readonly actorId: string;
}
