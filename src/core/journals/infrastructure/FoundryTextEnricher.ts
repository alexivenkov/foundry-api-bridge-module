import type { TextEnricher } from '@/core/journals/domain';
import { resolveTextEditor } from './foundryJournalClasses';
import type { JournalGlobalsProvider } from './foundryJournalTypes';

/** The core's text editor, enriching as the GM sees it: secret blocks are kept. */
export class FoundryTextEnricher implements TextEnricher {
  constructor(private readonly globals: JournalGlobalsProvider) {}

  async enrich(html: string): Promise<string | null> {
    const editor = resolveTextEditor(this.globals());
    if (!editor) {
      return null;
    }
    return editor.enrichHTML(html, { secrets: true });
  }
}
