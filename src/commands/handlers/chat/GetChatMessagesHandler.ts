import type { GetChatMessagesParams, GetChatMessagesResult, ChatMessageData } from '@/commands/types';
import type { FoundryChatMessageDocument, FoundryChatGame } from './chatTypes';
import { STYLE_TO_STRING, STRING_TO_STYLE, stripHtml } from './chatTypes';

declare const game: FoundryChatGame;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function mapMessage(msg: FoundryChatMessageDocument, includeRolls: boolean): ChatMessageData {
  const data: ChatMessageData = {
    id: msg.id,
    timestamp: msg.timestamp,
    author: msg.author
      ? { userId: msg.author.id, name: msg.author.name }
      : { userId: 'unknown', name: 'Unknown' },
    speaker: {
      alias: msg.speaker.alias ?? '',
      actorId: msg.speaker.actor ?? null,
      tokenId: msg.speaker.token ?? null
    },
    content: stripHtml(msg.content),
    flavor: msg.flavor || null,
    style: STYLE_TO_STRING[msg.style] ?? 'other',
    isRoll: msg.isRoll,
    whisper: msg.whisper,
    isWhisper: msg.whisper.length > 0
  };

  if (includeRolls && msg.rolls.length > 0) {
    data.rolls = msg.rolls.map(r => ({ formula: r.formula, total: r.total }));
  }

  return data;
}

export function getChatMessagesHandler(params: GetChatMessagesParams): Promise<GetChatMessagesResult> {
  const allMessages = game.messages.contents;
  const total = allMessages.length;

  let filtered = [...allMessages];

  // Pagination: since (after given ID)
  if (params.since) {
    const idx = filtered.findIndex(m => m.id === params.since);
    if (idx !== -1) {
      filtered = filtered.slice(idx + 1);
    }
  }

  // Pagination: before (before given ID)
  if (params.before) {
    const idx = filtered.findIndex(m => m.id === params.before);
    if (idx !== -1) {
      filtered = filtered.slice(0, idx);
    }
  }

  // Filter by authorId
  if (params.authorId) {
    filtered = filtered.filter(m => m.author?.id === params.authorId);
  }

  // Filter by actorId (speaker.actor)
  if (params.actorId) {
    filtered = filtered.filter(m => m.speaker.actor === params.actorId);
  }

  // Filter by type
  if (params.type) {
    if (params.type === 'roll') {
      filtered = filtered.filter(m => m.isRoll);
    } else {
      const styleNum = STRING_TO_STYLE[params.type];
      if (styleNum !== undefined) {
        filtered = filtered.filter(m => m.style === styleNum);
      }
    }
  }

  // Filter by search text
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(m =>
      stripHtml(m.content).toLowerCase().includes(searchLower)
    );
  }

  // Apply limit (take from the end — most recent)
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const hasMore = filtered.length > limit;
  const sliced = filtered.slice(-limit);

  const includeRolls = params.includeRolls === true;

  return Promise.resolve({
    messages: sliced.map(m => mapMessage(m, includeRolls)),
    total,
    hasMore
  });
}
