export interface FoundryChatSpeaker {
  alias: string | undefined;
  actor: string | undefined;
  token: string | undefined;
  scene: string | undefined;
}

export interface FoundryChatMessageDocument {
  id: string;
  timestamp: number;
  style: number;
  content: string;
  flavor: string;
  whisper: string[];
  blind: boolean;
  speaker: FoundryChatSpeaker;
  rolls: FoundryRollJson[];
  isRoll: boolean;
  author: FoundryChatUser | null;
  update(data: Record<string, unknown>): Promise<FoundryChatMessageDocument>;
  delete(): Promise<FoundryChatMessageDocument>;
  export(): string;
}

export interface FoundryRollJson {
  formula: string;
  total: number;
}

export interface FoundryChatUser {
  id: string;
  name: string;
}

export interface FoundryChatMessageCollection {
  contents: FoundryChatMessageDocument[];
  get(id: string): FoundryChatMessageDocument | undefined;
  size: number;
}

export interface FoundryChatMessageConstructor {
  create(data: Record<string, unknown>): Promise<{ id: string }>;
  getSpeaker(): FoundryChatSpeaker;
  deleteDocuments(ids: string[]): Promise<unknown>;
  STYLE: { OTHER: number; OOC: number; IC: number; EMOTE: number };
}

export interface FoundryChatGame {
  messages: FoundryChatMessageCollection;
  users: { get(id: string): FoundryChatUser | undefined };
}

export type ChatStyleString = 'other' | 'ooc' | 'ic' | 'emote';

export const STYLE_TO_STRING: Partial<Record<number, ChatStyleString>> = {
  0: 'other',
  1: 'ooc',
  2: 'ic',
  3: 'emote'
};

export const STRING_TO_STYLE: Record<string, number> = {
  ooc: 1,
  ic: 2,
  emote: 3
};

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
}
