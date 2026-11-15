/**
 * Who sees a message, as the core's roll modes (message modes since Foundry 14)
 * define it: `public` everyone; `gm` the GMs, or the whisper recipients when
 * there are any; `blind` like `gm`, and the author does not see the content;
 * `self` only the author.
 */
export const CHAT_VISIBILITIES = ['public', 'gm', 'blind', 'self'] as const;
export type ChatVisibility = (typeof CHAT_VISIBILITIES)[number];
