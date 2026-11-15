import {
  EmptyRollTableError,
  RollTableCreationCancelledError,
  RollTableNotFoundError,
  TableFormulaError,
  TableResultCreationFailedError,
  TableResultNotFoundError,
  assertDrawCount,
  assertFormulaDice,
  assertReferenceScope,
  assertRollTableFolder,
  assertTableSourceFolder,
  draftReference,
  isLinkableDocumentType,
  parseTableFormula,
  resolveResultChange,
  type RollTable,
  type RollTableEditor,
  type RollTableFolders,
  type RollTableOverview,
  type RollTableRoller,
  type RollTableStore,
  type TableCompendiums,
  type TableDrawOptions,
  type TableResult,
  type TableResultKind,
  type TableResultReference,
  type TableRollFormulas,
  type TableRollOptions
} from '@/core/tables/domain';
import { RollTableService, type TableDrawResult } from './RollTableService';
import type {
  CreateRollTableFromFolderCommand,
  CreateTableResultCommand,
  DeleteTableResultCommand,
  NormalizeRollTableCommand,
  PreviewTableRollCommand,
  RollOnTableCommand,
  UpdateRollTableCommand,
  UpdateTableResultCommand
} from './commands';

export interface RollTableManagementDependencies {
  readonly tables: RollTableStore;
  readonly roller: RollTableRoller;
  readonly editor: RollTableEditor;
  readonly folders: RollTableFolders;
  readonly formulas: TableRollFormulas;
  readonly compendiums: TableCompendiums;
}

/**
 * The table use cases beyond the original commands, and the two original ones
 * they extend: a draw with options and an update that moves the table to a
 * folder. Without the new options those run unchanged through RollTableService.
 */
export class RollTableManagementService {
  private readonly basic: RollTableService;

  constructor(private readonly deps: RollTableManagementDependencies) {
    this.basic = new RollTableService({ tables: deps.tables });
  }

  async rollOnTable(command: RollOnTableCommand): Promise<TableDrawResult> {
    if (command.options === undefined) {
      return this.basic.rollOnTable(command);
    }
    const table = this.requireOverview(command.tableId);
    const options = this.checkDrawOptions(command.options);
    const draw = await this.deps.roller.draw(command.tableId, command.displayChat, options);
    if (draw === null) {
      throw new RollTableNotFoundError(command.tableId);
    }
    return { table, draw };
  }

  async previewRoll(command: PreviewTableRollCommand): Promise<TableDrawResult> {
    const table = this.requireOverview(command.tableId);
    const options = this.checkRollOptions(command.options);
    const draw = await this.deps.roller.preview(command.tableId, options);
    if (draw === null) {
      throw new RollTableNotFoundError(command.tableId);
    }
    return { table, draw };
  }

  async updateTable(command: UpdateRollTableCommand): Promise<RollTable> {
    const folderId = command.changes.folderId;
    if (typeof folderId === 'string') {
      this.requireOverview(command.tableId);
      assertRollTableFolder(this.deps.folders.findFolder(folderId), folderId);
    }
    return this.basic.updateTable(command);
  }

  async normalizeTable(command: NormalizeRollTableCommand): Promise<RollTable> {
    const table = this.requireTable(command.tableId);
    if (table.results.length === 0) {
      throw new EmptyRollTableError(command.tableId);
    }
    const normalized = await this.deps.editor.normalize(command.tableId);
    if (normalized === null) {
      throw new RollTableNotFoundError(command.tableId);
    }
    return normalized;
  }

  async createFromFolder(command: CreateRollTableFromFolderCommand): Promise<RollTable> {
    assertTableSourceFolder(this.deps.folders.findFolder(command.folderId), command.folderId);
    const table = await this.deps.editor.createFromFolder(command.folderId);
    if (table === null) {
      throw new RollTableCreationCancelledError();
    }
    return table;
  }

  async createResult(command: CreateTableResultCommand): Promise<TableResult> {
    this.requireOverview(command.tableId);
    const reference = draftReference(command.draft);
    if (reference !== null) {
      this.checkReference(command.draft.kind, reference);
    }
    const result = await this.deps.editor.createResult(command.tableId, command.draft);
    if (result === null) {
      throw new TableResultCreationFailedError();
    }
    return result;
  }

  async updateResult(command: UpdateTableResultCommand): Promise<TableResult> {
    const current = this.requireResult(command.tableId, command.resultId);
    const resolved = resolveResultChange(current, command.changes);
    if (resolved.referenceToCheck && resolved.reference !== null) {
      this.checkReference(resolved.write.kind, resolved.reference);
    }
    const updated = await this.deps.editor.updateResult(command.tableId, command.resultId, resolved.write);
    if (updated === null) {
      throw new TableResultNotFoundError(command.tableId, command.resultId);
    }
    return updated;
  }

  async deleteResult(command: DeleteTableResultCommand): Promise<void> {
    this.requireResult(command.tableId, command.resultId);
    await this.deps.editor.deleteResult(command.tableId, command.resultId);
  }

  private checkDrawOptions(options: TableDrawOptions): TableDrawOptions {
    assertDrawCount(options.count);
    return { ...options, formula: this.checkFormula(options.formula) };
  }

  private checkRollOptions(options: TableRollOptions): TableRollOptions {
    return { ...options, formula: this.checkFormula(options.formula) };
  }

  private checkFormula(raw: string | undefined): string | undefined {
    if (raw === undefined) {
      return undefined;
    }
    const formula = parseTableFormula(raw);
    if (!this.deps.formulas.isValid(formula)) {
      throw new TableFormulaError('Foundry cannot parse or evaluate it');
    }
    assertFormulaDice(this.deps.formulas.countDice(formula));
    return formula;
  }

  private checkReference(kind: TableResultKind, reference: TableResultReference): void {
    const scope = isLinkableDocumentType(reference.collection)
      ? 'world'
      : this.deps.compendiums.hasPack(reference.collection)
        ? 'compendium'
        : null;
    assertReferenceScope(kind, reference, scope);
  }

  private requireOverview(tableId: string): RollTableOverview {
    const table = this.deps.tables.findOverview(tableId);
    if (table === null) {
      throw new RollTableNotFoundError(tableId);
    }
    return table;
  }

  private requireTable(tableId: string): RollTable {
    const table = this.deps.tables.findTable(tableId);
    if (table === null) {
      throw new RollTableNotFoundError(tableId);
    }
    return table;
  }

  private requireResult(tableId: string, resultId: string): TableResult {
    const result = this.requireTable(tableId).results.find((candidate) => candidate.id === resultId);
    if (result === undefined) {
      throw new TableResultNotFoundError(tableId, resultId);
    }
    return result;
  }
}
