import { foundryGeneration } from '@/compat/foundryVersion';
import {
  JOURNAL_CATEGORIES_SINCE_GENERATION,
  type JournalCategory,
  type JournalCategoryChanges,
  type JournalCategoryDraft,
  type JournalCategoryStore
} from '@/core/journals/domain';
import type { FoundryJournalCategories, FoundryJournalCategory } from './foundryJournalCategoryTypes';
import type { FoundryJournalEntry, JournalGlobalsProvider } from './foundryJournalTypes';
import { toFoundryCategoryData, toFoundryCategoryUpdate, toJournalCategory } from './journalMapper';

const CATEGORY_DOCUMENT = 'JournalEntryCategory';
// CONST.SORT_INTEGER_DENSITY (13.351, 14.368): the step the category editor puts between categories.
const SORT_STEP = 100000;

/** Anti-corruption layer over the JournalEntryCategory documents embedded in the world's journals (Foundry 13+). */
export class FoundryJournalCategoryStore implements JournalCategoryStore {
  constructor(
    private readonly globals: JournalGlobalsProvider,
    private readonly generation: () => number = foundryGeneration
  ) {}

  isAvailable(): boolean {
    return this.generation() >= JOURNAL_CATEGORIES_SINCE_GENERATION;
  }

  findCategory(journalId: string, categoryId: string): JournalCategory | null {
    const category = this.findCategories(journalId)?.get(categoryId);
    return category !== undefined ? toJournalCategory(category) : null;
  }

  async createCategory(journalId: string, draft: JournalCategoryDraft): Promise<JournalCategory | null> {
    const entry = this.findEntry(journalId);
    if (entry?.categories === undefined) {
      return null;
    }
    const sort = draft.sort ?? nextSort(entry.categories);
    const created = await entry.createEmbeddedDocuments(CATEGORY_DOCUMENT, [toFoundryCategoryData(draft.name, sort)]);
    const category = created[0];
    return category !== undefined ? toJournalCategory(category) : null;
  }

  async updateCategory(
    journalId: string,
    categoryId: string,
    changes: JournalCategoryChanges
  ): Promise<JournalCategory | null> {
    const category = this.findCategories(journalId)?.get(categoryId);
    if (category === undefined) {
      return null;
    }
    await category.update(toFoundryCategoryUpdate(changes));
    return toJournalCategory(category);
  }

  // The core leaves the pages of a deleted category pointing at it; the journal
  // sheet, and this context's page reading, list them as uncategorized.
  async deleteCategory(journalId: string, categoryId: string): Promise<void> {
    await this.findEntry(journalId)?.deleteEmbeddedDocuments(CATEGORY_DOCUMENT, [categoryId]);
  }

  private findEntry(journalId: string): FoundryJournalEntry | undefined {
    return this.globals().game.journal?.get(journalId);
  }

  private findCategories(journalId: string): FoundryJournalCategories | undefined {
    return this.findEntry(journalId)?.categories;
  }
}

/** After the journal's last category. */
function nextSort(categories: FoundryJournalCategories): number {
  let last: number | undefined;
  categories.forEach((category: FoundryJournalCategory) => {
    last = last === undefined ? category.sort : Math.max(last, category.sort);
  });
  return (last ?? 0) + SORT_STEP;
}
