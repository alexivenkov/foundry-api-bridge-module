export const CHAT_PREVIEW_LENGTH = 300;

const ENTITIES: ReadonlyArray<readonly [RegExp, string]> = [
  [/&nbsp;/g, ' '],
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&quot;/g, '"'],
  [/&#0*39;/g, "'"],
  // Last, so `&amp;lt;` reads as `&lt;` and not as `<`.
  [/&amp;/g, '&']
];

/** Plain text of chat HTML, whitespace collapsed, cut at `maxLength` characters with an ellipsis. */
export function textPreview(html: string, maxLength: number = CHAT_PREVIEW_LENGTH): string {
  let text = html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
  for (const [pattern, replacement] of ENTITIES) {
    text = text.replace(pattern, replacement);
  }
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
