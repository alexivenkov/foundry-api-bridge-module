import type { ChatUserDirectory } from '@/core/chat/domain';
import type { ChatUserGlobalsProvider } from './foundryChatTypes';

/** The world's users, as whisper recipients. */
export class FoundryChatUsers implements ChatUserDirectory {
  constructor(private readonly globals: ChatUserGlobalsProvider) {}

  hasUser(userId: string): boolean {
    return this.globals().game.users.get(userId) !== undefined;
  }

  findRecipients(name: string): readonly string[] {
    return this.globals().ChatMessage.getWhisperRecipients(name).map((user) => user.id);
  }
}
