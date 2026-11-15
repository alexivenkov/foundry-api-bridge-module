import type {
  CreateMacroCommand,
  DeleteMacroCommand,
  ExecuteMacroCommand,
  GetMacroQuery,
  ListMacrosQuery,
  UpdateMacroCommand
} from '@/core/macros/application';
import type { MacroChanges } from '@/core/macros/domain';
import type {
  CreateMacroRequest,
  DeleteMacroRequest,
  ExecuteMacroRequest,
  GetMacroRequest,
  GetMacrosRequest,
  UpdateMacroRequest
} from './macroSchemas';

type MacroAttributesRequest = Omit<UpdateMacroRequest, 'macroId'>;

function toMacroChanges(request: MacroAttributesRequest): MacroChanges {
  return {
    name: request.name,
    type: request.type,
    command: request.command,
    scope: request.scope,
    img: request.img,
    folderId: request.folder
  };
}

export function toListMacrosQuery(request: GetMacrosRequest): ListMacrosQuery {
  return { type: request.type };
}

export function toGetMacroQuery(request: GetMacroRequest): GetMacroQuery {
  return { macroId: request.macroId };
}

export function toCreateMacroCommand(request: CreateMacroRequest): CreateMacroCommand {
  return { draft: { ...toMacroChanges(request), name: request.name } };
}

export function toUpdateMacroCommand(request: UpdateMacroRequest): UpdateMacroCommand {
  return { macroId: request.macroId, changes: toMacroChanges(request) };
}

export function toDeleteMacroCommand(request: DeleteMacroRequest): DeleteMacroCommand {
  return { macroId: request.macroId };
}

export function toExecuteMacroCommand(request: ExecuteMacroRequest): ExecuteMacroCommand {
  return {
    macroId: request.macroId,
    actorId: request.actorId,
    tokenId: request.tokenId,
    args: request.args
  };
}
