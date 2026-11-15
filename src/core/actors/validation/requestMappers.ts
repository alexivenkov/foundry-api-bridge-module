import { readActorTarget } from '@/core/shared';
import type {
  CreateActorCommand,
  DeleteActorCommand,
  GetActorQuery,
  UpdateActorCommand
} from '@/core/actors/application';
import type {
  CreateActorRequest,
  DeleteActorRequest,
  GetActorRequest,
  UpdateActorRequest
} from './actorSchemas';

export function toGetActorQuery(request: GetActorRequest): GetActorQuery {
  return { actorId: request.actorId };
}

export function toCreateActorCommand(request: CreateActorRequest): CreateActorCommand {
  return {
    draft: {
      name: request.name,
      type: request.type,
      folderId: request.folder,
      img: request.img,
      system: request.system
    }
  };
}

export function toUpdateActorCommand(request: UpdateActorRequest): UpdateActorCommand {
  return {
    target: readActorTarget(request),
    changes: {
      name: request.name,
      img: request.img,
      folderId: request.folder,
      system: request.system
    }
  };
}

export function toDeleteActorCommand(request: DeleteActorRequest): DeleteActorCommand {
  return { actorId: request.actorId };
}
