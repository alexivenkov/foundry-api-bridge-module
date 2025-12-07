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
  | 'create-actor'
  | 'create-actor-from-compendium'
  | 'update-actor'
  | 'delete-actor'
  | 'send-chat-message'
  | 'create-journal'
  | 'update-journal'
  | 'delete-journal'
  | 'create-journal-page'
  | 'update-journal-page'
  | 'delete-journal-page'
  | 'create-combat'
  | 'add-combatant'
  | 'remove-combatant'
  | 'start-combat'
  | 'end-combat'
  | 'delete-combat'
  | 'next-turn'
  | 'previous-turn'
  | 'get-combat-state'
  | 'roll-initiative'
  | 'set-initiative'
  | 'roll-all-initiative'
  | 'update-combatant'
  | 'set-combatant-defeated'
  | 'toggle-combatant-visibility'
  | 'create-token'
  | 'delete-token'
  | 'move-token'
  | 'update-token'
  | 'get-scene-tokens';

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

// Actor Commands
export interface CreateActorParams {
  name: string;
  type: string;
  folder?: string;
  img?: string;
  system?: Record<string, unknown>;
}

export interface CreateActorFromCompendiumParams {
  packId: string;
  actorId: string;
  name?: string;
  folder?: string;
}

export interface UpdateActorParams {
  actorId: string;
  name?: string;
  img?: string;
  folder?: string;
  system?: Record<string, unknown>;
}

export interface DeleteActorParams {
  actorId: string;
}

// Actor Results
export interface ActorResult {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: string | null;
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

// Combat Commands
export interface CreateCombatParams {
  sceneId?: string;
  activate?: boolean;
}

export interface AddCombatantParams {
  combatId?: string;
  actorId: string;
  tokenId?: string;
  initiative?: number;
  hidden?: boolean;
}

export interface RemoveCombatantParams {
  combatId?: string;
  combatantId: string;
}

export interface CombatIdParams {
  combatId?: string;
}

export interface RollInitiativeParams {
  combatId?: string;
  combatantIds: string[];
  formula?: string;
}

export interface SetInitiativeParams {
  combatId?: string;
  combatantId: string;
  initiative: number;
}

export interface RollAllInitiativeParams {
  combatId?: string;
  formula?: string;
  npcsOnly?: boolean;
}

export interface UpdateCombatantParams {
  combatId?: string;
  combatantId: string;
  initiative?: number;
  defeated?: boolean;
  hidden?: boolean;
}

export interface SetCombatantDefeatedParams {
  combatId?: string;
  combatantId: string;
  defeated: boolean;
}

export interface ToggleCombatantVisibilityParams {
  combatId?: string;
  combatantId: string;
}

// Token Commands
export interface CreateTokenParams {
  sceneId?: string;
  actorId: string;
  x: number;
  y: number;
  hidden?: boolean;
  elevation?: number;
  rotation?: number;
  scale?: number;
}

export interface DeleteTokenParams {
  sceneId?: string;
  tokenId: string;
}

export interface MoveTokenParams {
  sceneId?: string;
  tokenId: string;
  x: number;
  y: number;
  elevation?: number;
  rotation?: number;
  animate?: boolean;
}

export interface UpdateTokenParams {
  sceneId?: string;
  tokenId: string;
  hidden?: boolean;
  elevation?: number;
  rotation?: number;
  scale?: number;
  name?: string;
  displayName?: number;
  disposition?: number;
  lockRotation?: boolean;
}

export interface GetSceneTokensParams {
  sceneId?: string;
}

export interface InitiativeResult {
  combatantId: string;
  name: string;
  initiative: number;
}

export interface InitiativeRollResult {
  results: InitiativeResult[];
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

// Combat Results
export interface CombatantResult {
  id: string;
  actorId: string;
  tokenId: string | null;
  name: string;
  img: string;
  initiative: number | null;
  defeated: boolean;
  hidden: boolean;
}

export interface CombatResult {
  id: string;
  round: number;
  turn: number;
  started: boolean;
  combatants: CombatantResult[];
  current: CombatantResult | null;
}

// Token Results
export interface TokenResult {
  id: string;
  name: string;
  actorId: string | null;
  x: number;
  y: number;
  elevation: number;
  rotation: number;
  hidden: boolean;
  img: string;
  disposition: number;
}

export interface SceneTokensResult {
  sceneId: string;
  sceneName: string;
  tokens: TokenResult[];
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
  'create-actor': CreateActorParams;
  'create-actor-from-compendium': CreateActorFromCompendiumParams;
  'update-actor': UpdateActorParams;
  'delete-actor': DeleteActorParams;
  'send-chat-message': SendChatMessageParams;
  'create-journal': CreateJournalParams;
  'update-journal': UpdateJournalParams;
  'delete-journal': DeleteJournalParams;
  'create-journal-page': CreateJournalPageParams;
  'update-journal-page': UpdateJournalPageParams;
  'delete-journal-page': DeleteJournalPageParams;
  'create-combat': CreateCombatParams;
  'add-combatant': AddCombatantParams;
  'remove-combatant': RemoveCombatantParams;
  'start-combat': CombatIdParams;
  'end-combat': CombatIdParams;
  'delete-combat': CombatIdParams;
  'next-turn': CombatIdParams;
  'previous-turn': CombatIdParams;
  'get-combat-state': CombatIdParams;
  'roll-initiative': RollInitiativeParams;
  'set-initiative': SetInitiativeParams;
  'roll-all-initiative': RollAllInitiativeParams;
  'update-combatant': UpdateCombatantParams;
  'set-combatant-defeated': SetCombatantDefeatedParams;
  'toggle-combatant-visibility': ToggleCombatantVisibilityParams;
  'create-token': CreateTokenParams;
  'delete-token': DeleteTokenParams;
  'move-token': MoveTokenParams;
  'update-token': UpdateTokenParams;
  'get-scene-tokens': GetSceneTokensParams;
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
  'create-actor': ActorResult;
  'create-actor-from-compendium': ActorResult;
  'update-actor': ActorResult;
  'delete-actor': DeleteResult;
  'send-chat-message': { sent: boolean };
  'create-journal': JournalResult;
  'update-journal': JournalResult;
  'delete-journal': DeleteResult;
  'create-journal-page': JournalPageResult;
  'update-journal-page': JournalPageResult;
  'delete-journal-page': DeleteResult;
  'create-combat': CombatResult;
  'add-combatant': CombatantResult;
  'remove-combatant': DeleteResult;
  'start-combat': CombatResult;
  'end-combat': DeleteResult;
  'delete-combat': DeleteResult;
  'next-turn': CombatResult;
  'previous-turn': CombatResult;
  'get-combat-state': CombatResult;
  'roll-initiative': InitiativeRollResult;
  'set-initiative': CombatantResult;
  'roll-all-initiative': InitiativeRollResult;
  'update-combatant': CombatantResult;
  'set-combatant-defeated': CombatantResult;
  'toggle-combatant-visibility': CombatantResult;
  'create-token': TokenResult;
  'delete-token': DeleteResult;
  'move-token': TokenResult;
  'update-token': TokenResult;
  'get-scene-tokens': SceneTokensResult;
}