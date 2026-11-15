import type { SendChatMessageParams, SendChatMessageResult } from '@/commands/types';
import {
  createFoundryChatService,
  sendChatMessageRequestSchema,
  toSendChatMessageCommand,
  type ChatWorldGlobalsProvider
} from '@/core/chat';
import { parseRequest } from '@/core/shared';

export interface SendChatMessageHandlerDependencies {
  globals?: ChatWorldGlobalsProvider;
}

export function createSendChatMessageHandler(
  deps: SendChatMessageHandlerDependencies = {}
): (params: SendChatMessageParams) => Promise<SendChatMessageResult> {
  const service = createFoundryChatService(deps.globals);

  return async function sendChatMessageHandler(params: SendChatMessageParams): Promise<SendChatMessageResult> {
    const command = toSendChatMessageCommand(parseRequest(sendChatMessageRequestSchema, params));
    return { messageId: await service.sendMessage(command), sent: true };
  };
}

export const sendChatMessageHandler = createSendChatMessageHandler();
