import type { ChatVisibility } from './ChatVisibility';

export const CHAT_STYLES = ['other', 'ooc', 'ic', 'emote'] as const;
export type ChatStyle = (typeof CHAT_STYLES)[number];

/** The styles a caller may give a new message; `other` is what the core uses when none is given. */
export const SPOKEN_STYLES = ['ic', 'ooc', 'emote'] as const;
export type SpokenStyle = (typeof SPOKEN_STYLES)[number];

export interface ChatAuthor {
  readonly id: string;
  readonly name: string;
}

export interface ChatSpeaker {
  /** Empty when the message names no speaker. */
  readonly alias: string;
  readonly actorId: string | null;
  readonly tokenId: string | null;
}

export interface ChatMessage {
  readonly id: string;
  readonly timestamp: number;
  /** The user who posted it; null when that user no longer exists. */
  readonly author: ChatAuthor | null;
  readonly speaker: ChatSpeaker;
  /** HTML, as stored. */
  readonly content: string;
  readonly flavor: string | null;
  readonly style: ChatStyle;
  readonly isRoll: boolean;
  /** User ids the message is whispered to; empty for a public message. */
  readonly whisper: readonly string[];
  /** Its content is hidden from its author unless a GM; taken as the document stores it. */
  readonly blind?: boolean | undefined;
}

/** A speaker as the core built it, with the scene of its token. */
export interface ResolvedChatSpeaker extends ChatSpeaker {
  readonly sceneId: string | null;
}

export interface ChatRoll {
  readonly formula: string;
  readonly total: number;
}

/**
 * Who a new message is attributed to. A message for an actor belongs to that
 * actor; without one, what is left out stays as the core proposes for the
 * current user.
 */
export interface ChatSpeakerChoice {
  readonly actorId?: string | undefined;
  readonly alias?: string | undefined;
  /** A speaker already built; it is posted as it is and the fields above are not read. */
  readonly resolved?: ResolvedChatSpeaker | undefined;
}

export interface ChatMessageDraft {
  readonly content: string;
  readonly speaker: ChatSpeakerChoice;
  readonly flavor?: string | undefined;
  readonly whisper?: readonly string[] | undefined;
  readonly style?: SpokenStyle | undefined;
  /** Applied last, over the whisper recipients, the way the core applies it. */
  readonly visibility?: ChatVisibility | undefined;
}

/** An omitted attribute is left untouched; `null` is handed to the core, which decides what it accepts. */
export interface ChatMessageChanges {
  readonly content?: string | null | undefined;
  readonly flavor?: string | null | undefined;
}

export function hasChanges(changes: ChatMessageChanges): boolean {
  return changes.content !== undefined || changes.flavor !== undefined;
}

export function isWhisper(message: ChatMessage): boolean {
  return message.whisper.length > 0;
}
