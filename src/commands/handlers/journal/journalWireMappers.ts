import type {
  JournalCategoryResult,
  JournalCategorySummary,
  JournalDetailData,
  JournalPageDetailData,
  JournalPageDetailResult,
  JournalPageLayoutFields,
  JournalPageResult,
  JournalResult,
  JournalSearchMatch as WireJournalSearchMatch,
  SearchJournalsResult
} from '@/commands/types';
import type {
  FoundryGenerationReader,
  JournalCategory,
  JournalGlobalsProvider,
  JournalPageLayout,
  JournalPageSummary,
  JournalPageView,
  JournalSearchOutcome,
  JournalSummary,
  JournalView
} from '@/core/journals';
import type { JournalData, JournalPageData } from '@/types/foundry';

export interface JournalHandlerDependencies {
  globals?: JournalGlobalsProvider;
  generation?: FoundryGenerationReader;
}

export function toWireJournalPageResult(page: JournalPageSummary): JournalPageResult {
  return { id: page.id, name: page.name, type: page.type };
}

/** The write commands report a journal's folder by id. */
export function toWireJournalResult(journal: JournalSummary): JournalResult {
  return {
    id: journal.id,
    name: journal.name,
    folder: journal.folderId,
    pages: journal.pages.map(toWireJournalPageResult)
  };
}

function toWireJournalPageData(page: JournalPageView): JournalPageData {
  return {
    id: page.id,
    name: page.name,
    type: page.type,
    text: page.text,
    markdown: page.markdown,
    enrichedText: page.enrichedText,
    src: page.src
  };
}

/** The read commands report a journal's folder by name. */
export function toWireJournalData(journal: JournalView): JournalData {
  return {
    id: journal.id,
    uuid: journal.uuid,
    name: journal.name,
    folder: journal.folderName,
    pages: journal.pages.map(toWireJournalPageData)
  };
}

function toWireLayoutFields(layout: JournalPageLayout): JournalPageLayoutFields {
  const fields: JournalPageLayoutFields = {
    caption: layout.caption,
    format: layout.format,
    title: { ...layout.title },
    sort: layout.sort,
    video: { ...layout.video }
  };
  if (layout.categoryId !== undefined) {
    fields.categoryId = layout.categoryId;
  }
  return fields;
}

/** A page as create-journal-page / update-journal-page report it: the summary plus its layout. */
export function toWireJournalPageDetail(page: JournalPageSummary): JournalPageDetailResult {
  const result: JournalPageDetailResult = toWireJournalPageResult(page);
  return page.layout !== undefined ? { ...result, src: page.layout.src, ...toWireLayoutFields(page.layout) } : result;
}

export function toWireJournalCategory(category: JournalCategory): JournalCategorySummary {
  return { id: category.id, name: category.name, sort: category.sort };
}

/** get-journal: the read model of get-journals plus each page's layout and the categories. */
export function toWireJournalDetailData(journal: JournalView): JournalDetailData {
  const pages = journal.pages.map((page): JournalPageDetailData => {
    const data = toWireJournalPageData(page);
    return page.layout !== undefined ? { ...data, ...toWireLayoutFields(page.layout) } : data;
  });
  const result: JournalDetailData = { ...toWireJournalData(journal), pages };
  if (journal.categories !== undefined) {
    result.categories = journal.categories.map(toWireJournalCategory);
  }
  return result;
}

export function toWireJournalCategoryResult(journalId: string, category: JournalCategory): JournalCategoryResult {
  return { journalId, ...toWireJournalCategory(category) };
}

export function toWireSearchJournalsResult(outcome: JournalSearchOutcome): SearchJournalsResult {
  return {
    matches: outcome.matches.map(
      (match): WireJournalSearchMatch => ({
        journalId: match.journalId,
        journalName: match.journalName,
        pageId: match.pageId,
        pageName: match.pageName,
        pageType: match.pageType,
        uuid: match.uuid,
        matchedIn: match.matchedIn,
        snippet: match.snippet
      })
    ),
    hasMore: outcome.hasMore
  };
}
