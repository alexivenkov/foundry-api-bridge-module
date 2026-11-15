import type { ChatMessage } from '@/core/chat/domain/model/ChatMessage';
import { stripHtml } from './plainText';

/** What a history request may narrow to: one of the spoken styles, or messages that carry a roll. */
export const CHAT_MESSAGE_KINDS = ['ic', 'ooc', 'emote', 'roll'] as const;
export type ChatMessageKind = (typeof CHAT_MESSAGE_KINDS)[number];

// Part of the wire contract: an out-of-range limit is clamped, never rejected.
export const ChatHistoryLimit = Object.freeze({
  DEFAULT: 20,
  MAX: 100,
  resolve(requested: number | undefined): number {
    return Math.min(Math.max(requested ?? ChatHistoryLimit.DEFAULT, 1), ChatHistoryLimit.MAX);
  }
});

export interface ChatHistoryFilter {
  readonly limit?: number | undefined;
  /** Only messages after the one with this id. */
  readonly since?: string | undefined;
  /** Only messages before the one with this id. */
  readonly before?: string | undefined;
  readonly authorId?: string | undefined;
  /** The actor the message speaks for. */
  readonly actorId?: string | undefined;
  readonly kind?: ChatMessageKind | undefined;
  /** Case-insensitive, matched against the content without its markup. */
  readonly search?: string | undefined;
}

export interface ChatHistorySelection {
  readonly messages: readonly ChatMessage[];
  /** Older matching messages were cut off by the limit. */
  readonly hasMore: boolean;
}

function matchesKind(message: ChatMessage, kind: ChatMessageKind): boolean {
  return kind === 'roll' ? message.isRoll : message.style === kind;
}

/**
 * The most recent messages of a log (oldest first) that pass the filter.
 * A `since` / `before` id that is not in the log narrows nothing.
 */
export function selectChatHistory(log: readonly ChatMessage[], filter: ChatHistoryFilter): ChatHistorySelection {
  let selected = [...log];

  if (filter.since !== undefined) {
    const index = selected.findIndex((message) => message.id === filter.since);
    if (index !== -1) {
      selected = selected.slice(index + 1);
    }
  }

  if (filter.before !== undefined) {
    const index = selected.findIndex((message) => message.id === filter.before);
    if (index !== -1) {
      selected = selected.slice(0, index);
    }
  }

  const { authorId, actorId, kind, search } = filter;

  if (authorId !== undefined) {
    selected = selected.filter((message) => message.author?.id === authorId);
  }

  if (actorId !== undefined) {
    selected = selected.filter((message) => message.speaker.actorId === actorId);
  }

  if (kind !== undefined) {
    selected = selected.filter((message) => matchesKind(message, kind));
  }

  if (search !== undefined) {
    const needle = search.toLowerCase();
    selected = selected.filter((message) => stripHtml(message.content).toLowerCase().includes(needle));
  }

  const limit = ChatHistoryLimit.resolve(filter.limit);
  return { messages: selected.slice(-limit), hasMore: selected.length > limit };
}
