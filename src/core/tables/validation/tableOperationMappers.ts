import type {
  CreateRollTableFromFolderCommand,
  CreateTableResultCommand,
  DeleteTableResultCommand,
  NormalizeRollTableCommand,
  PreviewTableRollCommand,
  UpdateTableResultCommand
} from '@/core/tables/application';
import type { TableResultReference } from '@/core/tables/domain';
import type {
  CreateRollTableFromFolderRequest,
  CreateTableResultEntryRequest,
  DeleteTableResultRequest,
  NormalizeRollTableRequest,
  PreviewTableRollRequest,
  UpdateTableResultRequest
} from './tableOperationSchemas';
import { tableResultKindFromWireCode } from './tableResultWireCodes';

const DEFAULT_RESULT_WEIGHT = 1;

export function toPreviewTableRollCommand(request: PreviewTableRollRequest): PreviewTableRollCommand {
  return { tableId: request.tableId, options: { formula: request.formula, recursive: request.recursive ?? true } };
}

export function toNormalizeRollTableCommand(request: NormalizeRollTableRequest): NormalizeRollTableCommand {
  return { tableId: request.tableId };
}

export function toCreateRollTableFromFolderCommand(
  request: CreateRollTableFromFolderRequest
): CreateRollTableFromFolderCommand {
  return { folderId: request.folderId };
}

export function toCreateTableResultCommand(request: CreateTableResultEntryRequest): CreateTableResultCommand {
  return {
    tableId: request.tableId,
    draft: {
      kind: tableResultKindFromWireCode(request.type),
      text: request.text,
      range: request.range,
      weight: request.weight ?? DEFAULT_RESULT_WEIGHT,
      img: request.img,
      documentCollection: request.documentCollection,
      documentId: request.documentId
    }
  };
}

/** The schema lets the two reference fields through only together: both strings or both null. */
function toReferenceChange(request: UpdateTableResultRequest): TableResultReference | null | undefined {
  const { documentCollection: collection, documentId: id } = request;
  if (typeof collection === 'string' && typeof id === 'string') {
    return { collection, id };
  }
  return collection === null ? null : undefined;
}

export function toUpdateTableResultCommand(request: UpdateTableResultRequest): UpdateTableResultCommand {
  return {
    tableId: request.tableId,
    resultId: request.resultId,
    changes: {
      kind: request.type === undefined ? undefined : tableResultKindFromWireCode(request.type),
      text: request.text,
      range: request.range,
      weight: request.weight,
      drawn: request.drawn,
      img: request.img,
      reference: toReferenceChange(request)
    }
  };
}

export function toDeleteTableResultCommand(request: DeleteTableResultRequest): DeleteTableResultCommand {
  return { tableId: request.tableId, resultId: request.resultId };
}
