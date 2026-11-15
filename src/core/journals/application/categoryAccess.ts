import {
  JOURNAL_CATEGORIES_SINCE_GENERATION,
  JournalCategoryNotFoundError,
  type JournalCategory,
  type JournalCategoryStore
} from '@/core/journals/domain';
import { CoreFeatureUnavailableError } from '@/core/shared';

/** The category store, or the refusal of a Foundry generation without journal categories. */
export function requireCategoryFeature(categories: JournalCategoryStore | undefined): JournalCategoryStore {
  if (categories === undefined || !categories.isAvailable()) {
    throw new CoreFeatureUnavailableError(
      `Journal categories require Foundry ${String(JOURNAL_CATEGORIES_SINCE_GENERATION)} or newer`
    );
  }
  return categories;
}

export function requireCategory(
  categories: JournalCategoryStore,
  journalId: string,
  categoryId: string
): JournalCategory {
  const category = categories.findCategory(journalId, categoryId);
  if (category === null) {
    throw new JournalCategoryNotFoundError(categoryId);
  }
  return category;
}
