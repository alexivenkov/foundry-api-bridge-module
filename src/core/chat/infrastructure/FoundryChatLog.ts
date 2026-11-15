import type {
  ChatLog,
  ChatMessage,
  ChatMessageChanges,
  ChatMessageDraft,
  ChatRoll,
  ChatSpeakerChoice
} from '@/core/chat/domain';
import {
  applySpeakerChoice,
  toChatMessage,
  toChatRoll,
  toFoundryMessageUpdate,
  toFoundrySpeaker
} from './chatMessageMapper';
import { toFoundryStyleData } from './chatStyleCodes';
import { applyFoundryVisibility } from './chatVisibilityCodes';
import type {
  ChatGlobalsProvider,
  FoundryChatMessageCollection,
  FoundryChatMessageData,
  FoundryChatSpeaker
} from './foundryChatTypes';

/** Anti-corruption layer over the world's ChatMessage documents. */
export class FoundryChatLog implements ChatLog {
  constructor(private readonly globals: ChatGlobalsProvider) {}

  listMessages(): readonly ChatMessage[] {
    return this.messages().contents.map(toChatMessage);
  }

  listMessageIds(): readonly string[] {
    return this.messages().contents.map((document) => document.id);
  }

  hasMessage(messageId: string): boolean {
    return this.messages().get(messageId) !== undefined;
  }

  listRolls(messageId: string): readonly ChatRoll[] {
    return (this.messages().get(messageId)?.rolls ?? []).map(toChatRoll);
  }

  async postMessage(draft: ChatMessageDraft): Promise<string | null> {
    const { ChatMessage, CONST } = this.globals();
    const { resolved } = draft.speaker;
    const data: FoundryChatMessageData = {
      content: draft.content,
      speaker:
        resolved !== undefined
          ? toFoundrySpeaker(resolved)
          : applySpeakerChoice(this.proposeSpeaker(draft.speaker), draft.speaker)
    };
    if (draft.flavor !== undefined) {
      data.flavor = draft.flavor;
    }
    if (draft.whisper !== undefined) {
      data.whisper = [...draft.whisper];
    }
    if (draft.style !== undefined) {
      Object.assign(data, toFoundryStyleData(draft.style, CONST));
    }
    if (draft.visibility !== undefined) {
      applyFoundryVisibility(ChatMessage, data, draft.visibility);
    }

    const created = await ChatMessage.create(data);
    return created?.id ?? null;
  }

  async updateMessage(messageId: string, changes: ChatMessageChanges): Promise<boolean> {
    const document = this.messages().get(messageId);
    if (document === undefined) {
      return false;
    }
    await document.update(toFoundryMessageUpdate(changes));
    return true;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.messages().get(messageId)?.delete();
  }

  async deleteMessages(messageIds: readonly string[]): Promise<void> {
    await this.globals().ChatMessage.deleteDocuments([...messageIds]);
  }

  exportEntries(): readonly string[] {
    return this.messages().contents.map((document) => document.export());
  }

  /**
   * The core resolves a message's actor from the speaker's token before its
   * actor, so a message for an actor must not carry the token the GM happens
   * to control: the core builds that speaker for the actor itself. An actor
   * that does not exist is named without any token.
   */
  private proposeSpeaker(choice: ChatSpeakerChoice): FoundryChatSpeaker {
    const { ChatMessage, game } = this.globals();
    if (choice.actorId === undefined) {
      return ChatMessage.getSpeaker();
    }
    const actor = game.actors.get(choice.actorId);
    return actor !== undefined ? ChatMessage.getSpeaker({ actor }) : { ...ChatMessage.getSpeaker(), token: null };
  }

  private messages(): FoundryChatMessageCollection {
    return this.globals().game.messages;
  }
}
