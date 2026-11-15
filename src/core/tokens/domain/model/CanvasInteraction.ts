export interface SelectedToken {
  readonly id: string;
  readonly name: string;
  readonly actorId: string | null;
}

export interface SpeechBubbleOptions {
  readonly pan: boolean;
  readonly requireVisible: boolean;
}

export const MAX_SPEECH_BUBBLE_LENGTH = 1000;

const ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '[': '&#91;',
  ']': '&#93;',
  '@': '&#64;'
};

/**
 * The core renders a bubble's text as enriched HTML on every client, so the
 * text is escaped — markup, and the `[[…]]` / `@…[…]` enricher syntax too —
 * and shows literally.
 */
export function toPlainBubbleHtml(text: string): string {
  return text.replace(/[&<>"'[\]@]/g, (character) => ENTITIES[character] ?? character);
}
