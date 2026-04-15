import type { DeleteChatMessageParams, DeleteResult } from '@/commands/types';
import type { FoundryChatGame } from './chatTypes';

declare const game: FoundryChatGame;

export async function deleteChatMessageHandler(params: DeleteChatMessageParams): Promise<DeleteResult> {
  const message = game.messages.get(params.messageId);
  if (!message) {
    throw new Error(`Chat message not found: ${params.messageId}`);
  }

  await message.delete();

  return { deleted: true };
}
