import type {
  ImageSharer,
  JournalCategory,
  JournalCategoryChanges,
  JournalCategoryDraft,
  JournalCategoryStore,
  JournalNoteNavigator,
  JournalSceneNote,
  NotePanView,
  SharedImage,
  UserDirectory
} from '../../domain';

export class FakeJournalCategoryStore implements JournalCategoryStore {
  readonly created: Array<{ journalId: string; draft: JournalCategoryDraft }> = [];
  readonly updated: Array<{ journalId: string; categoryId: string; changes: JournalCategoryChanges }> = [];
  readonly deleted: Array<{ journalId: string; categoryId: string }> = [];
  available = true;
  createsNothing = false;
  losesCategoryOnUpdate = false;

  /** Categories by journal id. */
  constructor(private readonly categories: Record<string, readonly JournalCategory[]> = {}) {}

  isAvailable(): boolean {
    return this.available;
  }

  findCategory(journalId: string, categoryId: string): JournalCategory | null {
    return this.categories[journalId]?.find((category) => category.id === categoryId) ?? null;
  }

  createCategory(journalId: string, draft: JournalCategoryDraft): Promise<JournalCategory | null> {
    this.created.push({ journalId, draft });
    return Promise.resolve(this.createsNothing ? null : { id: 'new-cat', name: draft.name, sort: draft.sort ?? 100000 });
  }

  updateCategory(journalId: string, categoryId: string, changes: JournalCategoryChanges): Promise<JournalCategory | null> {
    this.updated.push({ journalId, categoryId, changes });
    const found = this.findCategory(journalId, categoryId);
    if (found === null || this.losesCategoryOnUpdate) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ ...found, name: changes.name ?? found.name, sort: changes.sort ?? found.sort });
  }

  deleteCategory(journalId: string, categoryId: string): Promise<void> {
    this.deleted.push({ journalId, categoryId });
    return Promise.resolve();
  }
}

export class FakeImageSharer implements ImageSharer {
  readonly shared: SharedImage[] = [];
  available = true;

  isAvailable(): boolean {
    return this.available;
  }

  share(image: SharedImage): Promise<void> {
    this.shared.push(image);
    return Promise.resolve();
  }
}

export class FakeUserDirectory implements UserDirectory {
  constructor(private readonly userIds: readonly string[] = []) {}

  hasUser(userId: string): boolean {
    return this.userIds.includes(userId);
  }
}

export class FakeNoteNavigator implements JournalNoteNavigator {
  readonly panned: Array<{ journalId: string; view: NotePanView }> = [];

  /** `sceneId` null: the canvas is not ready. Notes by journal id. */
  constructor(
    private readonly sceneId: string | null = 'scene-1',
    private readonly notes: Record<string, JournalSceneNote> = {}
  ) {}

  viewedSceneId(): string | null {
    return this.sceneId;
  }

  findSceneNote(journalId: string): JournalSceneNote | null {
    return this.notes[journalId] ?? null;
  }

  panToNote(journalId: string, view: NotePanView): Promise<void> {
    this.panned.push({ journalId, view });
    return Promise.resolve();
  }
}
