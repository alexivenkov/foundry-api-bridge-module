import type { EmbeddedItemView, EmbeddedPageView, PackDocumentView } from '@/compendiums/domain';

// Maps a fully-loaded Foundry document (Actor items and JournalEntry pages
// arrive as Map-like embedded collections) into the rich per-document view
// used by the full-pack dump. Shapes beyond actors/journals degrade to the
// base view — that mirrors the historical wire behavior.
export function toPackDocumentView(doc: Record<string, unknown>): PackDocumentView {
  const base: {
    id: string;
    uuid: string;
    name: string;
    type: string;
    img: string;
    system?: Record<string, unknown>;
    items?: EmbeddedItemView[];
    pages?: EmbeddedPageView[];
  } = {
    id: doc['id'] as string,
    uuid: doc['uuid'] as string,
    name: doc['name'] as string,
    type: doc['type'] as string,
    img: (doc['img'] as string | undefined) ?? ''
  };

  if (doc['system'] !== undefined) {
    base.system = doc['system'] as Record<string, unknown>;
  }

  const items = doc['items'] as Map<string, Record<string, unknown>> | undefined;
  if (items !== undefined && items.size > 0) {
    const itemViews: EmbeddedItemView[] = [];
    items.forEach(item => {
      itemViews.push({
        id: item['id'] as string,
        name: item['name'] as string,
        type: item['type'] as string,
        img: (item['img'] as string | undefined) ?? '',
        system: item['system'] as Record<string, unknown>
      });
    });
    base.items = itemViews;
  }

  const pages = doc['pages'] as Map<string, Record<string, unknown>> | undefined;
  if (pages !== undefined && pages.size > 0) {
    const pageViews: EmbeddedPageView[] = [];
    pages.forEach(page => {
      const text = page['text'] as { content?: string; markdown?: string } | undefined;
      pageViews.push({
        id: page['id'] as string,
        name: page['name'] as string,
        type: page['type'] as string,
        text: text?.content ?? null,
        markdown: text?.markdown ?? null,
        enrichedText: null,
        src: (page['src'] as string | undefined) ?? null
      });
    });
    base.pages = pageViews;
  }

  return base;
}
