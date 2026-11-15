import type { ActorTarget } from '@/core/shared';
import type {
  ChatExportFormat,
  ChatHistoryFilter,
  ChatMessageChanges,
  ChatVisibility,
  RollDataValues,
  SpokenStyle
} from '@/core/chat/domain';

export interface ListChatMessagesQuery {
  readonly filter: ChatHistoryFilter;
  /** Report the rolls of the listed messages. */
  readonly includeRolls: boolean;
}

export interface TokenAddress {
  readonly tokenId: string;
  /** The active scene when absent. */
  readonly sceneId: string | undefined;
}

export interface SendChatMessageCommand {
  readonly content: string;
  /** The actor the message speaks for. */
  readonly actorId: string | undefined;
  readonly speakerName: string | undefined;
  readonly flavor: string | undefined;
  /** User ids; empty for a public message. */
  readonly whisperTo: readonly string[];
  readonly style: SpokenStyle | undefined;
  readonly visibility?: ChatVisibility | undefined;
  /** User ids or names, read the way the core's /whisper reads them; added to `whisperTo`. */
  readonly recipients?: readonly string[] | undefined;
  /** The token that speaks; it wins over the actor. */
  readonly speakerToken?: TokenAddress | undefined;
  /** The name spoken under, whoever speaks; alone, it names no actor or token at all. */
  readonly alias?: string | undefined;
}

export interface UpdateChatMessageCommand {
  readonly messageId: string;
  readonly changes: ChatMessageChanges;
}

export interface DeleteChatMessageCommand {
  readonly messageId: string;
}

export interface ExportChatQuery {
  readonly format: ChatExportFormat;
}

export interface RollDiceCommand {
  readonly formula: string;
  readonly showInChat: boolean;
  readonly flavor: string | null | undefined;
  /** Matters only when the roll is posted. */
  readonly visibility?: ChatVisibility | undefined;
  /** Who rolls: its roll data feeds the formula and it speaks the posted roll. */
  readonly roller?: ActorTarget | undefined;
  /** The name the posted roll is spoken under. */
  readonly alias?: string | undefined;
  readonly data?: RollDataValues | undefined;
}

export interface ValidateRollFormulaQuery {
  readonly formula: string;
  /** Whose roll data the references are checked against. */
  readonly roller?: ActorTarget | undefined;
  readonly data?: RollDataValues | undefined;
}

export interface SimulateRollQuery {
  readonly formula: string;
  readonly iterations: number;
  readonly roller?: ActorTarget | undefined;
  readonly data?: RollDataValues | undefined;
}
