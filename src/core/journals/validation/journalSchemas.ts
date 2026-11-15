import { z } from 'zod';
import {
  JOURNAL_PAGE_FORMATS,
  JOURNAL_SEARCH_MAX_LIMIT,
  MAX_TITLE_LEVEL,
  MIN_TITLE_LEVEL
} from '@/core/journals/domain';

// Deliberately tolerant, as the pre-DDD handlers were. Unknown keys are ignored.
// What the old handlers handed to the core as given may be null, and a page
// type is any string: game systems and modules register their own. `light` and
// `force` keep their old reading (strictly true / any truthy value), and
// `users` is not looked at.
//
// The page options added later and the new commands have no legacy clients:
// they are validated strictly, with the ranges of `BaseJournalEntryPage` /
// `BaseJournalEntryCategory` (Foundry 13–14); a value the core would clamp is
// rejected instead.

const passedThrough = z.string().nullable().optional();
const id = z.string().min(1);
const sort = z.number().int();

const pageTitleSchema = z.object({
  show: z.boolean().optional(),
  level: z.number().int().min(MIN_TITLE_LEVEL).max(MAX_TITLE_LEVEL).optional()
});

const pageVideoSchema = z.object({
  controls: z.boolean().optional(),
  loop: z.boolean().optional(),
  autoplay: z.boolean().optional(),
  volume: z.number().min(0).max(1).optional(),
  timestamp: z.number().min(0).nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional()
});

const pageOptionsShape = {
  caption: z.string().nullable().optional(),
  format: z.enum(JOURNAL_PAGE_FORMATS).optional(),
  markdown: z.string().optional(),
  title: pageTitleSchema.optional(),
  sort: sort.optional(),
  categoryId: id.nullable().optional(),
  video: pageVideoSchema.optional()
};

interface PageTextRequest {
  content?: string | null | undefined;
  format?: (typeof JOURNAL_PAGE_FORMATS)[number] | undefined;
  markdown?: string | undefined;
}

// The server renders a markdown page's `text.content` from `text.markdown`
// and drops the markdown of an HTML page, so the three must agree.
function checkPageText(request: PageTextRequest, context: z.RefinementCtx): void {
  if (request.markdown !== undefined && request.format === 'html') {
    context.addIssue({ code: 'custom', path: ['markdown'], message: "cannot be combined with format 'html'" });
  }
  if (request.format === 'markdown' && request.markdown === undefined) {
    context.addIssue({ code: 'custom', path: ['markdown'], message: "is required with format 'markdown'" });
  }
  if (request.content !== undefined && (request.markdown !== undefined || request.format === 'markdown')) {
    context.addIssue({
      code: 'custom',
      path: ['content'],
      message: 'cannot be combined with markdown: Foundry renders a markdown page from its markdown'
    });
  }
}

export const getJournalsRequestSchema = z.object({
  light: z.unknown().optional()
});

export const getJournalRequestSchema = z.object({
  journalId: z.string()
});

export const createJournalRequestSchema = z.object({
  name: z.string(),
  folder: passedThrough,
  content: passedThrough,
  pageType: z.string().nullish()
});

export const updateJournalRequestSchema = z.object({
  journalId: z.string(),
  name: passedThrough,
  folder: passedThrough
});

export const deleteJournalRequestSchema = z.object({
  journalId: z.string()
});

export const createJournalPageRequestSchema = z
  .object({
    journalId: z.string(),
    name: z.string(),
    type: z.string().nullish(),
    content: passedThrough,
    src: passedThrough,
    ...pageOptionsShape
  })
  .superRefine(checkPageText);

export const updateJournalPageRequestSchema = z
  .object({
    journalId: z.string(),
    pageId: z.string(),
    name: passedThrough,
    content: passedThrough,
    src: passedThrough,
    ...pageOptionsShape
  })
  .superRefine(checkPageText);

export const deleteJournalPageRequestSchema = z.object({
  journalId: z.string(),
  pageId: z.string()
});

export const showJournalRequestSchema = z.object({
  journalId: z.string(),
  pageId: z.string().optional(),
  force: z.unknown().optional(),
  users: z.unknown().optional()
});

export const createJournalCategoryRequestSchema = z.object({
  journalId: id,
  name: z.string().trim().min(1),
  sort: sort.optional()
});

export const updateJournalCategoryRequestSchema = z.object({
  journalId: id,
  categoryId: id,
  name: z.string().trim().min(1).optional(),
  sort: sort.optional()
});

export const deleteJournalCategoryRequestSchema = z.object({
  journalId: id,
  categoryId: id
});

export const showImageRequestSchema = z.object({
  src: z.string().trim().min(1),
  title: z.string().optional(),
  caption: z.string().optional(),
  users: z.array(id).optional()
});

export const panToNoteRequestSchema = z.object({
  journalId: id,
  scale: z.number().positive().optional(),
  duration: z.number().min(0).optional()
});

export const searchJournalsRequestSchema = z.object({
  query: z.string().trim().min(1),
  pageTypes: z.array(id).optional(),
  searchContent: z.boolean().optional(),
  limit: z.number().int().min(1).max(JOURNAL_SEARCH_MAX_LIMIT).optional(),
  offset: z.number().int().min(0).optional()
});

export type GetJournalsRequest = z.infer<typeof getJournalsRequestSchema>;
export type GetJournalRequest = z.infer<typeof getJournalRequestSchema>;
export type CreateJournalRequest = z.infer<typeof createJournalRequestSchema>;
export type UpdateJournalRequest = z.infer<typeof updateJournalRequestSchema>;
export type DeleteJournalRequest = z.infer<typeof deleteJournalRequestSchema>;
export type CreateJournalPageRequest = z.infer<typeof createJournalPageRequestSchema>;
export type UpdateJournalPageRequest = z.infer<typeof updateJournalPageRequestSchema>;
export type DeleteJournalPageRequest = z.infer<typeof deleteJournalPageRequestSchema>;
export type ShowJournalRequest = z.infer<typeof showJournalRequestSchema>;
export type CreateJournalCategoryRequest = z.infer<typeof createJournalCategoryRequestSchema>;
export type UpdateJournalCategoryRequest = z.infer<typeof updateJournalCategoryRequestSchema>;
export type DeleteJournalCategoryRequest = z.infer<typeof deleteJournalCategoryRequestSchema>;
export type ShowImageRequest = z.infer<typeof showImageRequestSchema>;
export type PanToNoteRequest = z.infer<typeof panToNoteRequestSchema>;
export type SearchJournalsRequest = z.infer<typeof searchJournalsRequestSchema>;
