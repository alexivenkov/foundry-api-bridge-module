import type { ExportChatParams, ExportChatResult } from '@/commands/types';
import { createFoundryChatService, exportChatRequestSchema, toExportChatQuery } from '@/core/chat';
import { parseRequest } from '@/core/shared';
import type { ChatHandlerDependencies } from './chatWireMappers';

export function createExportChatHandler(
  deps: ChatHandlerDependencies = {}
): (params: ExportChatParams) => Promise<ExportChatResult> {
  const service = createFoundryChatService(deps.globals);

  return function exportChatHandler(params: ExportChatParams): Promise<ExportChatResult> {
    const result = service.exportChat(toExportChatQuery(parseRequest(exportChatRequestSchema, params)));
    return Promise.resolve({ content: result.content, messageCount: result.messageCount });
  };
}

export const exportChatHandler = createExportChatHandler();
