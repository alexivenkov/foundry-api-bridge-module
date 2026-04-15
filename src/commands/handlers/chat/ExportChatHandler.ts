import type { ExportChatParams, ExportChatResult } from '@/commands/types';
import type { FoundryChatGame } from './chatTypes';
import { stripHtml } from './chatTypes';

declare const game: FoundryChatGame;

export function exportChatHandler(params: ExportChatParams): Promise<ExportChatResult> {
  const messages = game.messages.contents;

  if (messages.length === 0) {
    return Promise.resolve({ content: '', messageCount: 0 });
  }

  const format = params.format ?? 'text';

  if (format === 'json') {
    const jsonData = messages.map(m => ({
      id: m.id,
      timestamp: m.timestamp,
      author: m.author ? { userId: m.author.id, name: m.author.name } : null,
      speaker: m.speaker.alias ?? '',
      content: stripHtml(m.content),
      flavor: m.flavor || null,
      isRoll: m.isRoll
    }));
    return Promise.resolve({
      content: JSON.stringify(jsonData),
      messageCount: messages.length
    });
  }

  // Text format — use Foundry's built-in export()
  const lines = messages.map(m => m.export());
  return Promise.resolve({
    content: lines.join('\n'),
    messageCount: messages.length
  });
}
