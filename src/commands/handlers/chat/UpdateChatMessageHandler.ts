import type { UpdateChatMessageParams, SendChatMessageResult } from '@/commands/types';
import { createFoundryChatService, toUpdateChatMessageCommand, updateChatMessageRequestSchema } from '@/core/chat';
import { parseRequest } from '@/core/shared';
import type { ChatHandlerDependencies } from './chatWireMappers';

export function createUpdateChatMessageHandler(
  deps: ChatHandlerDependencies = {}
): (params: UpdateChatMessageParams) => Promise<SendChatMessageResult> {
  const service = createFoundryChatService(deps.globals);

  return async function updateChatMessageHandler(params: UpdateChatMessageParams): Promise<SendChatMessageResult> {
    const command = toUpdateChatMessageCommand(parseRequest(updateChatMessageRequestSchema, params));
    await service.updateMessage(command);
    return { messageId: command.messageId, sent: true };
  };
}

export const updateChatMessageHandler = createUpdateChatMessageHandler();
