import type { ActorRef } from '@/core/shared/domain';
import type {
  ChatMessage,
  ChatMessageChanges,
  ChatMessageDraft,
  ChatRoll,
  ResolvedChatSpeaker
} from '@/core/chat/domain/model/ChatMessage';
import type { ChatVisibility } from '@/core/chat/domain/model/ChatVisibility';
import type { DiceRoll } from '@/core/chat/domain/model/DiceRoll';
import type { RollDataSpec } from '@/core/chat/domain/model/RollData';

// Reads are synchronous: the chat log lives in memory.
export interface ChatLog {
  /** Every message, oldest first. */
  listMessages(): readonly ChatMessage[];
  listMessageIds(): readonly string[];
  hasMessage(messageId: string): boolean;
  /** The rolls a message carries; none when it has no rolls or is gone. */
  listRolls(messageId: string): readonly ChatRoll[];
  /** Resolves to the id of the new message, or to null when the core created nothing. */
  postMessage(draft: ChatMessageDraft): Promise<string | null>;
  /** Resolves to false when the message is gone. */
  updateMessage(messageId: string, changes: ChatMessageChanges): Promise<boolean>;
  deleteMessage(messageId: string): Promise<void>;
  deleteMessages(messageIds: readonly string[]): Promise<void>;
  /** The log as the core's own chat export writes it, one entry per message. */
  exportEntries(): readonly string[];
}

/** The actors a message may speak for. */
export interface ChatActorDirectory {
  findActorName(actorId: string): string | null;
}

/** The users a message may be whispered to. */
export interface ChatUserDirectory {
  hasUser(userId: string): boolean;
  /**
   * The ids of the users a name stands for, as the core's /whisper reads it:
   * `gm` / `dm`, `players`, a user name, a player's character name (case is
   * ignored). None for a name that stands for no user.
   */
  findRecipients(name: string): readonly string[];
}

/** Speakers as the core builds them. */
export interface ChatSpeakers {
  /**
   * An actor speaks through its own token on the viewed scene when it has one,
   * a token through itself. The alias replaces the name the core proposes.
   */
  speakerFor(subject: ActorRef, alias: string | undefined): ResolvedChatSpeaker;
  /** A speaker that names no actor and no token, only the alias. */
  standaloneSpeaker(alias: string): ResolvedChatSpeaker;
}

export interface DiceRoller {
  /**
   * Parses a formula without rolling it; a malformed formula fails with the
   * core's own error. With roll data the core substitutes the `@path`
   * references, an unset one as 0.
   */
  prepare(formula: string, data?: RollDataSpec): PreparedRoll;
}

export interface RollPostOptions {
  readonly speaker?: ResolvedChatSpeaker | undefined;
  /** The GM's own roll mode when absent. */
  readonly visibility?: ChatVisibility | undefined;
}

export interface PreparedRoll {
  /** How many dice each dice term asks for; null where the count is itself an expression. */
  readonly diceCounts: readonly (number | null)[];
  roll(): Promise<DiceRoll>;
  /** Posts the rolled result to the chat log. `null` flavor is handed to the core as given. */
  post(flavor: string | null | undefined, options?: RollPostOptions): Promise<void>;
}

/** What the core can tell about a formula without posting anything. */
export interface RollFormulaInspector {
  /** The core's own verdict, on the formula with the roll data substituted when there is any. */
  isValid(formula: string, data: RollDataSpec | undefined): boolean;
  /** The `@path` references the roll data does not set, each once; all of them without roll data. */
  findUnresolvedReferences(formula: string, data: RollDataSpec | undefined): readonly string[];
  /** The totals of rolling the formula the given number of times. */
  simulate(formula: string, data: RollDataSpec | undefined, iterations: number): Promise<readonly number[]>;
}
