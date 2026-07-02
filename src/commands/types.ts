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
  | 'dnd5e/roll-ability'
  | 'roll-ability' // @deprecated alias of 'dnd5e/roll-ability'
  | 'dnd5e/roll-skill'
  | 'roll-skill' // @deprecated alias of 'dnd5e/roll-skill'
  | 'dnd5e/roll-save'
  | 'roll-save' // @deprecated alias of 'dnd5e/roll-save'
  | 'dnd5e/roll-attack'
  | 'roll-attack' // @deprecated alias of 'dnd5e/roll-attack'
  | 'dnd5e/roll-damage'
  | 'roll-damage' // @deprecated alias of 'dnd5e/roll-damage'
  | 'dnd5e/roll-perception'
  | 'roll-perception'
  | 'pf2e/roll-skill'
  | 'pf2e/roll-save'
  | 'pf2e/roll-perception'
  | 'pf2e/set-condition'
  | 'pf2e/remove-condition'
  | 'pf2e/get-conditions'
  | 'pf2e/increase-condition'
  | 'pf2e/decrease-condition'
  | 'pf2e/list-strikes'
  | 'pf2e/roll-strike'
  | 'pf2e/roll-strike-damage'
  | 'pf2e/use-consumable'
  | 'pf2e/cast-spell'
  | 'pf2e/post-item'
  | 'get-world-info'
  | 'get-actors'
  | 'filter-actors'
  | 'filter-items'
  | 'get-actor'
  | 'create-actor'
  | 'create-actor-from-compendium'
  | 'update-actor'
  | 'delete-actor'
  | 'create-scene'
  | 'update-scene'
  | 'delete-scene'
  | 'clone-scene'
  | 'view-scene'
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
  | 'get-token'
  | 'get-token-by-actor'
  | 'set-token-target'
  | 'clear-targets'
  | 'get-tokens-in-range'
  | 'get-actor-items'
  | 'dnd5e/use-item'
  | 'use-item' // @deprecated alias of 'dnd5e/use-item'
  | 'add-item-to-actor'
  | 'add-item-from-compendium'
  | 'update-actor-item'
  | 'delete-actor-item'
  | 'create-item'
  | 'create-item-from-compendium'
  | 'update-item'
  | 'delete-item'
  | 'get-actor-effects'
  | 'toggle-actor-status'
  | 'add-actor-effect'
  | 'remove-actor-effect'
  | 'update-actor-effect'
  | 'get-scene'
  | 'get-scenes-list'
  | 'activate-scene'
  | 'dnd5e/activate-item'
  | 'activate-item' // @deprecated alias of 'dnd5e/activate-item'
  | 'get-journals'
  | 'get-journal'
  | 'get-items'
  | 'get-item'
  | 'get-compendiums'
  | 'get-compendium'
  | 'get-compendium-index'
  | 'search-compendium'
  | 'search-compendiums'
  | 'get-compendium-document'
  | 'import-from-compendium'
  | 'list-roll-tables'
  | 'get-roll-table'
  | 'roll-on-table'
  | 'reset-table'
  | 'create-roll-table'
  | 'update-roll-table'
  | 'delete-roll-table'
  | 'capture-scene'
  | 'get-combat-turn-context'
  | 'set-door-state'
  | 'get-walls'
  | 'create-wall'
  | 'update-wall'
  | 'delete-wall'
  | 'get-notes'
  | 'create-note'
  | 'update-note'
  | 'delete-note'
  | 'get-chat-messages'
  | 'delete-chat-message'
  | 'update-chat-message'
  | 'clear-chat'
  | 'export-chat'
  | 'show-journal'
  | 'get-folders'
  | 'get-folder'
  | 'create-folder'
  | 'update-folder'
  | 'delete-folder'
  | 'get-macros'
  | 'get-macro'
  | 'create-macro'
  | 'update-macro'
  | 'delete-macro'
  | 'execute-macro'
  | 'get-playlists'
  | 'get-playlist'
  | 'play-playlist'
  | 'stop-playlist'
  | 'play-sound-in-playlist'
  | 'stop-sound-in-playlist'
  | 'play-sound-once'
  | 'add-sound-to-playlist'
  | 'get-world-time'
  | 'advance-time'
  | 'set-world-time'
  | 'pause-game'
  | 'resume-game'
  | 'get-pause-state'
  | 'notify'
  | 'pan-canvas'
  | 'ping-location';

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

export interface RollPerceptionParams {
  actorId: string;
  showInChat?: boolean;
}

export type Pf2eSaveSlug = 'fortitude' | 'reflex' | 'will';

export interface Pf2eRollSaveParams {
  actorId: string;
  save: Pf2eSaveSlug;
  showInChat?: boolean;
}

// PF2e Condition Commands
export interface SetConditionParams {
  actorId: string;
  slug: string;
  value?: number;
}

export interface ConditionSlugParams {
  actorId: string;
  slug: string;
}

export interface GetConditionsParams {
  actorId: string;
}

export interface ConditionStateWire {
  slug: string;
  name: string;
  value: number | null;
  active: boolean;
}

export interface ConditionMutationResult {
  actorId: string;
  condition: ConditionStateWire | null;
}

export interface ConditionRemovalResult {
  actorId: string;
  slug: string;
  removed: boolean;
}

export interface ConditionListResult {
  actorId: string;
  actorName: string;
  conditions: ConditionStateWire[];
}

// PF2e Strike Commands
export interface ListStrikesParams {
  actorId: string;
}

export interface RollStrikeParams {
  actorId: string;
  slug: string;
  mapIncrease?: number;
  showInChat?: boolean;
}

export interface RollStrikeDamageParams {
  actorId: string;
  slug: string;
  critical?: boolean;
  showInChat?: boolean;
}

export interface StrikeSummaryWire {
  slug: string;
  label: string;
  ready: boolean;
  variants: string[];
}

export interface StrikeListResult {
  actorId: string;
  actorName: string;
  strikes: StrikeSummaryWire[];
}

// PF2e Item Use Commands
export interface UseConsumableParams {
  actorId: string;
  itemId: string;
  quantity?: number;
}

export interface CastSpellParams {
  actorId: string;
  spellId: string;
  rank?: number;
  showInChat?: boolean;
}

export interface PostItemParams {
  actorId: string;
  itemId: string;
  showInChat?: boolean;
}

export interface UseConsumableResult {
  itemId: string;
  itemName: string;
  consumed: true;
  remainingUses: number | null;
  remainingQuantity: number | null;
}

export interface CastSpellResult {
  spellId: string;
  spellName: string;
  rank: number;
  cast: true;
}

export interface PostItemResult {
  itemId: string;
  itemName: string;
  itemType: string;
  posted: true;
  chatMessageId: string | null;
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

// Filter Actors Commands
export interface FilterActorsRange {
  min?: number;
  max?: number;
}

export interface FilterActorsAbilities {
  str?: FilterActorsRange;
  dex?: FilterActorsRange;
  con?: FilterActorsRange;
  int?: FilterActorsRange;
  wis?: FilterActorsRange;
  cha?: FilterActorsRange;
}

export interface FilterActorsFolder {
  id?: string;
  name?: string;
  recursive?: boolean;
}

export interface FilterActorsParams {
  name?: string;
  type?: string[];
  creatureType?: string[];
  size?: string[];
  disposition?: string[];
  hasPlayerOwner?: boolean;
  cr?: FilterActorsRange;
  level?: FilterActorsRange;
  maxHp?: FilterActorsRange;
  currentHp?: FilterActorsRange;
  ac?: FilterActorsRange;
  abilities?: FilterActorsAbilities;
  folder?: FilterActorsFolder;
  limit?: number;
  offset?: number;
}

export interface FilterActorsResultEntry {
  id: string;
  name: string;
}

export interface FilterActorsResult {
  results: FilterActorsResultEntry[];
  total: number;
  hasMore: boolean;
}

// Filter Items Commands
export type ItemTypeWire =
  | 'weapon'
  | 'equipment'
  | 'consumable'
  | 'tool'
  | 'container'
  | 'loot'
  | 'spell'
  | 'feat'
  | 'background'
  | 'race'
  | 'class'
  | 'subclass'
  | 'feature';

export type ItemRarityWire =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'veryRare'
  | 'legendary'
  | 'artifact';

export type SpellSchoolWire =
  | 'abjuration'
  | 'conjuration'
  | 'divination'
  | 'enchantment'
  | 'evocation'
  | 'illusion'
  | 'necromancy'
  | 'transmutation';

export interface FilterItemsRange {
  min?: number;
  max?: number;
}

export interface FilterItemsFolder {
  id?: string;
  name?: string;
  recursive?: boolean;
}

export interface FilterItemsParams {
  name?: string;
  type?: ItemTypeWire[];
  rarity?: ItemRarityWire[];
  spellSchool?: SpellSchoolWire[];
  requiresAttunement?: boolean;
  identified?: boolean;
  hasActivities?: boolean;
  isContainer?: boolean;
  weight?: FilterItemsRange;
  price?: FilterItemsRange;
  spellLevel?: FilterItemsRange;
  folder?: FilterItemsFolder;
  limit?: number;
  offset?: number;
}

export interface FilterItemsResultEntry {
  id: string;
  name: string;
}

export interface FilterItemsResult {
  results: FilterItemsResultEntry[];
  total: number;
  hasMore: boolean;
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

// Chat Read/Manage Commands
export interface GetChatMessagesParams {
  limit?: number;
  since?: string;
  before?: string;
  includeRolls?: boolean;
  authorId?: string;
  actorId?: string;
  type?: 'ic' | 'ooc' | 'emote' | 'roll';
  search?: string;
}

export interface ChatMessageSpeaker {
  alias: string;
  actorId: string | null;
  tokenId: string | null;
}

export interface ChatMessageRollSummary {
  formula: string;
  total: number;
}

export interface ChatMessageData {
  id: string;
  timestamp: number;
  author: {
    userId: string;
    name: string;
  };
  speaker: ChatMessageSpeaker;
  content: string;
  flavor: string | null;
  style: 'other' | 'ooc' | 'ic' | 'emote';
  isRoll: boolean;
  rolls?: ChatMessageRollSummary[];
  whisper: string[];
  isWhisper: boolean;
}

export interface GetChatMessagesResult {
  messages: ChatMessageData[];
  total: number;
  hasMore: boolean;
}

export interface DeleteChatMessageParams {
  messageId: string;
}

export interface UpdateChatMessageParams {
  messageId: string;
  content?: string;
  flavor?: string;
}

export interface ExportChatParams {
  format?: 'text' | 'json';
}

export interface ExportChatResult {
  content: string;
  messageCount: number;
}

export interface ClearChatResult {
  deletedCount: number;
}

// Journal Commands
export type JournalPageType = 'text' | 'image' | 'video' | 'pdf';

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
  src?: string;
}

export interface UpdateJournalPageParams {
  journalId: string;
  pageId: string;
  name?: string;
  content?: string;
  src?: string;
}

export interface DeleteJournalPageParams {
  journalId: string;
  pageId: string;
}

export interface ShowJournalParams {
  journalId: string;
  pageId?: string;
  force?: boolean;
  users?: string[];
}

export interface ShowJournalResult {
  shown: boolean;
  journalId: string;
  journalName: string;
  pageId?: string;
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
  canOpenDoors?: boolean | undefined;
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

export type TokenDisposition = 'hostile' | 'neutral' | 'friendly' | 'secret';

export interface TokenDetail {
  id: string;
  sceneId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  elevation: number;
  rotation: number;
  hidden: boolean;
  disposition: TokenDisposition;
  actorId: string | null;
  textureSrc: string;
  hp: { current: number; max: number } | null;
  ac: number | null;
}

export interface GetTokenParams {
  sceneId?: string;
  tokenId: string;
}

export type GetTokenResult = TokenDetail;

export interface GetTokenByActorParams {
  sceneId?: string;
  actorId: string;
}

export type GetTokenByActorResult = TokenDetail;

export interface SetTokenTargetParams {
  tokenId: string;
  targeted: boolean;
  releaseOthers?: boolean;
}

export interface SetTokenTargetResult {
  tokenId: string;
  targeted: boolean;
}

export type ClearTargetsParams = Record<string, never>;

export interface ClearTargetsResult {
  cleared: true;
  count: number;
}

export interface GetTokensInRangeParams {
  sceneId?: string;
  originX: number;
  originY: number;
  range: number;
  excludeTokenId?: string;
}

export interface TokenInRangeEntry {
  id: string;
  name: string;
  x: number;
  y: number;
  distance: number;
  actorId: string | null;
  disposition: TokenDisposition;
}

export interface GetTokensInRangeResult {
  sceneId: string;
  origin: { x: number; y: number };
  range: number;
  units: string;
  tokens: TokenInRangeEntry[];
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
  width: number;
  height: number;
  elevation: number;
  rotation: number;
  hidden: boolean;
  img: string;
  disposition: number;
  hp?: TokenHpData;
  ac?: number;
  conditions: string[];
  pathCost?: number | undefined;
  doorsOpened?: string[] | undefined;
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

// World-level Item CRUD Commands
export interface CreateItemParams {
  name: string;
  type: string;
  folder?: string;
  img?: string;
  system?: Record<string, unknown>;
}

export interface CreateItemFromCompendiumParams {
  packId: string;
  itemId: string;
  name?: string;
  folder?: string;
}

export interface UpdateItemParams {
  itemId: string;
  name?: string;
  img?: string;
  folder?: string | null;
  system?: Record<string, unknown>;
}

export interface DeleteItemParams {
  itemId: string;
}

export interface WorldItemResult {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string;
  folder: string | null;
}

export interface DeleteItemResult {
  deleted: true;
  itemId: string;
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
  id: string;
  c: number[];
  move: number;
  sense: number;
  door: number;
  ds: number;
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

// Scene CRUD
export type SceneGridType =
  | 'gridless'
  | 'square'
  | 'hexPointyOdd'
  | 'hexPointyEven'
  | 'hexFlatOdd'
  | 'hexFlatEven';

export interface SceneGridConfig {
  type?: SceneGridType;
  size?: number;
  distance?: number;
  units?: string;
}

export interface SceneSummary {
  id: string;
  uuid: string;
  name: string;
  active: boolean;
  width: number;
  height: number;
  background: string | null;
  navigation: boolean;
  navName: string | null;
  navOrder: number;
  folder: string | null;
  grid: {
    type: SceneGridType;
    size: number;
    distance: number;
    units: string;
  };
}

export interface CreateSceneParams {
  name: string;
  width?: number;
  height?: number;
  grid?: SceneGridConfig;
  background?: string;
  foreground?: string;
  padding?: number;
  navigation?: boolean;
  navName?: string;
  navOrder?: number;
  fogExploration?: boolean;
  darkness?: number;
  folder?: string;
}

export type CreateSceneResult = SceneSummary;

export interface UpdateSceneParams {
  sceneId: string;
  name?: string;
  width?: number;
  height?: number;
  grid?: SceneGridConfig;
  background?: string;
  foreground?: string;
  padding?: number;
  navigation?: boolean;
  navName?: string | null;
  navOrder?: number;
  fogExploration?: boolean;
  darkness?: number;
  folder?: string | null;
}

export type UpdateSceneResult = SceneSummary;

export interface DeleteSceneParams {
  sceneId: string;
}

export interface DeleteSceneResult {
  deleted: true;
  sceneId: string;
}

export interface CloneSceneParams {
  sourceId: string;
  name?: string;
  folder?: string;
}

export type CloneSceneResult = SceneSummary;

export interface ViewSceneParams {
  sceneId: string;
}

export interface ViewSceneResult {
  viewed: true;
  sceneId: string;
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

// Compendium efficient access
export interface CompendiumIndexEntry {
  id: string;
  name: string;
  img: string | null;
  type: string | null;
  fields?: Record<string, unknown>;
}

export interface GetCompendiumIndexParams {
  packId: string;
  fields?: string[];
}

export interface GetCompendiumIndexResult {
  packId: string;
  packType: string;
  packLabel: string;
  total: number;
  entries: CompendiumIndexEntry[];
}

export type CompendiumFieldOperator =
  | 'EQUALS'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'LESS_THAN'
  | 'LESS_THAN_EQUAL'
  | 'GREATER_THAN'
  | 'GREATER_THAN_EQUAL'
  | 'BETWEEN'
  | 'IS_EMPTY';

export interface CompendiumFilter {
  field: string;
  operator?: CompendiumFieldOperator;
  value?: unknown;
  negate?: boolean;
}

export interface SearchCompendiumParams {
  packId: string;
  query?: string;
  filters?: CompendiumFilter[];
  exclude?: string[];
  fields?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchCompendiumResult {
  packId: string;
  results: CompendiumIndexEntry[];
  total: number;
  hasMore: boolean;
}

// Cross-pack name search (search-compendiums) — searches pack indexes across
// ALL compendiums and returns only lightweight matches.
export interface SearchCompendiumsParams {
  query: string;
  type?: string;
  system?: string;
  limit?: number;
}

export interface CompendiumSearchMatch {
  packId: string;
  packLabel: string;
  packType: string;
  system: string;
  id: string;
  name: string;
  documentType?: string;
}

export type SearchCompendiumsResult = CompendiumSearchMatch[];

export interface GetCompendiumDocumentParams {
  packId: string;
  documentId: string;
}

export interface CompendiumDocumentResult {
  id: string;
  uuid: string;
  name: string;
  type: string;
  img: string | null;
  documentType: string;
  data: Record<string, unknown>;
}

export interface ImportFromCompendiumParams {
  packId: string;
  documentId: string;
  folder?: string;
  name?: string;
}

export interface ImportFromCompendiumResult {
  imported: true;
  worldId: string;
  uuid: string;
  name: string;
  documentType: string;
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

// Door Commands
export interface SetDoorStateParams {
  sceneId?: string;
  wallId: string;
  state: number;
}

export interface SetDoorStateResult {
  wallId: string;
  door: number;
  previousState: number;
  newState: number;
}

// Wall CRUD Commands
export type WallDoorType = 'none' | 'door' | 'secret';
export type WallDoorState = 'closed' | 'open' | 'locked';
export type WallRestriction = 'none' | 'normal' | 'limited';
export type WallDirection = 'both' | 'left' | 'right';

export interface WallSummary {
  id: string;
  c: [number, number, number, number];
  door: WallDoorType;
  doorState: WallDoorState;
  move: WallRestriction;
  sense: WallRestriction;
  sound: WallRestriction;
  light: WallRestriction;
  dir: WallDirection;
}

export interface GetWallsParams {
  sceneId?: string;
}

export interface GetWallsResult {
  sceneId: string;
  walls: WallSummary[];
}

export interface CreateWallParams {
  sceneId?: string;
  c: [number, number, number, number];
  door?: WallDoorType;
  doorState?: WallDoorState;
  move?: WallRestriction;
  sense?: WallRestriction;
  sound?: WallRestriction;
  light?: WallRestriction;
  dir?: WallDirection;
}

export type CreateWallResult = WallSummary;

export interface UpdateWallParams {
  sceneId?: string;
  wallId: string;
  c?: [number, number, number, number];
  door?: WallDoorType;
  doorState?: WallDoorState;
  move?: WallRestriction;
  sense?: WallRestriction;
  sound?: WallRestriction;
  light?: WallRestriction;
  dir?: WallDirection;
}

export type UpdateWallResult = WallSummary;

export interface DeleteWallParams {
  sceneId?: string;
  wallId: string;
}

export interface DeleteWallResult {
  deleted: true;
  wallId: string;
  sceneId: string;
}

// Note CRUD Commands
export type NoteTextAnchor = 'center' | 'bottom' | 'top' | 'left' | 'right';

export interface NoteSummary {
  id: string;
  x: number;
  y: number;
  entryId: string | null;
  pageId: string | null;
  text: string | null;
  iconSrc: string;
  iconTint: string | null;
  iconSize: number;
  fontSize: number;
  textAnchor: NoteTextAnchor;
  textColor: string | null;
  global: boolean;
}

export interface GetNotesParams {
  sceneId?: string;
}

export interface GetNotesResult {
  sceneId: string;
  notes: NoteSummary[];
}

export interface CreateNoteParams {
  sceneId?: string;
  x: number;
  y: number;
  entryId?: string;
  pageId?: string;
  text?: string;
  iconSrc?: string;
  iconTint?: string;
  iconSize?: number;
  fontSize?: number;
  textAnchor?: NoteTextAnchor;
  textColor?: string;
  global?: boolean;
}

export type CreateNoteResult = NoteSummary;

export interface UpdateNoteParams {
  sceneId?: string;
  noteId: string;
  x?: number;
  y?: number;
  entryId?: string | null;
  pageId?: string | null;
  text?: string | null;
  iconSrc?: string;
  iconTint?: string | null;
  iconSize?: number;
  fontSize?: number;
  textAnchor?: NoteTextAnchor;
  textColor?: string | null;
  global?: boolean;
}

export type UpdateNoteResult = NoteSummary;

export interface DeleteNoteParams {
  sceneId?: string;
  noteId: string;
}

export interface DeleteNoteResult {
  deleted: true;
  noteId: string;
  sceneId: string;
}

// Combat Turn Context types
export interface GetCombatTurnContextParams {
  combatId?: string;
}

export interface TurnCombatantInfo {
  id: string;
  actorId: string;
  tokenId: string;
  name: string;
  gridX: number;
  gridY: number;
  hp?: TokenHpData;
  ac?: number;
  conditions: string[];
}

export interface NearbyTokenInfo {
  tokenId: string;
  actorId: string | null;
  name: string;
  gridX: number;
  gridY: number;
  distanceFt: number;
  disposition: string;
  hp?: TokenHpData;
  ac?: number;
  conditions: string[];
  lineOfSight: boolean;
}

export interface CombatTurnContext {
  round: number;
  turn: number;
  currentCombatant: TurnCombatantInfo;
  nearbyTokens: NearbyTokenInfo[];
  asciiMap: string;
}

// Folder Commands
export type FolderDocumentType =
  | 'Actor'
  | 'Item'
  | 'Scene'
  | 'JournalEntry'
  | 'RollTable'
  | 'Macro'
  | 'Cards'
  | 'Playlist'
  | 'Compendium';

export interface FolderSummary {
  id: string;
  name: string;
  type: FolderDocumentType;
  color: string | null;
  description: string | null;
  parentId: string | null;
  sort: number;
}

export interface GetFoldersParams {
  type?: FolderDocumentType;
}

export type GetFoldersResult = FolderSummary[];

export interface GetFolderParams {
  folderId: string;
  includeSubfolders?: boolean;
  includeContents?: boolean;
}

export interface FolderTreeEntry extends FolderSummary {
  subfolders: FolderTreeEntry[];
  contentIds?: string[];
}

export type GetFolderResult = FolderTreeEntry;

export interface CreateFolderParams {
  name: string;
  type: FolderDocumentType;
  parentId?: string;
  color?: string;
  description?: string;
  sort?: number;
}

export type CreateFolderResult = FolderSummary;

export interface UpdateFolderParams {
  folderId: string;
  name?: string;
  parentId?: string | null;
  color?: string;
  description?: string;
  sort?: number;
}

export type UpdateFolderResult = FolderSummary;

export interface DeleteFolderParams {
  folderId: string;
  deleteSubfolders?: boolean;
  deleteContents?: boolean;
}

export interface DeleteFolderResult {
  deleted: true;
  folderId: string;
}

// Macro Commands
export type MacroType = 'chat' | 'script';
export type MacroScope = 'global' | 'actors' | 'actor';

export interface MacroSummary {
  id: string;
  uuid: string;
  name: string;
  type: MacroType;
  img: string;
  scope: MacroScope;
  folder: string | null;
  authorId: string | null;
}

export interface MacroDetail extends MacroSummary {
  command: string;
}

export interface GetMacrosParams {
  type?: MacroType;
}

export type GetMacrosResult = MacroSummary[];

export interface GetMacroParams {
  macroId: string;
}

export type GetMacroResult = MacroDetail;

export interface CreateMacroParams {
  name: string;
  type: MacroType;
  command: string;
  scope?: MacroScope;
  img?: string;
  folder?: string;
}

export type CreateMacroResult = MacroDetail;

export interface UpdateMacroParams {
  macroId: string;
  name?: string;
  type?: MacroType;
  command?: string;
  scope?: MacroScope;
  img?: string;
  folder?: string | null;
}

export type UpdateMacroResult = MacroDetail;

export interface DeleteMacroParams {
  macroId: string;
}

export interface DeleteMacroResult {
  deleted: true;
  macroId: string;
}

export interface ExecuteMacroParams {
  macroId: string;
  actorId?: string;
  tokenId?: string;
}

export interface ExecuteMacroResult {
  executed: true;
  macroId: string;
  macroName: string;
  macroType: MacroType;
}

// Playlist Commands
export type PlaylistMode = 'disabled' | 'sequential' | 'shuffle' | 'simultaneous' | 'soundboard';
export type PlaylistChannel = 'music' | 'environment' | 'interface';

export interface PlaylistSoundSummary {
  id: string;
  name: string;
  path: string;
  playing: boolean;
  volume: number;
  repeat: boolean;
}

export interface PlaylistSummary {
  id: string;
  uuid: string;
  name: string;
  mode: PlaylistMode;
  channel: PlaylistChannel | null;
  fade: number | null;
  playing: boolean;
  description: string | null;
  folder: string | null;
  soundCount: number;
}

export interface PlaylistDetail extends PlaylistSummary {
  sounds: PlaylistSoundSummary[];
}

export type GetPlaylistsParams = Record<string, never>;
export type GetPlaylistsResult = PlaylistSummary[];

export interface GetPlaylistParams {
  playlistId: string;
}
export type GetPlaylistResult = PlaylistDetail;

export interface PlayPlaylistParams {
  playlistId: string;
}
export interface PlayPlaylistResult {
  playing: true;
  playlistId: string;
  soundCount: number;
}

export interface StopPlaylistParams {
  playlistId: string;
}
export interface StopPlaylistResult {
  stopped: true;
  playlistId: string;
}

export interface PlaySoundInPlaylistParams {
  playlistId: string;
  soundId: string;
}
export interface PlaySoundInPlaylistResult {
  playing: true;
  playlistId: string;
  soundId: string;
  soundName: string;
}

export interface StopSoundInPlaylistParams {
  playlistId: string;
  soundId: string;
}
export interface StopSoundInPlaylistResult {
  stopped: true;
  playlistId: string;
  soundId: string;
}

export interface PlaySoundOnceParams {
  src: string;
  volume?: number;
  loop?: boolean;
  broadcast?: boolean;
}
export interface PlaySoundOnceResult {
  playing: true;
  src: string;
  broadcast: boolean;
}

export interface AddSoundToPlaylistParams {
  playlistId: string;
  name: string;
  path: string;
  volume?: number;
  repeat?: boolean;
  description?: string;
}
export type AddSoundToPlaylistResult = PlaylistSoundSummary;

// World time
export type GetWorldTimeParams = Record<string, never>;

export interface GetWorldTimeResult {
  worldTime: number;
}

export interface AdvanceTimeParams {
  seconds: number;
}

export interface AdvanceTimeResult {
  worldTime: number;
  advancedBy: number;
}

export interface SetWorldTimeParams {
  worldTime: number;
}

export interface SetWorldTimeResult {
  worldTime: number;
}

// Pause/Resume
export type PauseGameParams = Record<string, never>;

export interface PauseGameResult {
  paused: true;
}

export type ResumeGameParams = Record<string, never>;

export interface ResumeGameResult {
  paused: false;
}

export type GetPauseStateParams = Record<string, never>;

export interface GetPauseStateResult {
  paused: boolean;
}

// UI helpers
export type NotifyType = 'info' | 'warn' | 'error' | 'success';

export interface NotifyParams {
  message: string;
  type?: NotifyType;
  permanent?: boolean;
}

export interface NotifyResult {
  shown: true;
  type: NotifyType;
}

export interface PanCanvasParams {
  x?: number;
  y?: number;
  scale?: number;
  duration?: number;
}

export interface PanCanvasResult {
  panned: true;
}

export type PingStyle = 'pulse' | 'arrow' | 'alert' | 'chevron';

export interface PingLocationParams {
  x: number;
  y: number;
  style?: PingStyle;
  color?: string;
  duration?: number;
}

export interface PingLocationResult {
  pinged: true;
  x: number;
  y: number;
}

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export const ABILITY_KEYS: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export type CommandHandler<TParams = unknown, TResult = unknown> = (
  params: TParams
) => Promise<TResult>;

export interface CommandParamsMap {
  'roll-dice': RollDiceParams;
  'dnd5e/roll-ability': RollAbilityParams;
  'roll-ability': RollAbilityParams; // @deprecated alias of 'dnd5e/roll-ability'
  'dnd5e/roll-skill': RollSkillParams;
  'roll-skill': RollSkillParams; // @deprecated alias of 'dnd5e/roll-skill'
  'dnd5e/roll-save': RollSaveParams;
  'roll-save': RollSaveParams; // @deprecated alias of 'dnd5e/roll-save'
  'dnd5e/roll-attack': RollAttackParams;
  'roll-attack': RollAttackParams; // @deprecated alias of 'dnd5e/roll-attack'
  'dnd5e/roll-damage': RollDamageParams;
  'roll-damage': RollDamageParams; // @deprecated alias of 'dnd5e/roll-damage'
  'dnd5e/roll-perception': RollPerceptionParams;
  'roll-perception': RollPerceptionParams;
  'pf2e/roll-skill': RollSkillParams;
  'pf2e/roll-save': Pf2eRollSaveParams;
  'pf2e/roll-perception': RollPerceptionParams;
  'pf2e/set-condition': SetConditionParams;
  'pf2e/remove-condition': ConditionSlugParams;
  'pf2e/get-conditions': GetConditionsParams;
  'pf2e/increase-condition': ConditionSlugParams;
  'pf2e/decrease-condition': ConditionSlugParams;
  'pf2e/list-strikes': ListStrikesParams;
  'pf2e/roll-strike': RollStrikeParams;
  'pf2e/roll-strike-damage': RollStrikeDamageParams;
  'pf2e/use-consumable': UseConsumableParams;
  'pf2e/cast-spell': CastSpellParams;
  'pf2e/post-item': PostItemParams;
  'get-world-info': GetWorldInfoParams;
  'get-actors': Record<string, never>;
  'filter-actors': FilterActorsParams;
  'filter-items': FilterItemsParams;
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
  'get-token': GetTokenParams;
  'get-token-by-actor': GetTokenByActorParams;
  'set-token-target': SetTokenTargetParams;
  'clear-targets': ClearTargetsParams;
  'get-tokens-in-range': GetTokensInRangeParams;
  'get-actor-items': GetActorItemsParams;
  'dnd5e/use-item': UseItemParams;
  'use-item': UseItemParams; // @deprecated alias of 'dnd5e/use-item'
  'add-item-to-actor': AddItemToActorParams;
  'add-item-from-compendium': AddItemFromCompendiumParams;
  'update-actor-item': UpdateActorItemParams;
  'delete-actor-item': DeleteActorItemParams;
  'create-item': CreateItemParams;
  'create-item-from-compendium': CreateItemFromCompendiumParams;
  'update-item': UpdateItemParams;
  'delete-item': DeleteItemParams;
  'get-actor-effects': GetActorEffectsParams;
  'toggle-actor-status': ToggleActorStatusParams;
  'add-actor-effect': AddActorEffectParams;
  'remove-actor-effect': RemoveActorEffectParams;
  'update-actor-effect': UpdateActorEffectParams;
  'get-scene': GetSceneParams;
  'get-scenes-list': GetScenesListParams;
  'activate-scene': ActivateSceneParams;
  'create-scene': CreateSceneParams;
  'update-scene': UpdateSceneParams;
  'delete-scene': DeleteSceneParams;
  'clone-scene': CloneSceneParams;
  'view-scene': ViewSceneParams;
  'dnd5e/activate-item': ActivateItemParams;
  'activate-item': ActivateItemParams; // @deprecated alias of 'dnd5e/activate-item'
  'get-journals': GetJournalsParams;
  'get-journal': GetJournalParams;
  'get-items': GetItemsParams;
  'get-item': GetItemParams;
  'get-compendiums': GetCompendiumsParams;
  'get-compendium': GetCompendiumParams;
  'get-compendium-index': GetCompendiumIndexParams;
  'search-compendium': SearchCompendiumParams;
  'search-compendiums': SearchCompendiumsParams;
  'get-compendium-document': GetCompendiumDocumentParams;
  'import-from-compendium': ImportFromCompendiumParams;
  'list-roll-tables': ListRollTablesParams;
  'get-roll-table': GetRollTableParams;
  'roll-on-table': RollOnTableParams;
  'reset-table': ResetTableParams;
  'create-roll-table': CreateRollTableParams;
  'update-roll-table': UpdateRollTableParams;
  'delete-roll-table': DeleteRollTableParams;
  'capture-scene': CaptureSceneParams;
  'get-combat-turn-context': GetCombatTurnContextParams;
  'set-door-state': SetDoorStateParams;
  'get-walls': GetWallsParams;
  'create-wall': CreateWallParams;
  'update-wall': UpdateWallParams;
  'delete-wall': DeleteWallParams;
  'get-notes': GetNotesParams;
  'create-note': CreateNoteParams;
  'update-note': UpdateNoteParams;
  'delete-note': DeleteNoteParams;
  'get-chat-messages': GetChatMessagesParams;
  'delete-chat-message': DeleteChatMessageParams;
  'update-chat-message': UpdateChatMessageParams;
  'clear-chat': Record<string, never>;
  'export-chat': ExportChatParams;
  'show-journal': ShowJournalParams;
  'get-folders': GetFoldersParams;
  'get-folder': GetFolderParams;
  'create-folder': CreateFolderParams;
  'update-folder': UpdateFolderParams;
  'delete-folder': DeleteFolderParams;
  'get-macros': GetMacrosParams;
  'get-macro': GetMacroParams;
  'create-macro': CreateMacroParams;
  'update-macro': UpdateMacroParams;
  'delete-macro': DeleteMacroParams;
  'execute-macro': ExecuteMacroParams;
  'get-playlists': GetPlaylistsParams;
  'get-playlist': GetPlaylistParams;
  'play-playlist': PlayPlaylistParams;
  'stop-playlist': StopPlaylistParams;
  'play-sound-in-playlist': PlaySoundInPlaylistParams;
  'stop-sound-in-playlist': StopSoundInPlaylistParams;
  'play-sound-once': PlaySoundOnceParams;
  'add-sound-to-playlist': AddSoundToPlaylistParams;
  'get-world-time': GetWorldTimeParams;
  'advance-time': AdvanceTimeParams;
  'set-world-time': SetWorldTimeParams;
  'pause-game': PauseGameParams;
  'resume-game': ResumeGameParams;
  'get-pause-state': GetPauseStateParams;
  'notify': NotifyParams;
  'pan-canvas': PanCanvasParams;
  'ping-location': PingLocationParams;
}

export interface CommandResultMap {
  'roll-dice': RollResult;
  'dnd5e/roll-ability': RollResult;
  'roll-ability': RollResult; // @deprecated alias of 'dnd5e/roll-ability'
  'dnd5e/roll-skill': RollResult;
  'roll-skill': RollResult; // @deprecated alias of 'dnd5e/roll-skill'
  'dnd5e/roll-save': RollResult;
  'roll-save': RollResult; // @deprecated alias of 'dnd5e/roll-save'
  'dnd5e/roll-attack': RollResult;
  'roll-attack': RollResult; // @deprecated alias of 'dnd5e/roll-attack'
  'dnd5e/roll-damage': RollResult;
  'roll-damage': RollResult; // @deprecated alias of 'dnd5e/roll-damage'
  'dnd5e/roll-perception': RollResult;
  'roll-perception': RollResult;
  'pf2e/roll-skill': RollResult;
  'pf2e/roll-save': RollResult;
  'pf2e/roll-perception': RollResult;
  'pf2e/set-condition': ConditionMutationResult;
  'pf2e/remove-condition': ConditionRemovalResult;
  'pf2e/get-conditions': ConditionListResult;
  'pf2e/increase-condition': ConditionMutationResult;
  'pf2e/decrease-condition': ConditionMutationResult;
  'pf2e/list-strikes': StrikeListResult;
  'pf2e/roll-strike': RollResult;
  'pf2e/roll-strike-damage': RollResult;
  'pf2e/use-consumable': UseConsumableResult;
  'pf2e/cast-spell': CastSpellResult;
  'pf2e/post-item': PostItemResult;
  'get-world-info': WorldInfoResult;
  'get-actors': ActorSummary[];
  'filter-actors': FilterActorsResult;
  'filter-items': FilterItemsResult;
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
  'get-token': GetTokenResult;
  'get-token-by-actor': GetTokenByActorResult;
  'set-token-target': SetTokenTargetResult;
  'clear-targets': ClearTargetsResult;
  'get-tokens-in-range': GetTokensInRangeResult;
  'get-actor-items': ActorItemsResult;
  'dnd5e/use-item': UseItemResult;
  'use-item': UseItemResult; // @deprecated alias of 'dnd5e/use-item'
  'add-item-to-actor': ItemResult;
  'add-item-from-compendium': ItemResult;
  'update-actor-item': ItemResult;
  'delete-actor-item': DeleteResult;
  'create-item': WorldItemResult;
  'create-item-from-compendium': WorldItemResult;
  'update-item': WorldItemResult;
  'delete-item': DeleteItemResult;
  'get-actor-effects': ActorEffectsResult;
  'toggle-actor-status': ToggleStatusResult;
  'add-actor-effect': AddEffectResult;
  'remove-actor-effect': RemoveEffectResult;
  'update-actor-effect': UpdateEffectResult;
  'get-scene': SceneDetailResult;
  'get-scenes-list': SceneListResult;
  'activate-scene': ActivateSceneResult;
  'create-scene': CreateSceneResult;
  'update-scene': UpdateSceneResult;
  'delete-scene': DeleteSceneResult;
  'clone-scene': CloneSceneResult;
  'view-scene': ViewSceneResult;
  'dnd5e/activate-item': ActivateItemResult;
  'activate-item': ActivateItemResult; // @deprecated alias of 'dnd5e/activate-item'
  'get-journals': JournalData[];
  'get-journal': JournalData;
  'get-items': ItemData[];
  'get-item': ItemData;
  'get-compendiums': CompendiumMetadata[];
  'get-compendium': CompendiumData;
  'get-compendium-index': GetCompendiumIndexResult;
  'search-compendium': SearchCompendiumResult;
  'search-compendiums': SearchCompendiumsResult;
  'get-compendium-document': CompendiumDocumentResult;
  'import-from-compendium': ImportFromCompendiumResult;
  'list-roll-tables': RollTableSummary[];
  'get-roll-table': RollTableResult;
  'roll-on-table': RollOnTableResult;
  'reset-table': ResetTableResult;
  'create-roll-table': RollTableResult;
  'update-roll-table': RollTableResult;
  'delete-roll-table': DeleteResult;
  'capture-scene': CaptureSceneResult;
  'get-combat-turn-context': CombatTurnContext;
  'set-door-state': SetDoorStateResult;
  'get-walls': GetWallsResult;
  'create-wall': CreateWallResult;
  'update-wall': UpdateWallResult;
  'delete-wall': DeleteWallResult;
  'get-notes': GetNotesResult;
  'create-note': CreateNoteResult;
  'update-note': UpdateNoteResult;
  'delete-note': DeleteNoteResult;
  'get-chat-messages': GetChatMessagesResult;
  'delete-chat-message': DeleteResult;
  'update-chat-message': SendChatMessageResult;
  'clear-chat': ClearChatResult;
  'export-chat': ExportChatResult;
  'show-journal': ShowJournalResult;
  'get-folders': GetFoldersResult;
  'get-folder': GetFolderResult;
  'create-folder': CreateFolderResult;
  'update-folder': UpdateFolderResult;
  'delete-folder': DeleteFolderResult;
  'get-macros': GetMacrosResult;
  'get-macro': GetMacroResult;
  'create-macro': CreateMacroResult;
  'update-macro': UpdateMacroResult;
  'delete-macro': DeleteMacroResult;
  'execute-macro': ExecuteMacroResult;
  'get-playlists': GetPlaylistsResult;
  'get-playlist': GetPlaylistResult;
  'play-playlist': PlayPlaylistResult;
  'stop-playlist': StopPlaylistResult;
  'play-sound-in-playlist': PlaySoundInPlaylistResult;
  'stop-sound-in-playlist': StopSoundInPlaylistResult;
  'play-sound-once': PlaySoundOnceResult;
  'add-sound-to-playlist': AddSoundToPlaylistResult;
  'get-world-time': GetWorldTimeResult;
  'advance-time': AdvanceTimeResult;
  'set-world-time': SetWorldTimeResult;
  'pause-game': PauseGameResult;
  'resume-game': ResumeGameResult;
  'get-pause-state': GetPauseStateResult;
  'notify': NotifyResult;
  'pan-canvas': PanCanvasResult;
  'ping-location': PingLocationResult;
}