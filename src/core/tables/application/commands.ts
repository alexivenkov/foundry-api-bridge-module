import type {
  RollTableChanges,
  RollTableDraft,
  TableDrawOptions,
  TableResultChanges,
  TableResultDraft,
  TableRollOptions
} from '@/core/tables/domain';

export interface GetRollTableQuery {
  readonly tableId: string;
}

export interface RollOnTableCommand {
  readonly tableId: string;
  readonly displayChat: boolean;
  /** Absent: one plain draw with the table's own formula, as the command always did. */
  readonly options?: TableDrawOptions | undefined;
}

export interface ResetTableCommand {
  readonly tableId: string;
}

export interface CreateRollTableCommand {
  readonly draft: RollTableDraft;
}

export interface UpdateRollTableCommand {
  readonly tableId: string;
  readonly changes: RollTableChanges;
}

export interface DeleteRollTableCommand {
  readonly tableId: string;
}

export interface PreviewTableRollCommand {
  readonly tableId: string;
  readonly options: TableRollOptions;
}

export interface NormalizeRollTableCommand {
  readonly tableId: string;
}

export interface CreateRollTableFromFolderCommand {
  readonly folderId: string;
}

export interface CreateTableResultCommand {
  readonly tableId: string;
  readonly draft: TableResultDraft;
}

export interface UpdateTableResultCommand {
  readonly tableId: string;
  readonly resultId: string;
  readonly changes: TableResultChanges;
}

export interface DeleteTableResultCommand {
  readonly tableId: string;
  readonly resultId: string;
}
