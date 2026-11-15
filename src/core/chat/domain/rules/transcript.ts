import type { ChatMessage } from '@/core/chat/domain/model/ChatMessage';
import { stripHtml } from './plainText';

export const CHAT_EXPORT_FORMATS = ['text', 'json'] as const;
export type ChatExportFormat = (typeof CHAT_EXPORT_FORMATS)[number];

/** One message of a JSON chat export. The key order is the order of the exported document. */
export interface ChatTranscriptRecord {
  readonly id: string;
  readonly timestamp: number;
  readonly author: { readonly userId: string; readonly name: string } | null;
  readonly speaker: string;
  readonly content: string;
  readonly flavor: string | null;
  readonly isRoll: boolean;
}

export function toTranscriptRecord(message: ChatMessage): ChatTranscriptRecord {
  return {
    id: message.id,
    timestamp: message.timestamp,
    author: message.author !== null ? { userId: message.author.id, name: message.author.name } : null,
    speaker: message.speaker.alias,
    content: stripHtml(message.content),
    flavor: message.flavor,
    isRoll: message.isRoll
  };
}
