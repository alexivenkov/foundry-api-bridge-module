import type { GameProvider } from '@/core/shared';
import type { RollTableFolders, TableCompendiums, TableFolder, TableRollFormulas } from '@/core/tables/domain';
import type { FoundryRollTableWorkshopGame, TableRollGlobalsProvider } from './foundryRollTableTypes';

type LookupGameProvider = GameProvider<Pick<FoundryRollTableWorkshopGame, 'folders' | 'packs'>>;

/** The world's folders and installed packs, as far as a roll table needs them. */
export class FoundryTableLookups implements RollTableFolders, TableCompendiums {
  constructor(private readonly gameProvider: LookupGameProvider) {}

  findFolder(folderId: string): TableFolder | null {
    const folder = this.gameProvider.getGame().folders.get(folderId);
    if (folder === undefined) {
      return null;
    }
    return { id: folder.id, name: folder.name, type: folder.type, documentCount: folder.contents.length };
  }

  hasPack(packId: string): boolean {
    return this.gameProvider.getGame().packs.get(packId) !== undefined;
  }
}

/** The core's `Roll.validate` and parser (13.351 and 14.368). */
export class FoundryTableRollFormulas implements TableRollFormulas {
  constructor(private readonly globals: TableRollGlobalsProvider) {}

  isValid(formula: string): boolean {
    return this.globals().Roll.validate(formula);
  }

  countDice(formula: string): number {
    const { Roll } = this.globals();
    return (new Roll(formula).dice ?? []).reduce((sum, term) => {
      const count = term.number;
      return sum + (typeof count === 'number' && Number.isFinite(count) ? count : 1);
    }, 0);
  }
}
