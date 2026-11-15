import type { FoundryActorLike, FoundryActorsGame } from '@/core/shared';

export interface FoundryChatSpeaker {
  alias?: string | undefined;
  actor?: string | null | undefined;
  token?: string | null | undefined;
  scene?: string | null | undefined;
}

export interface FoundryChatUser {
  id: string;
  name: string;
}

export interface FoundryChatRoll {
  formula: string;
  total: number;
}

/** The ChatMessage document fields the context reads (`BaseChatMessage` schema, Foundry 13–14). */
export interface FoundryChatMessageDocument {
  id: string;
  timestamp: number;
  style: number;
  content: string;
  flavor: string;
  whisper: string[];
  blind?: boolean;
  speaker: FoundryChatSpeaker;
  rolls: FoundryChatRoll[];
  isRoll: boolean;
  author: FoundryChatUser | null;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
  export(): string;
}

export interface FoundryChatMessageCollection {
  contents: FoundryChatMessageDocument[];
  get(id: string): FoundryChatMessageDocument | undefined;
}

export interface FoundryChatMessageData {
  content: string;
  speaker: FoundryChatSpeaker;
  flavor?: string;
  whisper?: string[];
  blind?: boolean;
  style?: number;
  /** Foundry 11 only, where the style of a message was its numeric `type`. */
  type?: number;
}

export interface FoundryChatStyleCodes {
  IC: number;
  OOC: number;
  EMOTE: number;
}

/** `CONST`, as far as chat needs it. */
export interface FoundryChatConstants {
  /** Foundry 12 and later. */
  CHAT_MESSAGE_STYLES?: FoundryChatStyleCodes;
  /** Foundry 11; a deprecated alias in 12 and 13, gone in 14. */
  CHAT_MESSAGE_TYPES?: FoundryChatStyleCodes;
}

export interface FoundryChatActor {
  name?: string;
}

/**
 * The core builds a speaker for a token only from a real `TokenDocument` (or
 * placeable), for an actor only from a real `Actor`; anything else counts as
 * not given.
 */
export interface FoundryChatSpeakerOptions {
  actor?: FoundryChatActor;
  token?: object;
  alias?: string;
}

export interface FoundryChatMessageClass {
  create(data: FoundryChatMessageData): Promise<{ id: string } | null | undefined>;
  /**
   * Without an actor or token: the speaker for the current user — the
   * controlled token, else the user's character. With an actor: that actor,
   * through its own token on the viewed scene when it has one, otherwise
   * through no token. With a token: that token and its actor.
   */
  getSpeaker(options?: FoundryChatSpeakerOptions): FoundryChatSpeaker;
  deleteDocuments(ids: string[]): Promise<unknown>;
  /**
   * Writes `whisper` and `blind` for a roll mode code (`CONST.DICE_ROLL_MODES`).
   * Foundry 13 and older; a deprecated alias of `applyMode` in 14.
   */
  applyRollMode?: (data: FoundryChatMessageData, rollMode: string) => unknown;
  /** Writes `whisper` and `blind` for a key of `CONFIG.ChatMessage.modes`. Foundry 14. */
  applyMode?: (data: FoundryChatMessageData, mode: string) => unknown;
}

export interface FoundryChatGame {
  messages: FoundryChatMessageCollection;
  actors: { get(id: string): FoundryChatActor | undefined };
}

export interface FoundryChatGlobals {
  game: FoundryChatGame;
  ChatMessage: FoundryChatMessageClass;
  CONST?: FoundryChatConstants;
}

export type ChatGlobalsProvider = () => FoundryChatGlobals;

/** What speakers are built from: world actors, scene tokens and the core's `getSpeaker`. */
export interface FoundryChatSpeakerGlobals {
  game: FoundryActorsGame;
  ChatMessage: Pick<FoundryChatMessageClass, 'getSpeaker'>;
}

export type ChatSpeakerGlobalsProvider = () => FoundryChatSpeakerGlobals;

export interface FoundryChatUserGlobals {
  game: { users: { get(id: string): FoundryChatUser | undefined } };
  ChatMessage: {
    /** The users a /whisper target names: `gm` / `dm`, `players`, a user name, a player's character name. */
    getWhisperRecipients(name: string): FoundryChatUser[];
  };
}

export type ChatUserGlobalsProvider = () => FoundryChatUserGlobals;

export interface FoundryChatWorldGame extends FoundryChatGame, FoundryActorsGame {
  actors: { get(id: string): FoundryActorLike | undefined };
  users: { get(id: string): FoundryChatUser | undefined };
}

/** Everything the composed chat service reads. */
export interface FoundryChatWorldGlobals extends FoundryChatGlobals {
  game: FoundryChatWorldGame;
  ChatMessage: FoundryChatMessageClass & FoundryChatUserGlobals['ChatMessage'];
}

export type ChatWorldGlobalsProvider = () => FoundryChatWorldGlobals;
