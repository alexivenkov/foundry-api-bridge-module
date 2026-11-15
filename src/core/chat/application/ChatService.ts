import {
  TargetTokenNotFoundError,
  requireScene,
  type ActorLocator,
  type SceneLocator
} from '@/core/shared';
import {
  ChatMessageCreationCancelledError,
  ChatMessageNotFoundError,
  EmptyChatMessageError,
  NoChatMessageChangesError,
  WhisperRecipientNotFoundError,
  assertVisibilityFitsRecipients,
  chooseSpeaker,
  hasChanges,
  mergeRecipients,
  selectChatHistory,
  toTranscriptRecord,
  type ChatActorDirectory,
  type ChatLog,
  type ChatMessage,
  type ChatRoll,
  type ChatSpeakerChoice,
  type ChatSpeakers,
  type ChatUserDirectory,
  type ResolvedChatSpeaker
} from '@/core/chat/domain';
import type {
  DeleteChatMessageCommand,
  ExportChatQuery,
  ListChatMessagesQuery,
  SendChatMessageCommand,
  TokenAddress,
  UpdateChatMessageCommand
} from './commands';
import { requirePort } from './requirePort';

export interface ChatServiceDependencies {
  readonly log: ChatLog;
  readonly actors: ChatActorDirectory;
  /** Recipients given by name. */
  readonly users?: ChatUserDirectory | undefined;
  /** Token speakers and a standalone alias. */
  readonly speakers?: ChatSpeakers | undefined;
  readonly scenes?: SceneLocator | undefined;
  readonly locator?: ActorLocator | undefined;
}

export interface ChatHistoryEntry {
  readonly message: ChatMessage;
  /** Empty unless the rolls were asked for. */
  readonly rolls: readonly ChatRoll[];
}

export interface ChatHistoryPage {
  readonly entries: readonly ChatHistoryEntry[];
  /** Size of the whole log, before any filter. */
  readonly total: number;
  readonly hasMore: boolean;
}

export interface ChatExport {
  readonly content: string;
  readonly messageCount: number;
}

export class ChatService {
  constructor(private readonly deps: ChatServiceDependencies) {}

  listMessages(query: ListChatMessagesQuery): ChatHistoryPage {
    const log = this.deps.log.listMessages();
    const { messages, hasMore } = selectChatHistory(log, query.filter);
    return {
      entries: messages.map((message) => ({
        message,
        rolls: query.includeRolls ? this.deps.log.listRolls(message.id) : []
      })),
      total: log.length,
      hasMore
    };
  }

  /** Resolves to the id of the new message. */
  async sendMessage(command: SendChatMessageCommand): Promise<string> {
    if (command.content.trim() === '') {
      throw new EmptyChatMessageError();
    }

    const recipients = command.recipients ?? [];
    const whisper =
      recipients.length > 0 ? mergeRecipients(command.whisperTo, this.resolveRecipients(recipients)) : command.whisperTo;
    assertVisibilityFitsRecipients(command.visibility, whisper);

    const messageId = await this.deps.log.postMessage({
      content: command.content,
      speaker: this.chooseMessageSpeaker(command),
      flavor: command.flavor,
      whisper: whisper.length > 0 ? whisper : undefined,
      style: command.style,
      visibility: command.visibility
    });
    if (messageId === null) {
      throw new ChatMessageCreationCancelledError();
    }
    return messageId;
  }

  async updateMessage(command: UpdateChatMessageCommand): Promise<void> {
    this.requireMessage(command.messageId);
    if (!hasChanges(command.changes)) {
      throw new NoChatMessageChangesError();
    }
    if (!(await this.deps.log.updateMessage(command.messageId, command.changes))) {
      throw new ChatMessageNotFoundError(command.messageId);
    }
  }

  async deleteMessage(command: DeleteChatMessageCommand): Promise<void> {
    this.requireMessage(command.messageId);
    await this.deps.log.deleteMessage(command.messageId);
  }

  /** Deletes every message; resolves to how many there were. */
  async clearChat(): Promise<number> {
    const messageIds = this.deps.log.listMessageIds();
    if (messageIds.length > 0) {
      await this.deps.log.deleteMessages(messageIds);
    }
    return messageIds.length;
  }

  /** An empty log exports as an empty string in either format. */
  exportChat(query: ExportChatQuery): ChatExport {
    if (query.format === 'json') {
      const messages = this.deps.log.listMessages();
      return {
        content: messages.length > 0 ? JSON.stringify(messages.map(toTranscriptRecord)) : '',
        messageCount: messages.length
      };
    }

    const entries = this.deps.log.exportEntries();
    return { content: entries.join('\n'), messageCount: entries.length };
  }

  /** A user id stands for itself; anything else is read the way the core's /whisper reads a name. */
  private resolveRecipients(recipients: readonly string[]): string[] {
    const users = requirePort(this.deps.users, 'users');
    return recipients.flatMap((recipient) => {
      if (users.hasUser(recipient)) {
        return [recipient];
      }
      const found = users.findRecipients(recipient);
      if (found.length === 0) {
        throw new WhisperRecipientNotFoundError(recipient);
      }
      return [...found];
    });
  }

  /** A token wins over an actor; the alias, when given, is always the name spoken under. */
  private chooseMessageSpeaker(command: SendChatMessageCommand): ChatSpeakerChoice {
    if (command.speakerToken !== undefined) {
      return { resolved: this.tokenSpeaker(command.speakerToken, command.alias) };
    }
    if (command.actorId !== undefined) {
      const choice = chooseSpeaker(command.actorId, this.deps.actors.findActorName(command.actorId), command.speakerName);
      return command.alias !== undefined ? { ...choice, alias: command.alias } : choice;
    }
    if (command.alias !== undefined) {
      return { resolved: requirePort(this.deps.speakers, 'speakers').standaloneSpeaker(command.alias) };
    }
    return chooseSpeaker(undefined, null, command.speakerName);
  }

  private tokenSpeaker(address: TokenAddress, alias: string | undefined): ResolvedChatSpeaker {
    const scene = requireScene(requirePort(this.deps.scenes, 'scenes'), address.sceneId);
    const token = requirePort(this.deps.locator, 'locator').findToken(scene.id, address.tokenId);
    if (token === null) {
      throw new TargetTokenNotFoundError(address.tokenId);
    }
    return requirePort(this.deps.speakers, 'speakers').speakerFor(
      { kind: 'token', sceneId: scene.id, tokenId: token.id },
      alias
    );
  }

  private requireMessage(messageId: string): void {
    if (!this.deps.log.hasMessage(messageId)) {
      throw new ChatMessageNotFoundError(messageId);
    }
  }
}
