import type { GetChatMessagesParams, GetChatMessagesResult } from '@/commands/types';
import { createFoundryChatService, getChatMessagesRequestSchema, toListChatMessagesQuery } from '@/core/chat';
import { parseRequest } from '@/core/shared';
import { toWireChatMessage, type ChatHandlerDependencies } from './chatWireMappers';

export function createGetChatMessagesHandler(
  deps: ChatHandlerDependencies = {}
): (params: GetChatMessagesParams) => Promise<GetChatMessagesResult> {
  const service = createFoundryChatService(deps.globals);

  return function getChatMessagesHandler(params: GetChatMessagesParams): Promise<GetChatMessagesResult> {
    const page = service.listMessages(toListChatMessagesQuery(parseRequest(getChatMessagesRequestSchema, params)));
    return Promise.resolve({
      messages: page.entries.map(toWireChatMessage),
      total: page.total,
      hasMore: page.hasMore
    });
  };
}

export const getChatMessagesHandler = createGetChatMessagesHandler();
