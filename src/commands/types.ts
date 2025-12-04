export interface Command<T = unknown> {
  id: string;
  type: CommandType;
  params: T;
}

export interface CommandResponse<T = unknown> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
}

export type CommandType =
  | 'roll-dice'
  | 'roll-ability'
  | 'roll-skill'
  | 'roll-save'
  | 'roll-attack'
  | 'roll-damage'
  | 'get-actors'
  | 'get-actor'
  | 'send-chat-message'
  | 'create-journal'
  | 'update-journal'
  | 'delete-journal'
  | 'create-journal-page'
  | 'update-journal-page'
  | 'delete-journal-page';

export interface RollDiceParams {
  formula: string;
  showInChat?: boolean;
  flavor?: string;
}

export interface RollAbilityParams {
  actorId: string;
  ability: AbilityKey;
  showInChat?: boolean;
}

export interface RollSkillParams {
  actorId: string;
  skill: string;
  showInChat?: boolean;
}

export interface RollSaveParams {
  actorId: string;
  ability: AbilityKey;
  showInChat?: boolean;
}

export interface RollAttackParams {
  actorId: string;
  itemId: string;
  advantage?: boolean;
  disadvantage?: boolean;
  showInChat?: boolean;
}

export interface RollDamageParams {
  actorId: string;
  itemId: string;
  critical?: boolean;
  showInChat?: boolean;
}

export interface GetActorParams {
  actorId: string;
}

export interface SendChatMessageParams {
  content: string;
  speaker?: string;
}

// Journal Commands
export type JournalPageType = 'text' | 'image' | 'video';

export interface CreateJournalParams {
  name: string;
  folder?: string;
  content?: string;
  pageType?: JournalPageType;
}

export interface UpdateJournalParams {
  journalId: string;
  name?: string;
  folder?: string;
}

export interface DeleteJournalParams {
  journalId: string;
}

export interface CreateJournalPageParams {
  journalId: string;
  name: string;
  type?: JournalPageType;
  content?: string;
}

export interface UpdateJournalPageParams {
  journalId: string;
  pageId: string;
  name?: string;
  content?: string;
}

export interface DeleteJournalPageParams {
  journalId: string;
  pageId: string;
}

export interface RollResult {
  total: number;
  formula: string;
  dice: DiceResult[];
  isCritical?: boolean;
  isFumble?: boolean;
}

export interface DiceResult {
  type: string;
  count: number;
  results: number[];
}

export interface ActorListResult {
  actors: ActorSummary[];
}

export interface ActorSummary {
  id: string;
  name: string;
  type: string;
  img: string;
}

export interface ActorDetailResult {
  id: string;
  name: string;
  type: string;
  img: string;
  hp: { value: number; max: number };
  ac: number;
  abilities: Record<AbilityKey, AbilityScore>;
  skills: Record<string, SkillInfo>;
  items: ItemSummary[];
}

export interface AbilityScore {
  value: number;
  modifier: number;
}

export interface SkillInfo {
  total: number;
  proficient: boolean;
}

export interface ItemSummary {
  id: string;
  name: string;
  type: string;
  img: string;
}

// Journal Results
export interface JournalPageResult {
  id: string;
  name: string;
  type: string;
}

export interface JournalResult {
  id: string;
  name: string;
  folder: string | null;
  pages: JournalPageResult[];
}

export interface DeleteResult {
  deleted: boolean;
}

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export const ABILITY_KEYS: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export type CommandHandler<TParams = unknown, TResult = unknown> = (
  params: TParams
) => Promise<TResult>;

export interface CommandParamsMap {
  'roll-dice': RollDiceParams;
  'roll-ability': RollAbilityParams;
  'roll-skill': RollSkillParams;
  'roll-save': RollSaveParams;
  'roll-attack': RollAttackParams;
  'roll-damage': RollDamageParams;
  'get-actors': Record<string, never>;
  'get-actor': GetActorParams;
  'send-chat-message': SendChatMessageParams;
  'create-journal': CreateJournalParams;
  'update-journal': UpdateJournalParams;
  'delete-journal': DeleteJournalParams;
  'create-journal-page': CreateJournalPageParams;
  'update-journal-page': UpdateJournalPageParams;
  'delete-journal-page': DeleteJournalPageParams;
}

export interface CommandResultMap {
  'roll-dice': RollResult;
  'roll-ability': RollResult;
  'roll-skill': RollResult;
  'roll-save': RollResult;
  'roll-attack': RollResult;
  'roll-damage': RollResult;
  'get-actors': ActorListResult;
  'get-actor': ActorDetailResult;
  'send-chat-message': { sent: boolean };
  'create-journal': JournalResult;
  'update-journal': JournalResult;
  'delete-journal': DeleteResult;
  'create-journal-page': JournalPageResult;
  'update-journal-page': JournalPageResult;
  'delete-journal-page': DeleteResult;
}