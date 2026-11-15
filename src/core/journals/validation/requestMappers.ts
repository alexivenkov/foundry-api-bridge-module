import type {
  CreateJournalCategoryCommand,
  CreateJournalCommand,
  CreateJournalPageCommand,
  DeleteJournalCategoryCommand,
  DeleteJournalCommand,
  DeleteJournalPageCommand,
  GetJournalQuery,
  ListJournalsQuery,
  PanToNoteCommand,
  SearchJournalsQuery,
  ShowImageCommand,
  ShowJournalCommand,
  UpdateJournalCategoryCommand,
  UpdateJournalCommand,
  UpdateJournalPageCommand
} from '@/core/journals/application';
import { draftJournalPage, withTextFormat, type JournalPageOptions } from '@/core/journals/domain';
import type {
  CreateJournalCategoryRequest,
  CreateJournalPageRequest,
  CreateJournalRequest,
  DeleteJournalCategoryRequest,
  DeleteJournalPageRequest,
  DeleteJournalRequest,
  GetJournalRequest,
  GetJournalsRequest,
  PanToNoteRequest,
  SearchJournalsRequest,
  ShowImageRequest,
  ShowJournalRequest,
  UpdateJournalCategoryRequest,
  UpdateJournalPageRequest,
  UpdateJournalRequest
} from './journalSchemas';

type PageOptionsRequest = Pick<
  CreateJournalPageRequest,
  'caption' | 'format' | 'markdown' | 'title' | 'sort' | 'categoryId' | 'video'
>;

function toPageOptions(request: PageOptionsRequest): JournalPageOptions {
  return {
    caption: request.caption,
    format: request.format,
    markdown: request.markdown,
    title: request.title,
    sort: request.sort,
    categoryId: request.categoryId,
    video: request.video
  };
}

export function toListJournalsQuery(request: GetJournalsRequest): ListJournalsQuery {
  return { light: request.light === true };
}

export function toGetJournalQuery(request: GetJournalRequest): GetJournalQuery {
  return { journalId: request.journalId };
}

/** A journal gets a first page, named after it, only when content is given. */
export function toCreateJournalCommand(request: CreateJournalRequest): CreateJournalCommand {
  return {
    draft: {
      name: request.name,
      folderId: request.folder,
      firstPage:
        request.content !== undefined
          ? draftJournalPage({
              name: request.name,
              type: request.pageType ?? undefined,
              content: request.content
            })
          : undefined
    }
  };
}

export function toUpdateJournalCommand(request: UpdateJournalRequest): UpdateJournalCommand {
  return {
    journalId: request.journalId,
    changes: { name: request.name, folderId: request.folder }
  };
}

export function toDeleteJournalCommand(request: DeleteJournalRequest): DeleteJournalCommand {
  return { journalId: request.journalId };
}

export function toCreateJournalPageCommand(request: CreateJournalPageRequest): CreateJournalPageCommand {
  return {
    journalId: request.journalId,
    draft: draftJournalPage({
      name: request.name,
      type: request.type ?? undefined,
      content: request.content,
      src: request.src,
      ...toPageOptions(request)
    })
  };
}

export function toUpdateJournalPageCommand(request: UpdateJournalPageRequest): UpdateJournalPageCommand {
  return {
    journalId: request.journalId,
    pageId: request.pageId,
    changes: { name: request.name, text: request.content, src: request.src, ...withTextFormat(toPageOptions(request)) }
  };
}

export function toDeleteJournalPageCommand(request: DeleteJournalPageRequest): DeleteJournalPageCommand {
  return { journalId: request.journalId, pageId: request.pageId };
}

export function toShowJournalCommand(request: ShowJournalRequest): ShowJournalCommand {
  return {
    journalId: request.journalId,
    pageId: request.pageId,
    audience: { force: Boolean(request.force), users: request.users }
  };
}

export function toCreateJournalCategoryCommand(request: CreateJournalCategoryRequest): CreateJournalCategoryCommand {
  return { journalId: request.journalId, draft: { name: request.name, sort: request.sort } };
}

export function toUpdateJournalCategoryCommand(request: UpdateJournalCategoryRequest): UpdateJournalCategoryCommand {
  return {
    journalId: request.journalId,
    categoryId: request.categoryId,
    changes: { name: request.name, sort: request.sort }
  };
}

export function toDeleteJournalCategoryCommand(request: DeleteJournalCategoryRequest): DeleteJournalCategoryCommand {
  return { journalId: request.journalId, categoryId: request.categoryId };
}

export function toShowImageCommand(request: ShowImageRequest): ShowImageCommand {
  return { src: request.src, title: request.title, caption: request.caption, users: request.users ?? [] };
}

export function toPanToNoteCommand(request: PanToNoteRequest): PanToNoteCommand {
  return { journalId: request.journalId, view: { scale: request.scale, duration: request.duration } };
}

export function toSearchJournalsQuery(request: SearchJournalsRequest): SearchJournalsQuery {
  return {
    query: request.query,
    pageTypes: request.pageTypes,
    searchContent: request.searchContent,
    limit: request.limit,
    offset: request.offset
  };
}
