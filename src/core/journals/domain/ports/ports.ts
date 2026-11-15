import type {
  JournalAudience,
  JournalChanges,
  JournalContent,
  JournalDraft,
  JournalIdentity,
  JournalPageChanges,
  JournalPageDraft,
  JournalPageSummary,
  JournalShowTarget,
  JournalSummary
} from '@/core/journals/domain/model/Journal';
import type {
  JournalCategory,
  JournalCategoryChanges,
  JournalCategoryDraft
} from '@/core/journals/domain/model/JournalCategory';
import type { JournalSceneNote, NotePanView, SharedImage } from '@/core/journals/domain/model/JournalSharing';

// Reads are synchronous: the world's journals live in memory. A write resolves
// to null when the journal or page is gone, or when the core created nothing.
export interface JournalStore {
  listJournals(): readonly JournalContent[];
  findJournalContent(journalId: string): JournalContent | null;
  findJournal(journalId: string): JournalIdentity | null;
  findPage(journalId: string, pageId: string): JournalPageSummary | null;
  createJournal(draft: JournalDraft): Promise<JournalSummary | null>;
  updateJournal(journalId: string, changes: JournalChanges): Promise<JournalSummary | null>;
  deleteJournal(journalId: string): Promise<void>;
  createPage(journalId: string, draft: JournalPageDraft): Promise<JournalPageSummary | null>;
  updatePage(journalId: string, pageId: string, changes: JournalPageChanges): Promise<JournalPageSummary | null>;
  deletePage(journalId: string, pageId: string): Promise<void>;
}

export interface JournalPresenter {
  /** Opens the journal or page on the players' screens; resolves to false when it is gone. */
  show(target: JournalShowTarget, audience: JournalAudience): Promise<boolean>;
}

export interface TextEnricher {
  /** Resolves to null when the core offers no enrichment. */
  enrich(html: string): Promise<string | null>;
}

/** The categories of the world's journals. A write resolves to null when the journal or category is gone. */
export interface JournalCategoryStore {
  /** False on a Foundry generation without journal categories. */
  isAvailable(): boolean;
  findCategory(journalId: string, categoryId: string): JournalCategory | null;
  createCategory(journalId: string, draft: JournalCategoryDraft): Promise<JournalCategory | null>;
  updateCategory(journalId: string, categoryId: string, changes: JournalCategoryChanges): Promise<JournalCategory | null>;
  deleteCategory(journalId: string, categoryId: string): Promise<void>;
}

export interface ImageSharer {
  /** False when the core offers no way to share an image. */
  isAvailable(): boolean;
  share(image: SharedImage): Promise<void>;
}

export interface UserDirectory {
  hasUser(userId: string): boolean;
}

export interface JournalNoteNavigator {
  /** The scene the GM's canvas shows; null while the canvas is not ready. */
  viewedSceneId(): string | null;
  /** The journal's first map note on that scene: the one the core pans to. */
  findSceneNote(journalId: string): JournalSceneNote | null;
  panToNote(journalId: string, view: NotePanView): Promise<void>;
}
