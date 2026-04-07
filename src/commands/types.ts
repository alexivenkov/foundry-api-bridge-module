import type { JournalData, ItemData, CompendiumMetadata, CompendiumData } from '@/types/foundry';

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
  | 'get-world-info'
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
  | 'set-turn'
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
  | 'get-scene-tokens'
  | 'get-actor-items'
  | 'use-item'
  | 'add-item-to-actor'
  | 'add-item-from-compendium'
  | 'update-actor-item'
  | 'delete-actor-item'
  | 'get-actor-effects'
  | 'toggle-actor-status'
  | 'add-actor-effect'
  | 'remove-actor-effect'
  | 'update-actor-effect'
  | 'get-scene'
  | 'get-scenes-list'
  | 'activate-scene'
  | 'activate-item'
  | 'get-journals'
  | 'get-journal'
  | 'get-items'
  | 'get-item'
  | 'get-compendiums'
  | 'get-compendium'
  | 'list-roll-tables'
  | 'get-roll-table'
  | 'roll-on-table'
  | 'reset-table'
  | 'create-roll-table'
  | 'update-roll-table'
  | 'delete-roll-table'
  | 'capture-scene';

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
  actorId?: string;
  flavor?: string;
  whisperTo?: string[];
  type?: 'ic' | 'ooc' | 'emote';
}

export interface SendChatMessageResult {
  messageId: string;
  sent: boolean;
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

export interface SetTurnParams {
  combatantId: string;
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
  system: Record<string, unknown>;
  items: ItemSummary[];
}

export interface ItemSummary {
  id: string;
  name: string;
  type: string;
  img: string;
  system: Record<string, unknown>;
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
export interface TokenHpData {
  value: number;
  max: number;
}

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
  hp?: TokenHpData;
  ac?: number;
  conditions: string[];
}

export interface SceneTokensResult {
  sceneId: string;
  sceneName: string;
  tokens: TokenResult[];
}

// Item Commands
export interface GetActorItemsParams {
  actorId: string;
  type?: string;
  equipped?: boolean;
  hasActivities?: boolean;
}

export interface UseItemParams {
  actorId: string;
  itemId: string;
  activityId?: string;
  activityType?: string;
  consume?: boolean;
  scaling?: number;
  showInChat?: boolean;
}

// Item Results
export interface ItemDetailSummary {
  id: string;
  name: string;
  type: string;
  img: string;
  equipped: boolean;
  quantity: number;
  hasActivities: boolean;
  activityTypes: string[];
  description: string;
  damage: Record<string, unknown> | null;
  range: Record<string, unknown> | null;
}

export interface ActorItemsResult {
  actorId: string;
  actorName: string;
  items: ItemDetailSummary[];
}

export interface ActivityInfo {
  id: string;
  name: string;
  type: string;
}

export interface UseItemResult {
  itemId: string;
  itemName: string;
  itemType: string;
  activityUsed?: ActivityInfo;
  rolls: RollResult[];
  chatMessageId?: string;
}

// Item CRUD Commands
export interface ItemSystemData {
  description?: { value: string };
  quantity?: number;
  weight?: { value: number; units?: string };
  price?: { value: number; denomination?: string };
  rarity?: string;
  identified?: boolean;
  equipped?: boolean;
  attunement?: number;
}

export interface AddItemToActorParams {
  actorId: string;
  name: string;
  type: string;
  img?: string;
  system?: ItemSystemData;
}

export interface AddItemFromCompendiumParams {
  actorId: string;
  packId: string;
  itemId: string;
  name?: string;
  quantity?: number;
}

export interface UpdateActorItemParams {
  actorId: string;
  itemId: string;
  name?: string;
  img?: string;
  system?: Partial<ItemSystemData>;
}

export interface DeleteActorItemParams {
  actorId: string;
  itemId: string;
}

export interface ItemResult {
  id: string;
  name: string;
  type: string;
  img: string;
  actorId: string;
  actorName: string;
}

// Effect Commands
export interface GetActorEffectsParams {
  actorId: string;
  includeDisabled?: boolean;
}

export interface EffectChangeData {
  key: string;
  value: string;
  mode: number;
}

export interface EffectDurationData {
  seconds?: number;
  rounds?: number;
  turns?: number;
}

export interface EffectSummary {
  id: string;
  name: string;
  img: string;
  disabled: boolean;
  isTemporary: boolean;
  statuses: string[];
  origin: string | null;
  changes?: EffectChangeData[];
  duration?: EffectDurationData;
}

export interface ActorEffectsResult {
  actorId: string;
  actorName: string;
  effects: EffectSummary[];
  activeStatuses: string[];
}

export interface ToggleActorStatusParams {
  actorId: string;
  statusId: string;
  active?: boolean;
  overlay?: boolean;
}

export interface ToggleStatusResult {
  actorId: string;
  statusId: string;
  active: boolean;
  effectId?: string;
}

export interface AddActorEffectParams {
  actorId: string;
  name: string;
  img?: string;
  disabled?: boolean;
  statuses?: string[];
  changes?: EffectChangeData[];
  duration?: EffectDurationData;
  origin?: string;
}

export interface AddEffectResult {
  actorId: string;
  effectId: string;
  name: string;
}

export interface RemoveActorEffectParams {
  actorId: string;
  effectId: string;
}

export interface RemoveEffectResult {
  actorId: string;
  effectId: string;
  removed: boolean;
}

export interface UpdateActorEffectParams {
  actorId: string;
  effectId: string;
  name?: string;
  img?: string;
  disabled?: boolean;
  changes?: EffectChangeData[];
  duration?: EffectDurationData;
}

export interface UpdateEffectResult {
  actorId: string;
  effectId: string;
  name: string;
}

// Activate Item Command (full automation pipeline)
export interface ActivateItemParams {
  actorId: string;
  itemId: string;
  activityId?: string;
  activityType?: string;
  targetTokenIds?: string[];
  templatePosition?: { x: number; y: number; direction?: number };
  spellLevel?: number;
}

export interface MidiWorkflowResult {
  attackTotal: number | undefined;
  damageTotal: number | undefined;
  isCritical: boolean;
  isFumble: boolean;
  hitTargetIds: string[];
  saveTargetIds: string[];
  failedSaveTargetIds: string[];
}

export interface ActivateItemResult {
  itemId: string;
  itemName: string;
  itemType: string;
  activityUsed?: ActivityInfo;
  activated: boolean;
  targetsSet: number;
  rolls: RollResult[];
  chatMessageId?: string;
  workflow?: MidiWorkflowResult;
}

// Scene Commands
export interface GetSceneParams {
  sceneId?: string;
  includeScreenshot?: boolean;
}

export type GetScenesListParams = Record<string, never>;

export interface ActivateSceneParams {
  sceneId: string;
}

// Scene Results
export interface SceneGridResult {
  size: number;
  type: number;
  units: string;
  distance: number;
}

export interface SceneNoteResult {
  x: number;
  y: number;
  text: string;
  label: string;
  entryId: string | null;
}

export interface SceneWallResult {
  c: number[];
  move: number;
  sense: number;
  door: number;
}

export interface SceneLightResult {
  x: number;
  y: number;
  bright: number;
  dim: number;
  color: string | null;
  angle: number;
  walls: boolean;
  hidden: boolean;
}

export interface SceneTileResult {
  x: number;
  y: number;
  width: number;
  height: number;
  img: string;
  hidden: boolean;
  elevation: number;
  rotation: number;
}

export interface SceneDrawingResult {
  x: number;
  y: number;
  shape: { type: string; width: number; height: number; points: number[] };
  text: string;
  hidden: boolean;
  fillColor: string | null;
  strokeColor: string | null;
}

export interface SceneRegionResult {
  id: string;
  name: string;
  color: string | null;
  shapes: { type: string }[];
}

export interface SceneTokenSummary {
  id: string;
  name: string;
  actorId: string | null;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  elevation: number;
  hidden: boolean;
  disposition: number;
  hp?: TokenHpData;
  ac?: number;
  conditions: string[];
}

export interface SceneDetailResult {
  id: string;
  name: string;
  active: boolean;
  img: string;
  width: number;
  height: number;
  grid: SceneGridResult;
  darkness: number;
  notes: SceneNoteResult[];
  walls: SceneWallResult[];
  lights: SceneLightResult[];
  tiles: SceneTileResult[];
  drawings: SceneDrawingResult[];
  regions: SceneRegionResult[];
  tokens: SceneTokenSummary[];
  asciiMap: string;
  screenshot?: SceneScreenshot;
}

export interface SceneScreenshot {
  image: string;
  mimeType: string;
  width: number;
  height: number;
}

export interface SceneSummaryResult {
  id: string;
  name: string;
  active: boolean;
  img: string;
}

export interface SceneListResult {
  scenes: SceneSummaryResult[];
}

export interface ActivateSceneResult {
  id: string;
  name: string;
  active: boolean;
}

// World Info (pull query)
export type GetWorldInfoParams = Record<string, never>;

export interface WorldInfoData {
  id: string;
  title: string;
  system: string;
  systemVersion: string;
  foundryVersion: string;
}

export interface WorldCounts {
  journals: number;
  actors: number;
  items: number;
  scenes: number;
}

export interface CompendiumMetaSummary {
  id: string;
  label: string;
  type: string;
  system: string;
  count: number;
}

export interface WorldInfoResult {
  world: WorldInfoData;
  counts: WorldCounts;
  compendiumMeta: CompendiumMetaSummary[];
}

// Pull query params (Batch 2)
export type GetJournalsParams = Record<string, never>;

export interface GetJournalParams {
  journalId: string;
}

export type GetItemsParams = Record<string, never>;

export interface GetItemParams {
  itemId: string;
}

export type GetCompendiumsParams = Record<string, never>;

export interface GetCompendiumParams {
  packId: string;
}

// Roll Table types
export type ListRollTablesParams = Record<string, never>;

export interface GetRollTableParams {
  tableId: string;
}

export interface RollOnTableParams {
  tableId: string;
  displayChat?: boolean;
}

export interface ResetTableParams {
  tableId: string;
}

export interface CreateTableResultData {
  text: string;
  range: [number, number];
  weight?: number;
  type?: number;
  documentCollection?: string;
  documentId?: string;
  img?: string;
}

export interface CreateRollTableParams {
  name: string;
  formula?: string;
  replacement?: boolean;
  displayRoll?: boolean;
  description?: string;
  img?: string;
  folder?: string;
  results?: CreateTableResultData[];
}

export interface UpdateRollTableParams {
  tableId: string;
  name?: string;
  formula?: string;
  replacement?: boolean;
  displayRoll?: boolean;
  description?: string;
  img?: string;
}

export interface DeleteRollTableParams {
  tableId: string;
}

export interface TableResultData {
  id: string;
  type: number;
  text: string;
  img: string;
  range: [number, number];
  weight: number;
  drawn: boolean;
  documentCollection: string | null;
  documentId: string | null;
}

export interface RollTableSummary {
  id: string;
  name: string;
  img: string;
  description: string;
  formula: string;
  replacement: boolean;
  totalResults: number;
  drawnResults: number;
}

export interface RollTableResult {
  id: string;
  name: string;
  img: string;
  description: string;
  formula: string;
  replacement: boolean;
  displayRoll: boolean;
  results: TableResultData[];
}

export interface RollOnTableResult {
  tableId: string;
  tableName: string;
  roll: {
    formula: string;
    total: number;
  };
  results: TableResultData[];
}

export interface ResetTableResult {
  tableId: string;
  tableName: string;
  resetCount: number;
}

// Capture Scene types
export type CaptureSceneParams = Record<string, never>;

export interface CaptureSceneResult {
  sceneId: string;
  sceneName: string;
  image: string;
  mimeType: string;
  width: number;
  height: number;
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
  'get-world-info': GetWorldInfoParams;
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
  'set-turn': SetTurnParams;
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
  'get-actor-items': GetActorItemsParams;
  'use-item': UseItemParams;
  'add-item-to-actor': AddItemToActorParams;
  'add-item-from-compendium': AddItemFromCompendiumParams;
  'update-actor-item': UpdateActorItemParams;
  'delete-actor-item': DeleteActorItemParams;
  'get-actor-effects': GetActorEffectsParams;
  'toggle-actor-status': ToggleActorStatusParams;
  'add-actor-effect': AddActorEffectParams;
  'remove-actor-effect': RemoveActorEffectParams;
  'update-actor-effect': UpdateActorEffectParams;
  'get-scene': GetSceneParams;
  'get-scenes-list': GetScenesListParams;
  'activate-scene': ActivateSceneParams;
  'activate-item': ActivateItemParams;
  'get-journals': GetJournalsParams;
  'get-journal': GetJournalParams;
  'get-items': GetItemsParams;
  'get-item': GetItemParams;
  'get-compendiums': GetCompendiumsParams;
  'get-compendium': GetCompendiumParams;
  'list-roll-tables': ListRollTablesParams;
  'get-roll-table': GetRollTableParams;
  'roll-on-table': RollOnTableParams;
  'reset-table': ResetTableParams;
  'create-roll-table': CreateRollTableParams;
  'update-roll-table': UpdateRollTableParams;
  'delete-roll-table': DeleteRollTableParams;
  'capture-scene': CaptureSceneParams;
}

export interface CommandResultMap {
  'roll-dice': RollResult;
  'roll-ability': RollResult;
  'roll-skill': RollResult;
  'roll-save': RollResult;
  'roll-attack': RollResult;
  'roll-damage': RollResult;
  'get-world-info': WorldInfoResult;
  'get-actors': ActorSummary[];
  'get-actor': ActorDetailResult;
  'create-actor': ActorResult;
  'create-actor-from-compendium': ActorResult;
  'update-actor': ActorResult;
  'delete-actor': DeleteResult;
  'send-chat-message': SendChatMessageResult;
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
  'set-turn': CombatResult;
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
  'get-actor-items': ActorItemsResult;
  'use-item': UseItemResult;
  'add-item-to-actor': ItemResult;
  'add-item-from-compendium': ItemResult;
  'update-actor-item': ItemResult;
  'delete-actor-item': DeleteResult;
  'get-actor-effects': ActorEffectsResult;
  'toggle-actor-status': ToggleStatusResult;
  'add-actor-effect': AddEffectResult;
  'remove-actor-effect': RemoveEffectResult;
  'update-actor-effect': UpdateEffectResult;
  'get-scene': SceneDetailResult;
  'get-scenes-list': SceneListResult;
  'activate-scene': ActivateSceneResult;
  'activate-item': ActivateItemResult;
  'get-journals': JournalData[];
  'get-journal': JournalData;
  'get-items': ItemData[];
  'get-item': ItemData;
  'get-compendiums': CompendiumMetadata[];
  'get-compendium': CompendiumData;
  'list-roll-tables': RollTableSummary[];
  'get-roll-table': RollTableResult;
  'roll-on-table': RollOnTableResult;
  'reset-table': ResetTableResult;
  'create-roll-table': RollTableResult;
  'update-roll-table': RollTableResult;
  'delete-roll-table': DeleteResult;
  'capture-scene': CaptureSceneResult;
}