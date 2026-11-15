import type { ChatSpeakerChoice } from '@/core/chat/domain/model/ChatMessage';

/**
 * A message sent for an actor speaks under the actor's name; the given speaker
 * name is used only when the actor does not exist. Without an actor, a
 * non-empty speaker name replaces the default alias.
 */
export function chooseSpeaker(
  actorId: string | undefined,
  actorName: string | null,
  speakerName: string | undefined
): ChatSpeakerChoice {
  if (actorId !== undefined) {
    return { actorId, alias: actorName ?? speakerName };
  }
  return speakerName !== undefined && speakerName !== '' ? { alias: speakerName } : {};
}
