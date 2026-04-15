import type { ClearChatResult } from '@/commands/types';
import type { FoundryChatGame, FoundryChatMessageConstructor } from './chatTypes';

declare const game: FoundryChatGame;
declare const ChatMessage: FoundryChatMessageConstructor;

export async function clearChatHandler(): Promise<ClearChatResult> {
  const messages = game.messages.contents;
  const count = messages.length;

  if (count === 0) {
    return { deletedCount: 0 };
  }

  const ids = messages.map(m => m.id);
  await ChatMessage.deleteDocuments(ids);

  return { deletedCount: count };
}
