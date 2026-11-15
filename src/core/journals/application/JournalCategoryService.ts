import {
  JournalCategoryCreationFailedError,
  JournalCategoryNotFoundError,
  JournalNotFoundError,
  type JournalCategory,
  type JournalCategoryStore,
  type JournalStore
} from '@/core/journals/domain';
import type {
  CreateJournalCategoryCommand,
  DeleteJournalCategoryCommand,
  UpdateJournalCategoryCommand
} from './commands';
import { requireCategory, requireCategoryFeature } from './categoryAccess';

export interface JournalCategoryServiceDependencies {
  readonly journals: JournalStore;
  readonly categories: JournalCategoryStore;
}

/** The categories of a journal entry (Foundry 13+). */
export class JournalCategoryService {
  constructor(private readonly deps: JournalCategoryServiceDependencies) {}

  async createCategory(command: CreateJournalCategoryCommand): Promise<JournalCategory> {
    const categories = this.requireJournalCategories(command.journalId);
    const created = await categories.createCategory(command.journalId, command.draft);
    if (created === null) {
      throw new JournalCategoryCreationFailedError();
    }
    return created;
  }

  async updateCategory(command: UpdateJournalCategoryCommand): Promise<JournalCategory> {
    const categories = this.requireJournalCategories(command.journalId);
    requireCategory(categories, command.journalId, command.categoryId);
    const updated = await categories.updateCategory(command.journalId, command.categoryId, command.changes);
    if (updated === null) {
      throw new JournalCategoryNotFoundError(command.categoryId);
    }
    return updated;
  }

  async deleteCategory(command: DeleteJournalCategoryCommand): Promise<void> {
    const categories = this.requireJournalCategories(command.journalId);
    requireCategory(categories, command.journalId, command.categoryId);
    await categories.deleteCategory(command.journalId, command.categoryId);
  }

  private requireJournalCategories(journalId: string): JournalCategoryStore {
    const categories = requireCategoryFeature(this.deps.categories);
    if (this.deps.journals.findJournal(journalId) === null) {
      throw new JournalNotFoundError(journalId);
    }
    return categories;
  }
}
