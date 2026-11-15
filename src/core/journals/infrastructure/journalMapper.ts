import type {
  JournalAudience,
  JournalCategory,
  JournalChanges,
  JournalContent,
  JournalDraft,
  JournalIdentity,
  JournalPageChanges,
  JournalPageContent,
  JournalPageDraft,
  JournalPageLayout,
  JournalPageOptions,
  JournalPageSummary,
  JournalSummary
} from '@/core/journals/domain';
import type { FoundryJournalCategories, FoundryJournalCategory } from './foundryJournalCategoryTypes';
import type { FoundryJournalEntry, FoundryJournalPage, FoundryJournalShowOptions } from './foundryJournalTypes';
import { fromFoundryPageFormat, toFoundryPageFormat } from './pageFormatCodes';

/** The ids of an entry's categories; undefined where the generation has no categories. */
export type CategoryIndex = ReadonlySet<string> | undefined;

export function toJournalIdentity(entry: FoundryJournalEntry): JournalIdentity {
  return { id: entry.id, name: entry.name };
}

export function toPageSummary(page: FoundryJournalPage): JournalPageSummary {
  return { id: page.id, name: page.name, type: page.type };
}

type LayoutSource = Pick<FoundryJournalPage, 'src' | 'text' | 'title' | 'image' | 'video' | 'sort' | 'category'>;

// The schema gives every page of a world its title, image and video settings;
// an object without them is not a page this reading applies to. The stored
// loop / autoplay flags and timestamp / dimensions are undefined until set,
// and the core treats an unset flag as off.
export function readPageLayout(page: LayoutSource, categories: CategoryIndex): JournalPageLayout | undefined {
  const { title, image, video } = page;
  if (title === undefined || image === undefined || video === undefined) {
    return undefined;
  }
  const layout: JournalPageLayout = {
    src: page.src ?? null,
    caption: image.caption ?? null,
    format: fromFoundryPageFormat(page.text.format),
    title: { show: title.show ?? true, level: title.level ?? 1 },
    sort: page.sort ?? 0,
    video: {
      controls: video.controls ?? true,
      loop: video.loop ?? false,
      autoplay: video.autoplay ?? false,
      volume: video.volume ?? 0.5,
      timestamp: video.timestamp ?? null,
      width: video.width ?? null,
      height: video.height ?? null
    }
  };
  if (categories === undefined) {
    return layout;
  }
  // The journal sheet lists a page whose category is gone as uncategorized.
  const category = page.category ?? null;
  return { ...layout, categoryId: category !== null && categories.has(category) ? category : null };
}

/** A page as its own write commands report it: what it is and how it is shown and filed. */
export function toPageDetail(page: FoundryJournalPage, categories: CategoryIndex): JournalPageSummary {
  return { ...toPageSummary(page), layout: readPageLayout(page, categories) };
}

export function toJournalCategory(category: FoundryJournalCategory): JournalCategory {
  return { id: category.id, name: category.name, sort: category.sort };
}

/** In the order the journal sheet lists them (`JournalEntry.sortCategories`). */
export function toJournalCategories(categories: FoundryJournalCategories): JournalCategory[] {
  const list: JournalCategory[] = [];
  categories.forEach((category) => {
    list.push(toJournalCategory(category));
  });
  return list.sort((a, b) => a.sort - b.sort);
}

export function toCategoryIndex(categories: FoundryJournalCategories): ReadonlySet<string> {
  const ids = new Set<string>();
  categories.forEach((category) => {
    ids.add(category.id);
  });
  return ids;
}

// Pages are walked with `map` here and with `forEach` in toJournalContent:
// each is what its commands have always called on the collection.
export function toJournalSummary(entry: FoundryJournalEntry): JournalSummary {
  return {
    id: entry.id,
    name: entry.name,
    folderId: entry.folder?.id ?? null,
    pages: entry.pages.map(toPageSummary)
  };
}

// The read commands have always coerced a page's id and type to strings, so
// they take a page whose id or type is not one yet. The write commands report
// both as stored.
type ReadablePage = LayoutSource & Pick<FoundryJournalPage, 'name'> & {
  id: string | number;
  type: string | number;
};

export function toPageContent(page: ReadablePage, categories?: CategoryIndex): JournalPageContent {
  return {
    id: String(page.id),
    name: page.name,
    type: String(page.type),
    text: page.text.content ?? null,
    markdown: page.text.markdown ?? null,
    src: page.src ?? null,
    layout: readPageLayout(page, categories)
  };
}

export function toJournalContent(entry: FoundryJournalEntry, categories?: CategoryIndex): JournalContent {
  const pages: JournalPageContent[] = [];
  entry.pages.forEach((page) => {
    pages.push(toPageContent(page, categories));
  });

  return {
    id: entry.id,
    uuid: entry.uuid,
    name: entry.name,
    folderName: entry.folder?.name ?? null,
    pages,
    categories: categories !== undefined && entry.categories !== undefined ? toJournalCategories(entry.categories) : undefined
  };
}

// Text content, markdown source and format share `text`; the server renders a
// markdown page's content from its source on create and on every text update.
function toFoundryText(
  content: string | null | undefined,
  options: JournalPageOptions
): Record<string, unknown> | undefined {
  const text: Record<string, unknown> = {};
  if (content !== undefined) {
    text['content'] = content;
  }
  if (options.format !== undefined) {
    text['format'] = toFoundryPageFormat(options.format);
  }
  if (options.markdown !== undefined) {
    text['markdown'] = options.markdown;
  }
  return Object.keys(text).length > 0 ? text : undefined;
}

function definedEntries(source: object): Record<string, unknown> | undefined {
  const entries = Object.entries(source).filter(([, value]) => value !== undefined);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** A nested setting is sent with only the keys given, so an update merges into what is stored. */
function writePageOptions(data: Record<string, unknown>, content: string | null | undefined, options: JournalPageOptions): void {
  const text = toFoundryText(content, options);
  if (text !== undefined) {
    data['text'] = text;
  }
  if (options.caption !== undefined) {
    data['image'] = { caption: options.caption };
  }
  const title = options.title !== undefined ? definedEntries(options.title) : undefined;
  if (title !== undefined) {
    data['title'] = title;
  }
  const video = options.video !== undefined ? definedEntries(options.video) : undefined;
  if (video !== undefined) {
    data['video'] = video;
  }
  if (options.sort !== undefined) {
    data['sort'] = options.sort;
  }
  if (options.categoryId !== undefined) {
    data['category'] = options.categoryId;
  }
}

/** Only what is set becomes a document field. Text content goes to `text.content`. */
export function toFoundryPageData(draft: JournalPageDraft): Record<string, unknown> {
  const data: Record<string, unknown> = { name: draft.name, type: draft.type };
  if (draft.src !== undefined) {
    data['src'] = draft.src;
  }
  writePageOptions(data, draft.text, draft);
  return data;
}

export function toFoundryJournalData(draft: JournalDraft): Record<string, unknown> {
  const data: Record<string, unknown> = { name: draft.name };
  if (draft.folderId !== undefined) {
    data['folder'] = draft.folderId;
  }
  if (draft.firstPage !== undefined) {
    data['pages'] = [toFoundryPageData(draft.firstPage)];
  }
  return data;
}

export function toFoundryJournalUpdate(changes: JournalChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (changes.name !== undefined) {
    data['name'] = changes.name;
  }
  if (changes.folderId !== undefined) {
    data['folder'] = changes.folderId;
  }
  return data;
}

export function toFoundryPageUpdate(changes: JournalPageChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (changes.name !== undefined) {
    data['name'] = changes.name;
  }
  if (changes.src !== undefined) {
    data['src'] = changes.src;
  }
  writePageOptions(data, changes.text, changes);
  return data;
}

export function toFoundryCategoryData(name: string, sort: number): Record<string, unknown> {
  return { name, sort };
}

export function toFoundryCategoryUpdate(changes: { name?: string | undefined; sort?: number | undefined }): Record<string, unknown> {
  return definedEntries(changes) ?? {};
}

/** `force` is sent only when set, so the core's own default applies otherwise. */
export function toFoundryShowOptions(audience: JournalAudience): FoundryJournalShowOptions {
  const options: FoundryJournalShowOptions = {};
  if (audience.force) {
    options.force = true;
  }
  if (audience.users !== undefined) {
    options.users = audience.users;
  }
  return options;
}
