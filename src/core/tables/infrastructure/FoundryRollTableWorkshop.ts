import type { GameProvider } from '@/core/shared';
import type {
  RollTable,
  RollTableEditor,
  RollTableRoller,
  TableDraw,
  TableDrawOptions,
  TableResult,
  TableResultDraft,
  TableResultWrite,
  TableRollOptions
} from '@/core/tables/domain';
import type {
  FoundryRollTableWorkshopCollection,
  FoundryRollTableWorkshopGame,
  FoundryTableDrawOptions,
  TableRollGlobalsProvider
} from './foundryRollTableTypes';
import { toMultipleTableDraw, toRollTable, toTableDraw, toTableResult } from './rollTableMapper';
import { toDrawVisibilityOption } from './tableDrawCodes';
import { toFoundryResultCreateData, toFoundryResultUpdate, type PackDocumentTypeLookup } from './tableResultPayload';

export type RollTableWorkshopGameProvider = GameProvider<FoundryRollTableWorkshopGame>;

export const globalTableRollGlobals: TableRollGlobalsProvider = () =>
  globalThis as unknown as ReturnType<TableRollGlobalsProvider>;

/** Anti-corruption layer for the table operations beyond the original commands: options of a draw, previews, rows, folders. */
export class FoundryRollTableWorkshop implements RollTableRoller, RollTableEditor {
  constructor(
    private readonly gameProvider: RollTableWorkshopGameProvider,
    private readonly rollGlobals: TableRollGlobalsProvider = globalTableRollGlobals
  ) {}

  async draw(tableId: string, displayChat: boolean, options: TableDrawOptions): Promise<TableDraw | null> {
    const document = this.tables().get(tableId);
    if (document === undefined) {
      return null;
    }
    const drawOptions: FoundryTableDrawOptions = {
      displayChat,
      recursive: options.recursive,
      ...this.rollOption(options.formula),
      ...toDrawVisibilityOption(options.visibility)
    };
    if (options.count === 1) {
      return toTableDraw(await document.draw(drawOptions));
    }
    return toMultipleTableDraw(await document.drawMany(options.count, drawOptions));
  }

  async preview(tableId: string, options: TableRollOptions): Promise<TableDraw | null> {
    const document = this.tables().get(tableId);
    if (document === undefined) {
      return null;
    }
    return toTableDraw(await document.roll({ recursive: options.recursive, ...this.rollOption(options.formula) }));
  }

  async normalize(tableId: string): Promise<RollTable | null> {
    const document = this.tables().get(tableId);
    if (document === undefined) {
      return null;
    }
    await document.normalize();
    return toRollTable(document);
  }

  async createFromFolder(folderId: string): Promise<RollTable | null> {
    const game = this.gameProvider.getGame();
    const folder = game.folders.get(folderId);
    if (folder === undefined) {
      return null;
    }
    const created = await game.tables.documentClass.fromFolder(folder, { renderSheet: false });
    return created ? toRollTable(created) : null;
  }

  async createResult(tableId: string, draft: TableResultDraft): Promise<TableResult | null> {
    const document = this.tables().get(tableId);
    if (document === undefined) {
      return null;
    }
    const created = await document.createEmbeddedDocuments('TableResult', [
      toFoundryResultCreateData(draft, this.packDocumentType())
    ]);
    const result = created[0];
    return result ? toTableResult(result) : null;
  }

  async updateResult(tableId: string, resultId: string, write: TableResultWrite): Promise<TableResult | null> {
    const document = this.tables().get(tableId);
    if (document?.results.get(resultId) === undefined) {
      return null;
    }
    await document.updateEmbeddedDocuments('TableResult', [
      toFoundryResultUpdate(resultId, write, this.packDocumentType())
    ]);
    const updated = document.results.get(resultId);
    return updated ? toTableResult(updated) : null;
  }

  async deleteResult(tableId: string, resultId: string): Promise<void> {
    const document = this.tables().get(tableId);
    if (document?.results.get(resultId) !== undefined) {
      await document.deleteEmbeddedDocuments('TableResult', [resultId]);
    }
  }

  /** The core takes a custom formula only as a Roll instance. */
  private rollOption(formula: string | undefined): Pick<FoundryTableDrawOptions, 'roll'> {
    return formula === undefined ? {} : { roll: this.rollGlobals().Roll.create(formula) };
  }

  private packDocumentType(): PackDocumentTypeLookup {
    const packs = this.gameProvider.getGame().packs;
    return (packId) => packs.get(packId)?.documentName;
  }

  private tables(): FoundryRollTableWorkshopCollection {
    return this.gameProvider.getGame().tables;
  }
}
