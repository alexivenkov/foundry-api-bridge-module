import type { DeleteChatMessageParams, DeleteResult } from '@/commands/types';
import { createFoundryChatService, deleteChatMessageRequestSchema, toDeleteChatMessageCommand } from '@/core/chat';
import { parseRequest } from '@/core/shared';
import type { ChatHandlerDependencies } from './chatWireMappers';

export function createDeleteChatMessageHandler(
  deps: ChatHandlerDependencies = {}
): (params: DeleteChatMessageParams) => Promise<DeleteResult> {
  const service = createFoundryChatService(deps.globals);

  return async function deleteChatMessageHandler(params: DeleteChatMessageParams): Promise<DeleteResult> {
    await service.deleteMessage(toDeleteChatMessageCommand(parseRequest(deleteChatMessageRequestSchema, params)));
    return { deleted: true };
  };
}

export const deleteChatMessageHandler = createDeleteChatMessageHandler();
