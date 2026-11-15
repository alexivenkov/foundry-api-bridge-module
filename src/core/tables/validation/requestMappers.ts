import type {
  CreateRollTableCommand,
  DeleteRollTableCommand,
  GetRollTableQuery,
  ResetTableCommand,
  RollOnTableCommand,
  UpdateRollTableCommand
} from '@/core/tables/application';
import type { TableDrawOptions, TableResultDraft } from '@/core/tables/domain';
import type {
  CreateRollTableRequest,
  CreateTableResultRequest,
  DeleteRollTableRequest,
  GetRollTableRequest,
  ResetTableRequest,
  RollOnTableRequest,
  UpdateRollTableRequest
} from './rollTableSchemas';
import { tableResultKindFromWireCode } from './tableResultWireCodes';

const DEFAULT_FORMULA = '1d20';
const DEFAULT_RESULT_WEIGHT = 1;

function toTableResultDraft(request: CreateTableResultRequest): TableResultDraft {
  return {
    kind: tableResultKindFromWireCode(request.type),
    text: request.text,
    range: request.range,
    weight: request.weight ?? DEFAULT_RESULT_WEIGHT,
    img: request.img,
    documentCollection: request.documentCollection,
    documentId: request.documentId
  };
}

export function toGetRollTableQuery(request: GetRollTableRequest): GetRollTableQuery {
  return { tableId: request.tableId };
}

/** Absent when the request uses none of the draw options, so the draw stays the plain one. */
function toDrawOptions(request: RollOnTableRequest): TableDrawOptions | undefined {
  const { count, visibility, recursive, formula } = request;
  if (count === undefined && visibility === undefined && recursive === undefined && formula === undefined) {
    return undefined;
  }
  return { count: count ?? 1, visibility, recursive: recursive ?? true, formula };
}

export function toRollOnTableCommand(request: RollOnTableRequest): RollOnTableCommand {
  const command = { tableId: request.tableId, displayChat: request.displayChat ?? true };
  const options = toDrawOptions(request);
  return options === undefined ? command : { ...command, options };
}

export function toResetTableCommand(request: ResetTableRequest): ResetTableCommand {
  return { tableId: request.tableId };
}

export function toCreateRollTableCommand(request: CreateRollTableRequest): CreateRollTableCommand {
  return {
    draft: {
      name: request.name,
      formula: request.formula ?? DEFAULT_FORMULA,
      replacement: request.replacement ?? true,
      displayRoll: request.displayRoll ?? true,
      description: request.description,
      img: request.img,
      folderId: request.folder,
      results: request.results?.map(toTableResultDraft)
    }
  };
}

export function toUpdateRollTableCommand(request: UpdateRollTableRequest): UpdateRollTableCommand {
  return {
    tableId: request.tableId,
    changes: {
      name: request.name,
      formula: request.formula,
      replacement: request.replacement,
      displayRoll: request.displayRoll,
      description: request.description,
      img: request.img,
      folderId: request.folderId
    }
  };
}

export function toDeleteRollTableCommand(request: DeleteRollTableRequest): DeleteRollTableCommand {
  return { tableId: request.tableId };
}
