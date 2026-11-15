export { TABLE_RESULT_KINDS } from './model/RollTable';
export type {
  ResultRange,
  RollTable,
  RollTableChanges,
  RollTableDraft,
  RollTableOverview,
  TableDraw,
  TableResult,
  TableResultDraft,
  TableResultKind,
  TableRoll
} from './model/RollTable';
export { TABLE_DRAW_VISIBILITIES, TABLE_LINKABLE_DOCUMENT_TYPES } from './model/TableOperations';
export type {
  TableDrawOptions,
  TableDrawVisibility,
  TableFolder,
  TableResultChanges,
  TableResultReference,
  TableResultWrite,
  TableRollOptions
} from './model/TableOperations';
export { RollTableNotFoundError } from './errors/RollTableNotFoundError';
export { RollTableCreationCancelledError } from './errors/RollTableCreationCancelledError';
export {
  EmptyFolderError,
  EmptyRollTableError,
  NotARollTableFolderError,
  TableDrawCountError,
  TableFolderNotFoundError,
  TableFormulaError,
  TableResultCreationFailedError,
  TableResultNotFoundError,
  TableResultReferenceError,
  UndrawableFolderError
} from './errors/tableOperationErrors';
export {
  MAX_TABLE_DRAWS,
  MAX_TABLE_FORMULA_DICE,
  MAX_TABLE_FORMULA_LENGTH,
  assertDrawCount,
  assertFormulaDice,
  assertReferenceScope,
  assertRollTableFolder,
  assertTableSourceFolder,
  draftReference,
  isLinkableDocumentType,
  parseTableFormula,
  resolveResultChange
} from './rules/tableOperationRules';
export type { ResolvedResultChange, TableReferenceScope } from './rules/tableOperationRules';
export type { RollTableStore } from './ports/RollTableStore';
export type {
  RollTableEditor,
  RollTableFolders,
  RollTableRoller,
  TableCompendiums,
  TableRollFormulas
} from './ports/RollTableOperations';
