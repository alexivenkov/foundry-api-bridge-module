import type {
  ChatMessage,
  ChatMessageChanges,
  ChatRoll,
  ChatSpeakerChoice,
  ResolvedChatSpeaker
} from '@/core/chat/domain';
import { chatStyleFromCode } from './chatStyleCodes';
import type { FoundryChatMessageDocument, FoundryChatRoll, FoundryChatSpeaker } from './foundryChatTypes';

export function toChatMessage(document: FoundryChatMessageDocument): ChatMessage {
  return {
    id: document.id,
    timestamp: document.timestamp,
    author: document.author ? { id: document.author.id, name: document.author.name } : null,
    speaker: {
      alias: document.speaker.alias ?? '',
      actorId: document.speaker.actor ?? null,
      tokenId: document.speaker.token ?? null
    },
    content: document.content,
    flavor: document.flavor || null,
    style: chatStyleFromCode(document.style),
    isRoll: document.isRoll,
    whisper: document.whisper,
    blind: document.blind
  };
}

export function toResolvedSpeaker(speaker: FoundryChatSpeaker): ResolvedChatSpeaker {
  return {
    alias: speaker.alias ?? '',
    actorId: speaker.actor ?? null,
    tokenId: speaker.token ?? null,
    sceneId: speaker.scene ?? null
  };
}

export function toFoundrySpeaker(speaker: ResolvedChatSpeaker): FoundryChatSpeaker {
  return { scene: speaker.sceneId, actor: speaker.actorId, token: speaker.tokenId, alias: speaker.alias };
}

export function toChatRoll(roll: FoundryChatRoll): ChatRoll {
  return { formula: roll.formula, total: roll.total };
}

/** Writes the chosen alias and actor into a speaker the core built; what else it filled in is kept. */
export function applySpeakerChoice(speaker: FoundryChatSpeaker, choice: ChatSpeakerChoice): FoundryChatSpeaker {
  if (choice.actorId !== undefined) {
    speaker.alias = choice.alias ?? speaker.alias;
    speaker.actor = choice.actorId;
  } else if (choice.alias !== undefined) {
    speaker.alias = choice.alias;
  }
  return speaker;
}

/** Only the attributes that are set become document fields. */
export function toFoundryMessageUpdate(changes: ChatMessageChanges): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (changes.content !== undefined) {
    data['content'] = changes.content;
  }
  if (changes.flavor !== undefined) {
    data['flavor'] = changes.flavor;
  }
  return data;
}
