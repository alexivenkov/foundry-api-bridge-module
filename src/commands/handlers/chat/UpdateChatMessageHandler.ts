import type { UpdateChatMessageParams, SendChatMessageResult } from '@/commands/types';
import type { FoundryChatGame } from './chatTypes';

declare const game: FoundryChatGame;

export async function updateChatMessageHandler(params: UpdateChatMessageParams): Promise<SendChatMessageResult> {
  const message = game.messages.get(params.messageId);
  if (!message) {
    throw new Error(`Chat message not found: ${params.messageId}`);
  }

  const updateData: Record<string, unknown> = {};
  if (params.content !== undefined) {
    updateData['content'] = params.content;
  }
  if (params.flavor !== undefined) {
    updateData['flavor'] = params.flavor;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No updates provided');
  }

  await message.update(updateData);

  return {
    messageId: message.id,
    sent: true
  };
}
