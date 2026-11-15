import type { ChatActorDirectory } from '@/core/chat/domain';
import type { ChatGlobalsProvider } from './foundryChatTypes';

/** The world's actors, as far as chat needs them: a name to speak under. */
export class FoundryChatActors implements ChatActorDirectory {
  constructor(private readonly globals: ChatGlobalsProvider) {}

  findActorName(actorId: string): string | null {
    return this.globals().game.actors.get(actorId)?.name ?? null;
  }
}
