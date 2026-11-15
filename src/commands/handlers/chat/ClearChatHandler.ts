import type { ClearChatResult } from '@/commands/types';
import { createFoundryChatService } from '@/core/chat';
import type { ChatHandlerDependencies } from './chatWireMappers';

export function createClearChatHandler(deps: ChatHandlerDependencies = {}): () => Promise<ClearChatResult> {
  const service = createFoundryChatService(deps.globals);

  // The command takes no parameters, so there is nothing to validate.
  return async function clearChatHandler(): Promise<ClearChatResult> {
    return { deletedCount: await service.clearChat() };
  };
}

export const clearChatHandler = createClearChatHandler();
