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
  | 'dnd5e/filter-compendium-actors'
  | 'dnd5e/filter-compendium-items'
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
  | 'pf2e/filter-compendium-actors'
  | 'pf2e/filter-compendium-items'
  | 'swade/roll-attribute'
  | 'swade/roll-skill'
  | 'swade/roll-attack'
  | 'swade/roll-damage'
  | 'swade/apply-damage'
  | 'swade/soak'
  | 'swade/bennies'
  | 'swade/set-status'
  | 'swade/get-actor-summary'
  | 'swade/get-action-cards'
  | 'coc7/roll-skill'
  | 'coc7/roll-characteristic'
  | 'coc7/roll-attribute'
  | 'coc7/roll-attack'
  | 'coc7/roll-damage'
  | 'coc7/apply-damage'
  | 'coc7/sanity-check'
  | 'coc7/bout-of-madness'
  | 'coc7/luck'
  | 'coc7/set-condition'
  | 'coc7/get-actor-summary'
  | 'pf1/roll-ability'
  | 'pf1/roll-skill'
  | 'pf1/roll-save'
  | 'pf1/roll-caster-level'
  | 'pf1/roll-concentration'
  | 'pf1/use-item'
  | 'pf1/apply-damage'
  | 'pf1/set-condition'
  | 'pf1/get-actor-summary'
  | 'get-world-info'
  | 'get-actors'
  | 'filter-actors'
  | 'filter-items'
  | 'get-actor'
  | 'create-actor'
  | 'create-actor-from-compendium'
  | 'update-actor'
  | 'dnd5e/apply-damage'
  | 'apply-damage' // alias of 'dnd5e/apply-damage'
  | 'dnd5e/apply-healing'
  | 'apply-healing' // alias of 'dnd5e/apply-healing'
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
  | 'resolve-uuid'
  | 'search-compendium-pages'
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
  | 'ping-location'
  // Scene settings, table controls and levels
  | 'get-weather-effects'
  | 'pull-users-to-scene'
  | 'preload-scene'
  | 'regenerate-scene-thumbnail'
  | 'reset-fog'
  | 'get-scene-levels'
  | 'create-scene-level'
  | 'update-scene-level'
  | 'delete-scene-level'
  // Combat encounters, rounds, combatant groups, tracker configuration
  | 'get-combats'
  | 'activate-combat'
  | 'toggle-combat-scene-link'
  | 'next-round'
  | 'previous-round'
  | 'reset-initiative'
  | 'get-combatant-groups'
  | 'create-combatant-group'
  | 'update-combatant-group'
  | 'delete-combatant-group'
  | 'get-combat-tracker-config'
  | 'update-combat-tracker-config'
  // Dice formulas
  | 'validate-roll-formula'
  | 'simulate-roll'
  // Journals: categories, sharing, navigation, search
  | 'create-journal-category'
  | 'update-journal-category'
  | 'delete-journal-category'
  | 'show-image'
  | 'pan-to-note'
  | 'search-journals'
  // Ambient lights
  | 'get-lights'
  | 'create-light'
  | 'update-light'
  | 'delete-light'
  // Ambient sounds
  | 'get-ambient-sounds'
  | 'create-ambient-sound'
  | 'update-ambient-sound'
  | 'delete-ambient-sound'
  | 'play-sound-at-position'
  | 'preload-sound'
  // Tiles
  | 'get-tiles'
  | 'create-tile'
  | 'update-tile'
  | 'delete-tile'
  // Drawings
  | 'get-drawings'
  | 'create-drawing'
  | 'update-drawing'
  | 'delete-drawing'
  // Measured templates
  | 'get-templates'
  | 'create-template'
  | 'update-template'
  | 'delete-template'
  // Regions
  | 'get-regions'
  | 'get-region'
  | 'create-region'
  | 'update-region'
  | 'delete-region'
  | 'create-region-behavior'
  | 'update-region-behavior'
  | 'delete-region-behavior'
  | 'get-region-tokens'
  | 'test-region-point'
  // Cards
  | 'get-card-stacks'
  | 'get-card-stack'
  | 'create-card-stack'
  | 'update-card-stack'
  | 'delete-card-stack'
  | 'create-card'
  | 'update-card'
  | 'delete-card'
  | 'shuffle-cards'
  | 'deal-cards'
  | 'draw-cards'
  | 'pass-cards'
  | 'play-card'
  | 'discard-card'
  | 'recall-cards'
  | 'flip-card'
  | 'show-card'
  // Users
  | 'get-users'
  | 'get-user'
  | 'update-user'
  // Settings
  | 'get-settings'
  | 'get-setting'
  | 'set-setting'
  // Prototype tokens, actor tokens, core token movement
  | 'get-prototype-token'
  | 'update-prototype-token'
  | 'get-actor-tokens'
  | 'get-token-images'
  | 'move-token-path'
  | 'stop-token-movement'
  | 'pause-token-movement'
  | 'resume-token-movement'
  | 'measure-token-path'
  | 'find-token-path'
  | 'get-token-movement-history'
  | 'revert-token-movement'
  | 'clear-token-movement-history'
  // Token selection, targets and speech bubbles on the GM canvas
  | 'select-tokens'
  | 'get-selected-tokens'
  | 'set-targets'
  | 'show-speech-bubble'
  // Doors
  | 'get-door-sounds'
  // Effects (full snapshots, item effects)
  | 'get-actor-effect'
  | 'get-item-effects'
  | 'create-item-effect'
  | 'update-item-effect'
  | 'delete-item-effect'
  // Roll tables (previews, results, folders)
  | 'preview-table-roll'
  | 'normalize-roll-table'
  | 'create-roll-table-from-folder'
  | 'create-table-result'
  | 'update-table-result'
  | 'delete-table-result'
  // Playlists (management)
  | 'create-playlist'
  | 'update-playlist'
  | 'delete-playlist'
  | 'update-playlist-sound'
  | 'delete-playlist-sound'
  | 'play-next-in-playlist'
  | 'import-playlist-sounds'
  // Hotbar
  | 'get-hotbar'
  | 'assign-hotbar-slot'
  | 'move-hotbar-slot'
  | 'clear-hotbar-slot'
  // Calendar
  | 'get-calendar'
  | 'get-time-difference'
  // Notifications and canvas helpers
  | 'create-progress-notification'
  | 'update-progress-notification'
  | 'remove-notification'
  | 'measure-grid-path'
  | 'snap-to-grid'
  | 'get-canvas-view'
  | 'show-scrolling-text'
  // Documents (any document by uuid)
  | 'get-document-ownership'
  | 'set-document-ownership'
  | 'get-document-flags'
  | 'set-document-flag'
  | 'unset-document-flag'
  | 'sort-document'
  | 'search-documents'
  | 'export-document'
  | 'import-document'
  // Compendium management
  | 'get-compendium-info'
  | 'create-compendium'
  | 'duplicate-compendium'
  | 'configure-compendium'
  | 'delete-compendium'
  | 'export-to-compendium'
  | 'export-folder-to-compendium'
  | 'update-compendium-document'
  | 'delete-compendium-document'
  | 'import-compendium'
  | 'import-compendium-folder'
  | 'get-adventure'
  | 'import-adventure'
  // Files
  | 'browse-files'
  | 'create-directory'
  | 'upload-file'
  // Player dialogs
  | 'ask-user'
  | 'get-user-answer'
  | 'cancel-user-question'
  // Event push
  | 'subscribe-events'
  | 'unsubscribe-events'
  | 'get-event-subscriptions'
  | 'get-event-types';

export interface RollDiceParams {
  formula: string;
  showInChat?: boolean;
  flavor?: string;
  /** Who sees the posted roll; the GM's own roll mode when omitted. Matters only with `showInChat`. */
  visibility?: ChatVisibility;
  /** The actor who rolls: its roll data feeds the `@path` references and it speaks the posted roll. A token id wins. */
  actorId?: string;
  tokenId?: string;
  /** The token's scene; the active scene when omitted. */
  sceneId?: string;
  /** The name the posted roll is spoken under; without an actor or token it names no actor or token at all. */
  alias?: string;
  /**
   * Values for the `@path` references, layered over the actor's roll data (a
   * top-level key replaces the actor's key of the same name). With any roll
   * data, a reference it does not set is an error instead of rolling as 0.
   */
  data?: RollDataValues;
}

export interface RollAbilityParams {
  actorId: string;
  ability: AbilityKey;
  advantage?: boolean;
  disadvantage?: boolean;
  showInChat?: boolean;
}

export interface RollSkillParams {
  actorId: string;
  skill: string;
  advantage?: boolean;
  disadvantage?: boolean;
  showInChat?: boolean;
}

export interface RollSaveParams {
  actorId: string;
  ability: AbilityKey;
  advantage?: boolean;
  disadvantage?: boolean;
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
  advantage?: boolean;
  disadvantage?: boolean;
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
  /** World actor id. Either this or `tokenId` is required. */
  actorId?: string;
  /** A token's actor instead: the synthetic actor of an unlinked token, or the linked actor. */
  tokenId?: string;
  /** Scene the token is on; defaults to the active scene. */
  sceneId?: string;
  name?: string;
  img?: string;
  folder?: string;
  system?: Record<string, unknown>;
}

export interface DeleteActorParams {
  actorId: string;
}

// Savage Worlds Adventure Edition (swade/*) — trait rolls with wild die and
// raises, Toughness damage, soak, bennies, statuses, sheet summary and action
// cards. Every actor-bound command addresses a world actor by `actorId` or one
// token's actor by `tokenId` (+ optional `sceneId`).
export type SwadeAttributeKeyWire = 'agility' | 'smarts' | 'spirit' | 'strength' | 'vigor';

export interface SwadeActorTargetParams {
  /** World actor id. Either this or `tokenId` is required. */
  actorId?: string;
  /** A token's actor instead: an unlinked token's synthetic actor takes the hit alone. */
  tokenId?: string;
  /** Scene the token is on; defaults to the active scene. */
  sceneId?: string;
}

export interface SwadeRollAttributeParams extends SwadeActorTargetParams {
  attribute: SwadeAttributeKeyWire;
  modifier?: number;
  modifierLabel?: string;
  /** Target number, default 4. */
  targetNumber?: number;
  ignoreWounds?: boolean;
  showInChat?: boolean;
}

export interface SwadeRollSkillParams extends SwadeActorTargetParams {
  /** Skill item id or name (case-insensitive). */
  skill: string;
  modifier?: number;
  modifierLabel?: string;
  targetNumber?: number;
  ignoreWounds?: boolean;
  /** Roll d4−2 as an unskilled attempt when the actor lacks the skill. */
  unskilled?: boolean;
  showInChat?: boolean;
}

export interface SwadeDieResult {
  type: string;
  /** Every face rolled, explosions included. */
  results: number[];
  total: number;
  wild: boolean;
  /** The die `kh` kept. */
  kept: boolean;
}

export interface SwadeRollModifier {
  label: string;
  value: number | string;
}

export interface SwadeTraitRollResult {
  actorId: string;
  tokenId?: string;
  /** `'agility'` … `'vigor'`, a skill name, or `'Unskilled'`. */
  trait: string;
  /** Kept die plus modifiers (the system's `roll.total`). */
  total: number;
  formula: string;
  dice: SwadeDieResult[];
  modifiers: SwadeRollModifier[];
  /** Exact: `total − kept die total`. */
  modifierTotal: number;
  targetNumber: number;
  /** The system's `roll.successes`: −1 critical failure, 0 failure, 1 success, 2+ raises. */
  successes: number;
  outcome: 'critical-failure' | 'failure' | 'success' | 'raise';
  raises: number;
  isCriticalFailure: boolean;
  /** A wild die was part of the pool. */
  wildDie: boolean;
  /** Neutral flag: `raises > 0`. */
  isCritical: boolean;
  /** Neutral flag: `isCriticalFailure`. */
  isFumble: boolean;
  messageId?: string;
}

export interface SwadeRollAttackParams extends SwadeActorTargetParams {
  /** Weapon item id. */
  itemId: string;
  /** Melee attacks use the target's Parry as the target number. */
  targetTokenId?: string;
  targetNumber?: number;
  modifier?: number;
  modifierLabel?: string;
  showInChat?: boolean;
}

export interface SwadeAttackWeaponWire {
  id: string;
  name: string;
  damage: string;
  ap: number;
  range: string;
  isMelee: boolean;
}

export interface SwadeAttackTargetWire {
  tokenId: string;
  actorId: string;
  name: string;
  parry: number;
}

export interface SwadeAttackRollResult extends SwadeTraitRollResult {
  weapon: SwadeAttackWeaponWire;
  target?: SwadeAttackTargetWire;
  /** `successes >= 1`. */
  hit: boolean;
}

export interface SwadeRollDamageParams extends SwadeActorTargetParams {
  /** Weapon item id. */
  itemId: string;
  /** Add the weapon's raise damage die (default +1d6x). */
  raise?: boolean;
  modifier?: number | string;
  modifierLabel?: string;
  /** Overrides the weapon's AP. */
  ap?: number;
  /** Preview (never apply) the damage rule against this token in `versusTarget`. */
  targetTokenId?: string;
  showInChat?: boolean;
}

export interface SwadeDamagePreview {
  toughness: number;
  armor: number;
  apApplied: number;
  effectiveToughness: number;
  /** `damage − effectiveToughness`; may be negative. */
  excess: number;
  outcome: 'none' | 'shaken' | 'wounded';
  /** After the wound cap. */
  woundsInflicted: number;
  /** Already Shaken, so the second Shaken became a Wound. */
  doubleShaken: boolean;
  wouldIncapacitate: boolean;
}

export interface SwadeDamageRollResult {
  actorId: string;
  tokenId?: string;
  weapon: { id: string; name: string };
  total: number;
  formula: string;
  dice: SwadeDieResult[];
  ap: number;
  isHeavyWeapon: boolean;
  raiseDamageIncluded: boolean;
  versusTarget?: SwadeDamagePreview;
  isCritical: false;
  isFumble: false;
  messageId?: string;
}

export interface SwadeApplyDamageParams extends SwadeActorTargetParams {
  damage: number;
  ap?: number;
  isHeavyWeapon?: boolean;
  /** `false` previews the rule without touching the actor. Default `true`. */
  apply?: boolean;
}

export interface SwadeApplyDamageResult extends SwadeDamagePreview {
  actorId: string;
  tokenId?: string;
  applied: boolean;
  shakenBefore: boolean;
  shakenAfter: boolean;
  woundsBefore: number;
  woundsAfter: number;
  woundsMax: number;
  incapacitated: boolean;
  /** `applied && woundsInflicted > 0 && wild card && bennies > 0`. */
  canSoak: boolean;
}

export interface SwadeSoakParams extends SwadeActorTargetParams {
  /** The Wounds just inflicted. */
  wounds: number;
  /** Default `true`. */
  spendBenny?: boolean;
  modifier?: number;
  modifierLabel?: string;
  /** Also clear Incapacitated when every Wound is soaked. */
  clearIncapacitated?: boolean;
  showInChat?: boolean;
}

export interface SwadeSoakResult {
  actorId: string;
  tokenId?: string;
  roll: SwadeTraitRollResult;
  woundsSoaked: number;
  woundsRemaining: number;
  woundsAfter: number;
  bennySpent: boolean;
  benniesLeft: number;
  shakenRemoved: boolean;
}

export type SwadeBennyActionWire = 'spend' | 'give' | 'refresh';

export interface SwadeBenniesParams extends SwadeActorTargetParams {
  /** The GM's own bennies on `game.user` instead of an actor's. */
  gm?: true;
  action: SwadeBennyActionWire;
}

export interface SwadeBenniesResult {
  owner: 'actor' | 'gm';
  actorId?: string;
  tokenId?: string;
  action: SwadeBennyActionWire;
  before: number;
  after: number;
  max?: number;
}

export type SwadeStatusIdWire =
  | 'shaken' | 'incapacitated' | 'dead' | 'aiming' | 'berserk' | 'wild-attack' | 'defending' | 'holding'
  | 'bound' | 'entangled' | 'frightened' | 'distracted' | 'encumbered' | 'prone' | 'stunned' | 'vulnerable'
  | 'bleeding-out' | 'diseased' | 'heart-attack' | 'on-fire' | 'poisoned' | 'cover-shield' | 'cover' | 'reach'
  | 'torch' | 'burrowing' | 'flying' | 'invisible' | 'blind' | 'cold-bodied' | 'smite' | 'protection';

export interface SwadeSetStatusParams extends SwadeActorTargetParams {
  status: SwadeStatusIdWire;
  active: boolean;
  overlay?: boolean;
}

export interface SwadeSetStatusResult {
  actorId: string;
  tokenId?: string;
  status: string;
  active: boolean;
  /** All active status ids after the call, linked statuses included. */
  statuses: string[];
}

export type SwadeGetActorSummaryParams = SwadeActorTargetParams;

export interface SwadeAttributeSummaryWire {
  die: number;
  modifier: number;
  wildDie: number;
}

export interface SwadeSkillSummaryWire {
  id: string;
  name: string;
  die: number;
  modifier: number;
  wildDie: number;
  attribute: string;
}

export interface SwadeWeaponSummaryWire {
  id: string;
  name: string;
  damage: string;
  ap: number;
  rof: number;
  range: string;
  parry: number;
  minStr: string;
  trait: string;
  traitMod: string;
  dmgMod: string;
  equipStatus: number;
  shots: number;
  currentShots: number;
  isMelee: boolean;
  isHeavyWeapon: boolean;
}

export interface SwadePowerSummaryWire {
  id: string;
  name: string;
  pp: number;
  arcane: string;
  rank: string;
  range: string;
  duration: string;
  damage: string;
}

export interface SwadeActorSummary {
  actorId: string;
  tokenId?: string;
  name: string;
  type: 'character' | 'npc' | 'vehicle' | 'group';
  wildcard: boolean;
  attributes?: Record<SwadeAttributeKeyWire, SwadeAttributeSummaryWire>;
  skills?: SwadeSkillSummaryWire[];
  derived?: { parry: number; toughness: number; armor: number; size: number; pace: number; runningDie: string | null };
  bennies?: { value: number; max: number };
  /** `penalty` from the actor's `calcWoundPenalties()`. */
  wounds?: { value: number; max: number; ignored: number; penalty: number };
  /** `penalty` from `calcFatiguePenalties()`. */
  fatigue?: { value: number; max: number; penalty: number };
  powerPoints?: Record<string, { value: number; max: number }>;
  status: {
    shaken: boolean;
    stunned: boolean;
    distracted: boolean;
    vulnerable: boolean;
    entangled: boolean;
    bound: boolean;
    incapacitated: boolean;
    active: string[];
  };
  conviction?: { value: number; active: boolean };
  rank?: string;
  initiative?: { levelHeaded: boolean; improvedLevelHeaded: boolean; quick: boolean; hesitant: boolean };
  weapons: SwadeWeaponSummaryWire[];
  powers: SwadePowerSummaryWire[];
  vehicle?: {
    toughness: number;
    armor: number;
    wounds: { value: number; max: number };
    handling: number;
    topSpeed: { value: number; unit: string };
    outOfControl: boolean;
    wrecked: boolean;
  };
}

export interface SwadeGetActionCardsParams {
  /** Defaults to the active combat. */
  combatId?: string;
}

export interface SwadeActionCardCombatantWire {
  combatantId: string;
  name: string;
  actorId: string | null;
  tokenId: string | null;
  /** `cardValue + suitValue / 10`. */
  initiative: number | null;
  cardValue: number | null;
  suitValue: number | null;
  cardString: string | null;
  hasJoker: boolean;
  roundHeld: number | null;
  turnLost: boolean;
  isGroupLeader: boolean;
  isDefeated: boolean;
}

export interface SwadeActionCardsResult {
  combatId: string;
  round: number;
  turn: number;
  combatants: SwadeActionCardCombatantWire[];
}

// Call of Cthulhu 7th edition (coc7/*) — d100 checks with bonus/penalty dice,
// weapon attacks and damage, hit points, sanity loss and bouts of madness,
// Luck, conditions and the sheet summary. The world's system id is `CoC7`;
// the wire prefix is lowercase. Every actor-bound command addresses a world
// actor by `actorId` or one token's actor by `tokenId` (+ optional `sceneId`).
export type Coc7CharacteristicKeyWire = 'str' | 'con' | 'siz' | 'dex' | 'app' | 'int' | 'pow' | 'edu';
export type Coc7CharacteristicCheckWire = Coc7CharacteristicKeyWire | 'idea' | 'know';
export type Coc7AttributeKeyWire = 'luck' | 'sanity';
export type Coc7DifficultyWire = 'unknown' | 'regular' | 'hard' | 'extreme' | 'critical';
export type Coc7OutcomeWire = 'fumble' | 'failure' | 'regular' | 'hard' | 'extreme' | 'critical';
export type Coc7ConditionWire = 'criticalWounds' | 'unconscious' | 'dying' | 'dead' | 'prone' | 'tempoInsane' | 'indefInsane';
export type Coc7RangeBandWire = 'normal' | 'long' | 'extreme';
export type Coc7LuckActionWire = 'spend' | 'set' | 'add';
export type Coc7CheckKindWire = 'skill' | 'characteristic' | 'attribute' | 'weapon';

export interface Coc7ActorTargetParams {
  /** World actor id. Either this or `tokenId` is required. */
  actorId?: string;
  /** A token's actor instead: an unlinked token's synthetic actor takes the hit alone. */
  tokenId?: string;
  /** Scene the token is on; defaults to the active scene. */
  sceneId?: string;
}

export interface Coc7CheckOptions {
  /** Default: the world setting `defaultCheckDifficulty`. */
  difficulty?: Coc7DifficultyWire;
  /** 0–2; exclusive with `penaltyDice`. */
  bonusDice?: number;
  /** 0–2; exclusive with `bonusDice`. */
  penaltyDice?: number;
  /** Added to the rolled number (house rule). */
  flatDiceModifier?: number;
  /** Added to the threshold (house rule). */
  flatThresholdModifier?: number;
  /** Whisper the card to GMs. */
  blind?: boolean;
  /** Post the module's card; default false. */
  showInChat?: boolean;
}

export interface Coc7RollSkillParams extends Coc7ActorTargetParams, Coc7CheckOptions {
  /** Skill item id, name (`Spot Hidden`, `Fighting (Brawl)`) or CoC ID (`i.skill.dodge`). */
  skill: string;
}

export interface Coc7RollCharacteristicParams extends Coc7ActorTargetParams, Coc7CheckOptions {
  /** `idea` rolls INT, `know` rolls EDU. */
  characteristic: Coc7CharacteristicCheckWire;
}

export interface Coc7RollAttributeParams extends Coc7ActorTargetParams, Coc7CheckOptions {
  attribute: Coc7AttributeKeyWire;
}

export interface Coc7TensDie {
  /** 0, 10, … 90 (0 = the 00 face). */
  value: number;
  /** The die the roll kept (lowest with bonus dice, highest with penalty dice). */
  kept: boolean;
}

export interface Coc7CheckDice {
  tens: Coc7TensDie[];
  /** 0–9. */
  unit: number;
  bonusDice: number;
  penaltyDice: number;
}

export interface Coc7Thresholds {
  /** Upper bound of each success level after `flatThresholdModifier`; 0 when the level does not exist. */
  regular: number;
  hard: number;
  extreme: number;
  /** Lowest fumble: 96 or 100. */
  fumbleFrom: number;
}

export interface Coc7LuckRequired {
  regular: number;
  hard: number;
  extreme: number;
}

export interface Coc7CheckResult {
  actorId: string;
  tokenId?: string;
  kind: Coc7CheckKindWire;
  /** Skill name, `STR` … `EDU`, `Idea`, `Know`, `Luck`, `Sanity`. */
  name: string;
  /** The value rolled against, before `flatThresholdModifier`. */
  threshold: number;
  /** Effective difficulty. */
  difficulty: Coc7DifficultyWire;
  thresholds: Coc7Thresholds;
  dice: Coc7CheckDice;
  /** 1–100 after `flatDiceModifier`. */
  total: number;
  /** −99 fumble, 0 failure, 1 regular, 2 hard, 3 extreme, 4 critical. */
  successLevel: number;
  outcome: Coc7OutcomeWire;
  /** `successLevel >= difficulty`; null when the difficulty is unknown. */
  isSuccess: boolean | null;
  isCritical: boolean;
  isFumble: boolean;
  /** Luck points that would raise the roll to each level (0 = already there or the level does not exist). */
  luckRequired: Coc7LuckRequired;
  /** A failed, pushable roll: call again for the pushed roll. */
  canPush: boolean;
  /** The skill got its development tick. */
  markedForDevelopment: boolean;
  messageId?: string;
}

export interface Coc7RollAttackParams extends Coc7ActorTargetParams, Coc7CheckOptions {
  /** Weapon item id or name. */
  itemId: string;
  /** Roll the weapon's alternative skill (burst, auto, thrown). */
  alternativeSkill?: boolean;
}

export interface Coc7WeaponDamageFormulas {
  /** Damage bonus already applied (`1d6+1d4`). */
  normal: string;
  long?: string;
  extreme?: string;
}

export interface Coc7SkillRef {
  id: string;
  name: string;
  value: number;
}

export interface Coc7AttackWeapon {
  id: string;
  name: string;
  skill: Coc7SkillRef;
  ranged: boolean;
  malfunction?: number;
  impaling: boolean;
  damage: Coc7WeaponDamageFormulas;
}

export interface Coc7AttackRollResult extends Coc7CheckResult {
  weapon: Coc7AttackWeapon;
  /** `total >= weapon.malfunction`. */
  isMalfunction: boolean;
  /** Extreme or critical success with an impaling weapon. */
  impale: boolean;
}

export interface Coc7RollDamageParams extends Coc7ActorTargetParams {
  itemId: string;
  /** Default `normal`. */
  range?: Coc7RangeBandWire;
  /** `extreme` maximizes the damage (impaling weapons add a normal roll on top). */
  successLevel?: 'regular' | 'hard' | 'extreme';
  /** Preview against this token's armor; nothing is applied. */
  targetTokenId?: string;
  showInChat?: boolean;
}

export interface Coc7DieRoll {
  formula: string;
  results: number[];
  total: number;
}

export interface Coc7DamageTarget {
  tokenId: string;
  name: string;
  armor: number;
  /** When the target's armor is a formula, the formula that was rolled. */
  armorFormula?: string;
  wouldInflict: number;
}

export interface Coc7DamageRollResult {
  actorId: string;
  tokenId?: string;
  weapon: { id: string; name: string };
  range: Coc7RangeBandWire;
  formula: string;
  /** The damage bonus term appended (`+1d4`, `+1d2`, `-1`, or empty). */
  damageBonus: string;
  impale: boolean;
  maximized: boolean;
  dice: Coc7DieRoll[];
  total: number;
  versusTarget?: Coc7DamageTarget;
  messageId?: string;
}

export interface Coc7ApplyDamageParams extends Coc7ActorTargetParams {
  /** Damage before armor (≥ 1). Exclusive with `heal`. */
  damage?: number;
  /** Hit points to restore (≥ 1), capped at the maximum. */
  heal?: number;
  ignoreArmor?: boolean;
  /** Override the target's armor (number or formula). */
  armor?: string | number;
}

export interface Coc7Conditions {
  criticalWounds: boolean;
  unconscious: boolean;
  dying: boolean;
  dead: boolean;
  prone: boolean;
  tempoInsane: boolean;
  indefInsane: boolean;
}

export interface Coc7ApplyDamageResult {
  actorId: string;
  tokenId?: string;
  applied: number;
  armorAbsorbed: number;
  healed: number;
  hpBefore: number;
  hpAfter: number;
  hpMax: number;
  majorWound: boolean;
  unconscious: boolean;
  dying: boolean;
  dead: boolean;
  conditions: Coc7Conditions;
}

export interface Coc7SanityCheckParams extends Coc7ActorTargetParams {
  /** Loss on a passed check: number or formula (`0`, `1`, `1d4`). */
  lossPassed: string | number;
  /** Loss on a failed check (`1d6`, `1d10`); a fumble takes its maximum. */
  lossFailed: string | number;
  /** The source (a creature name): caps the total loss to it at the maximum of `lossFailed`. */
  reason?: string;
  difficulty?: Coc7DifficultyWire;
  bonusDice?: number;
  penaltyDice?: number;
  /** Default true; false only reports. */
  apply?: boolean;
  showInChat?: boolean;
}

export interface Coc7SanityCheckResult {
  actorId: string;
  tokenId?: string;
  roll: Coc7CheckResult;
  immune: 'none' | 'bout' | 'reason';
  lossFormula: string;
  lossRolled: number;
  /** After the per-reason cap and Mythos hardening. */
  lossApplied: number;
  limitedByReason: boolean;
  mythosHardened: boolean;
  applied: boolean;
  sanBefore: number;
  sanAfter: number;
  sanMax: number;
  dailyLoss: number;
  dailyLimit: number;
  /** Lost 5+ at once: an INT roll decides the bout of madness. */
  temporaryInsanity: boolean;
  indefiniteInsanity: boolean;
  permanentInsanity: boolean;
  /** The pulp rule "Luck halves SAN loss" is on and was not offered. */
  luckOfferSkipped: boolean;
  messageId?: string;
}

export interface Coc7BoutOfMadnessParams extends Coc7ActorTargetParams {
  /** true (default): rounds; false: hours (summary bout). */
  realTime?: boolean;
  /** Default 1. */
  duration?: number;
}

export interface Coc7BoutOfMadnessResult {
  actorId: string;
  tokenId?: string;
  name: string;
  description: string;
  phobia: boolean;
  mania: boolean;
  realTime: boolean;
  duration: number;
  tempoInsane: boolean;
}

export interface Coc7LuckParams extends Coc7ActorTargetParams {
  action: Coc7LuckActionWire;
  amount: number;
}

export interface Coc7LuckResult {
  actorId: string;
  tokenId?: string;
  action: Coc7LuckActionWire;
  before: number;
  after: number;
}

export interface Coc7SetConditionParams extends Coc7ActorTargetParams {
  condition: Coc7ConditionWire;
  active: boolean;
  /** `tempoInsane` only: rounds (true) or hours (false). */
  realTime?: boolean;
  duration?: number;
}

export interface Coc7StatusSummary {
  id: string;
  name: string;
  phobia: boolean;
  mania: boolean;
}

export interface Coc7SetConditionResult {
  actorId: string;
  tokenId?: string;
  conditions: Coc7Conditions;
  statuses: Coc7StatusSummary[];
}

export type Coc7GetActorSummaryParams = Coc7ActorTargetParams;

export interface Coc7CharacteristicSummary {
  key: Coc7CharacteristicKeyWire;
  label: string;
  value: number;
  half: number;
  fifth: number;
}

export interface Coc7PoolSummary {
  value: number;
  max: number;
}

export interface Coc7SanitySummary {
  value: number;
  max: number;
  dailyLoss: number;
  dailyLimit: number;
  mythosHardened: boolean;
}

export interface Coc7AttributesSummary {
  hp: Coc7PoolSummary;
  mp: Coc7PoolSummary;
  sanity: Coc7SanitySummary;
  luck: number;
  mov: number;
  /** Damage bonus formula (`1d4`, `0`, `-1`). */
  db: string;
  build: number;
  /** Number or formula as the sheet stores it. */
  armor: string;
}

export interface Coc7SkillSummary {
  id: string;
  name: string;
  value: number;
  half: number;
  fifth: number;
  base: string;
  specialization?: string;
  push: boolean;
  fighting: boolean;
  firearm: boolean;
  special: boolean;
  rare: boolean;
  /** Ticked for development. */
  development: boolean;
}

export interface Coc7WeaponSummary {
  id: string;
  name: string;
  skill?: Coc7SkillRef;
  alternativeSkill?: Coc7SkillRef;
  ranged: boolean;
  damage: Coc7WeaponDamageFormulas;
  range: { normal: string; long?: string; extreme?: string };
  usesPerRound: string;
  bullets?: number;
  ammo?: number;
  malfunction?: number;
  impaling: boolean;
  /** The weapon property keys that are on (`rngd`, `impl`, `auto`, …). */
  properties: string[];
}

export interface Coc7SpellSummary {
  id: string;
  name: string;
  costs: { hitPoints: string; magicPoints: string; sanity: string; power: string; others: string };
}

export interface Coc7CreatureSummary {
  sanLoss: { passed: string; failed: string };
  attacksPerRound: string;
}

export interface Coc7VehicleSummary {
  hp?: number;
  mov?: number;
  build?: number;
  armor?: number;
  crew: string;
  armed: boolean;
}

export interface Coc7ActorSummary {
  id: string;
  name: string;
  type: string;
  characteristics: Coc7CharacteristicSummary[];
  /** Absent for vehicles. */
  attributes?: Coc7AttributesSummary;
  conditions: Coc7Conditions;
  statuses: Coc7StatusSummary[];
  skills: Coc7SkillSummary[];
  weapons: Coc7WeaponSummary[];
  spells: Coc7SpellSummary[];
  infos: { occupation: string; age: string; archetype?: string; organization?: string };
  creditRating?: number;
  creature?: Coc7CreatureSummary;
  vehicle?: Coc7VehicleSummary;
}

// Pathfinder 1st edition (pf1/*) — ability, skill, save, caster level and
// concentration checks, item use (attacks with damage and critical
// confirmation, spells, consumables), damage and healing, conditions and the
// sheet summary. Every actor-bound command addresses a world actor by
// `actorId` or one token's actor by `tokenId` (+ optional `sceneId`).
export type Pf1AbilityKeyWire = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type Pf1SaveKeyWire = 'fort' | 'ref' | 'will';
export type Pf1RollModeWire = 'publicroll' | 'gmroll' | 'blindroll' | 'selfroll';
export type Pf1CheckKindWire = 'ability' | 'skill' | 'save' | 'caster-level' | 'concentration';

export interface Pf1ActorTargetParams {
  actorId?: string;
  tokenId?: string;
  sceneId?: string;
}

export interface Pf1CheckOptionsParams extends Pf1ActorTargetParams {
  /** Extra formula added to the check: `2`, `1d4[Bless]`. */
  bonus?: string | number;
  /** Fills `isSuccess`. */
  dc?: number;
  /** Take 10 or Take 20. */
  takeX?: 10 | 20;
  rollMode?: Pf1RollModeWire;
  /** Post the system's chat card (default false). */
  showInChat?: boolean;
}

export interface Pf1RollAbilityParams extends Pf1CheckOptionsParams {
  ability: Pf1AbilityKeyWire;
}

export interface Pf1RollSkillParams extends Pf1CheckOptionsParams {
  /** Skill id (`per`, `crf.alchemy`) or its sheet name (`Perception`, `Craft (Alchemy)`). */
  skill: string;
}

export interface Pf1RollSaveParams extends Pf1CheckOptionsParams {
  save: Pf1SaveKeyWire;
}

export interface Pf1RollSpellbookCheckParams extends Pf1CheckOptionsParams {
  /** `primary` (default), `secondary`, `tertiary` or `spelllike`. */
  spellbook?: string;
}

export interface Pf1DieResult {
  type: string;
  count: number;
  /** Kept results only. */
  results: number[];
}

export interface Pf1RollResult {
  total: number;
  formula: string;
  dice: Pf1DieResult[];
}

export interface Pf1D20RollResult extends Pf1RollResult {
  /** The kept d20 (or the Take 10/20 value); null when the roll had no d20. */
  natural: number | null;
  /** Take 10 / Take 20. */
  isStatic: boolean;
}

export interface Pf1CheckResult extends Pf1D20RollResult {
  actorId: string;
  tokenId?: string;
  kind: Pf1CheckKindWire;
  id: string;
  name: string;
  dc?: number;
  /** total ≥ dc; saves also succeed on a natural 20 and fail on a natural 1. */
  isSuccess?: boolean;
  isNat20: boolean;
  isNat1: boolean;
  messageId?: string;
}

export interface Pf1UseItemParams extends Pf1ActorTargetParams {
  /** Item id or name. */
  item: string;
  /** Defaults to the item's first action. */
  actionId?: string;
  /** Charge / spell slot cost override; 0 spends nothing, a negative cost restores charges (the system's own rule). */
  cost?: number;
  rollMode?: Pf1RollModeWire;
  showInChat?: boolean;
  powerAttack?: boolean;
  primaryAttack?: boolean;
  pointBlankShot?: boolean;
  flanking?: boolean;
  highGround?: boolean;
  charge?: boolean;
  /** Roll a caster level check with the spell. */
  clCheck?: boolean;
  /** Ammo item id; the system saves it as the weapon's default ammunition before attacking. */
  ammo?: string;
}

export interface Pf1DamageRollResult extends Pf1RollResult {
  /** Damage type ids: `slashing`, `fire`, … */
  types: string[];
}

export interface Pf1AttackRollResult extends Pf1D20RollResult {
  /** Natural roll inside the critical range; only a threat when the system also rolled `critConfirm` (never for maneuvers). */
  isThreat: boolean;
  isNat1: boolean;
}

export interface Pf1AttackResult {
  label: string | null;
  attack?: Pf1AttackRollResult;
  /** Rolled by the system on a threat. */
  critConfirm?: Pf1D20RollResult;
  damage: Pf1DamageRollResult[];
  /** Normal damage, minimum 1. */
  damageTotal: number;
  critDamage: Pf1DamageRollResult[];
  /** The whole damage of a confirmed critical hit, normal damage included. */
  critDamageTotal?: number;
  nonlethal: boolean;
}

export interface Pf1UseItemResult {
  actorId: string;
  tokenId?: string;
  item: { id: string; name: string; type: string };
  action?: { id: string; name: string };
  attacks: Pf1AttackResult[];
  save?: { dc: number; type?: string };
  messageId?: string;
}

export interface Pf1ApplyDamageParams extends Pf1ActorTargetParams {
  /** Exactly one of `damage` and `heal`. */
  damage?: number;
  heal?: number;
  nonlethal?: boolean;
  /** Wounds & Vigor: damage goes straight to Wounds. */
  asWounds?: boolean;
  /** DR / energy resistance subtracted from the damage. */
  reduction?: number;
  /** Damage multiplier applied first: 0.5 half, 1.5 vulnerable. */
  ratio?: number;
}

export interface Pf1HealthStateWire {
  hp: { value: number; max: number; temp: number; nonlethal: number };
  vigor?: { value: number; max: number; temp: number };
  wounds?: { value: number; max: number };
}

export interface Pf1ApplyDamageResult {
  actorId: string;
  tokenId?: string;
  /** False when the health did not change (ratio and reduction left nothing, or healing at full HP). */
  applied: boolean;
  before: Pf1HealthStateWire;
  after: Pf1HealthStateWire;
}

export interface Pf1SetConditionParams extends Pf1ActorTargetParams {
  /** A `pf1.registry.conditions` id (`shaken`, `flatFooted`, `prone`, …); case-insensitive. */
  condition: string;
  active: boolean;
}

export interface Pf1SetConditionResult {
  actorId: string;
  tokenId?: string;
  condition: string;
  /** Still false after enabling: the actor is immune. */
  active: boolean;
  changed: boolean;
  conditions: string[];
}

export type Pf1GetActorSummaryParams = Pf1ActorTargetParams;

export interface Pf1ActorSummary {
  actorId: string;
  tokenId?: string;
  name: string;
  type: string;
  level: number | null;
  cr: number | null;
  alignment: string | null;
  abilities: Partial<Record<Pf1AbilityKeyWire, { total: number | null; mod: number | null; damage: number; drain: number }>>;
  health: Pf1HealthStateWire | null;
  ac: { normal: number | null; touch: number | null; flatFooted: number | null };
  cmb: number | null;
  cmd: number | null;
  cmdFlatFooted: number | null;
  bab: number | null;
  initiative: number | null;
  sr: number | null;
  saves: Partial<Record<Pf1SaveKeyWire, number | null>>;
  speed: Record<string, number>;
  conditions: string[];
  classes: { id: string; name: string; level: number | null }[];
  skills: { id: string; name: string; mod: number | null; rank: number; classSkill: boolean; trainedOnly: boolean }[];
  spellbooks: { id: string; name: string; class: string; casterLevel: number | null; concentration: number | null }[];
  spells: { id: string; name: string; level: number | null; spellbook: string; prepared: number | null; preparedMax: number | null }[];
  usableItems: { id: string; name: string; type: string; actions: { id: string; name: string }[] }[];
  activeBuffs: { id: string; name: string; level: number | null }[];
}

// Hit points (dnd5e): damage and healing through Actor5e#applyDamage
export interface ApplyDamageParams {
  /** World actor id. Either this or `tokenId` is required. */
  actorId?: string;
  /** A token's actor instead: an unlinked token takes the hit alone. */
  tokenId?: string;
  /** Scene the token is on; defaults to the active scene. */
  sceneId?: string;
  /** Damage amount before resistances; temp HP absorbs it first. */
  amount: number;
  /** dnd5e damage type (`slashing`, `fire`, …); resistances and immunities apply when given. */
  type?: string;
}

export interface ApplyHealingParams {
  actorId?: string;
  tokenId?: string;
  sceneId?: string;
  amount: number;
}

export interface HitPointsChangeResult {
  actorId: string;
  tokenId?: string;
  hpBefore: number;
  hpAfter: number;
  tempBefore: number;
  tempAfter: number;
  maxHp: number;
}

// Actor Results
export interface ActorResult {
  id: string;
  uuid: string;
  /** Set when the command addressed a token rather than a world actor. */
  tokenId?: string;
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

// Filter Compendium Actors (dnd5e/filter-compendium-actors) — same filters as
// filter-actors over compendium packs; world-only filters (folder,
// hasPlayerOwner, currentHp) intentionally absent.
export interface FilterCompendiumActorsParams {
  packIds?: string[];
  name?: string;
  type?: string[];
  creatureType?: string[];
  size?: string[];
  disposition?: string[];
  cr?: FilterActorsRange;
  level?: FilterActorsRange;
  maxHp?: FilterActorsRange;
  ac?: FilterActorsRange;
  abilities?: FilterActorsAbilities;
  limit?: number;
  offset?: number;
}

export interface FilterCompendiumActorsResultEntry {
  id: string;
  name: string;
  packId: string;
  uuid: string;
}

export interface FilterCompendiumActorsResult {
  results: FilterCompendiumActorsResultEntry[];
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

// Pathfinder 2e compendium search (pf2e/filter-compendium-actors|items) —
// pf2e-native filter surface (level, traits, rarity, ...); entries carry
// `level` in addition to the cross-pack address (packId + uuid).
export interface Pf2eCompendiumSearchResultEntry {
  id: string;
  name: string;
  level: number | null;
  packId: string;
  uuid: string;
}

export interface Pf2eCompendiumSearchResult {
  results: Pf2eCompendiumSearchResultEntry[];
  total: number;
  hasMore: boolean;
}

export interface Pf2eFilterCompendiumActorsParams {
  packIds?: string[];
  name?: string;
  type?: string[];
  level?: FilterActorsRange;
  traits?: string[];
  rarity?: string[];
  size?: string[];
  maxHp?: FilterActorsRange;
  ac?: FilterActorsRange;
  limit?: number;
  offset?: number;
}

export interface Pf2eFilterCompendiumItemsParams {
  packIds?: string[];
  name?: string;
  type?: string[];
  level?: FilterActorsRange;
  traits?: string[];
  rarity?: string[];
  category?: string[];
  traditions?: string[];
  priceGold?: FilterActorsRange;
  limit?: number;
  offset?: number;
}

// Filter Compendium Items (dnd5e/filter-compendium-items) — same filters as
// filter-items over compendium packs; the world-only folder filter is
// intentionally absent.
export interface FilterCompendiumItemsParams {
  packIds?: string[];
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
  limit?: number;
  offset?: number;
}

export interface FilterCompendiumItemsResultEntry {
  id: string;
  name: string;
  packId: string;
  uuid: string;
}

export interface FilterCompendiumItemsResult {
  results: FilterCompendiumItemsResultEntry[];
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
  /**
   * Who sees it, applied over the recipients the way the core does: `gm` and
   * `blind` keep the recipients (the GMs when there are none). `public` and
   * `self` cannot be combined with recipients.
   */
  visibility?: ChatVisibility;
  /**
   * Whisper recipients by user id or user name — or `gm`, `players`, a player's
   * character name, as the core's /whisper reads them. Added to `whisperTo`;
   * one that matches no user is an error.
   */
  recipients?: string[];
  /** The token that speaks the message; wins over `actorId`. */
  tokenId?: string;
  /** The token's scene; the active scene when omitted. */
  sceneId?: string;
  /**
   * The name the message is spoken under, always: it wins over the token's or
   * actor's name and over `speaker`. Without a token or actor the message names
   * no actor or token at all (not the token the GM happens to control).
   */
  alias?: string;
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
  /** A blind message (roll): its content is hidden from its author unless a GM. */
  blind: boolean;
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

export interface CreateJournalPageParams extends JournalPageOptionsParams {
  journalId: string;
  name: string;
  type?: JournalPageType;
  content?: string;
  src?: string;
}

export interface UpdateJournalPageParams extends JournalPageOptionsParams {
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

/**
 * With `actorId` (and maybe `tokenId`) the combatant is created from these ids
 * as given; its token, if any, is resolved by the core on the encounter's scene.
 * With `tokenId` and no `actorId`, or with `sceneId`, the token is looked up
 * first — on `sceneId`, else on the encounter's scene, else on the active one —
 * and added the way the core adds a token: with its scene, its actor and its
 * hidden flag. That is the way to add an unlinked token, or a token of another
 * scene; a token of a scene other than the encounter's unlinks the encounter
 * (core server rule). A token already in the encounter is refused.
 */
export interface AddCombatantParams {
  combatId?: string;
  /** Required without `tokenId`. Given with a looked-up token, it must be that token's actor. */
  actorId?: string;
  tokenId?: string;
  /** The scene of the token; given, the token is looked up first. Null or empty reads as omitted. */
  sceneId?: string | null;
  initiative?: number;
  /** For a looked-up token, defaults to the token's hidden flag. */
  hidden?: boolean;
  /** Foundry 13+, refused on older cores: the combatant group to put the combatant in. Null reads as omitted. */
  groupId?: string | null;
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
  /** The same fields nested, as the REST API sends them. A top-level field wins. */
  updates?: { initiative?: number | null; defeated?: boolean; hidden?: boolean };
  /** Foundry 13+, refused on older cores: moves the combatant into this group; `null` takes it out of its group. */
  groupId?: string | null;
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
export interface CreateTokenParams extends CreateTokenAppearanceParams {
  sceneId?: string;
  actorId: string;
  x: number;
  y: number;
  hidden?: boolean;
  elevation?: number;
  rotation?: number;
  scale?: number;
  /** Link the token to its actor (shared HP/effects) or make it an independent copy. */
  actorLink?: boolean;
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

export interface UpdateTokenParams extends UpdateTokenAppearanceParams {
  sceneId?: string;
  tokenId: string;
  hidden?: boolean;
  elevation?: number;
  rotation?: number;
  scale?: number;
  name?: string;
  /** A number (0, 10, 20, 30, 40, 50) or, additionally, one of the `TokenDisplayMode` names. */
  displayName?: number | TokenDisplayMode;
  /** A number (-2 secret, -1 hostile, 0 neutral, 1 friendly) or, additionally, one of the names. */
  disposition?: number | TokenDisposition;
  lockRotation?: boolean;
  actorLink?: boolean;
}

export interface GetSceneTokensParams {
  sceneId?: string;
}

export type TokenDisposition = 'hostile' | 'neutral' | 'friendly' | 'secret';

export interface TokenDetail extends TokenAppearanceExtras {
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
  actorLink: boolean;
  textureSrc: string;
  hp: { current: number; max: number } | null;
  ac: number | null;
}

export interface GetTokenParams extends TokenAppearanceRequest {
  sceneId?: string;
  tokenId: string;
}

export type GetTokenResult = TokenDetail;

export interface GetTokenByActorParams extends TokenAppearanceRequest {
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
  /** Advantage mode the system applied to a d20 roll (dnd5e), when reported. */
  mode?: 'advantage' | 'normal' | 'disadvantage';
  /** The d20 result that was kept after advantage/disadvantage. */
  kept?: number;
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
  /** Foundry 13+: the combatant group it is in, null when none. Omitted on older cores. */
  groupId?: string | null;
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

export interface TokenResult extends TokenAppearanceExtras {
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
  /** Whether the token shares its actor's data (linked) or is an independent copy. */
  actorLink: boolean;
  hp?: TokenHpData;
  ac?: number;
  conditions: string[];
  pathCost?: number | undefined;
  doorsOpened?: string[] | undefined;
  /** `unlinked_character_token`: a player character placed as an unlinked copy. */
  warning?: string;
}

export interface SceneTokensResult {
  sceneId: string;
  sceneName: string;
  tokens: TokenResult[];
}

// Item Commands

/**
 * How the actor-item commands address the owner: `actorId` for a world actor,
 * or `tokenId` (+ `sceneId`) for one token's own actor — an unlinked token keeps
 * its items to itself. A token id wins over an actor id.
 */
export interface ActorItemOwnerAddress {
  /** World actor id; required unless `tokenId` is given. */
  actorId?: string;
  tokenId?: string | null;
  /** The token's scene; the active scene when omitted. */
  sceneId?: string | null;
}

export interface GetActorItemsParams extends ActorItemOwnerAddress {
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
  /** Set when a self-targeted heal went through the activation pipeline. */
  status?: ActivationStatus;
  dialog?: UserDialogKind;
  /** `no_roll_performed`: the card was posted but the system never rolled. */
  warning?: string;
  appliedHealing?: AppliedHitPointsResult;
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

export interface AddItemToActorParams extends ActorItemOwnerAddress {
  name: string;
  type: string;
  img?: string;
  system?: ItemSystemData;
  /** The item's sort position among the actor's items; an integer. */
  sort?: number;
}

export interface AddItemFromCompendiumParams {
  actorId: string;
  packId: string;
  itemId: string;
  name?: string;
  quantity?: number;
}

export interface UpdateActorItemParams extends ActorItemOwnerAddress {
  itemId: string;
  name?: string;
  img?: string;
  system?: Partial<ItemSystemData>;
  /** An integer. */
  sort?: number;
}

export interface DeleteActorItemParams extends ActorItemOwnerAddress {
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
  /** The item's sort position in its folder of the Items directory; an integer. */
  sort?: number;
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
  /** An integer. */
  sort?: number;
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
  /** World actor id. Either this or `tokenId` is required. */
  actorId?: string;
  /** A token's actor instead (unlinked tokens keep their own effects). */
  tokenId?: string;
  /** Scene the token is on; defaults to the active scene. */
  sceneId?: string;
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
  /** World actor id. Either this or `tokenId` is required. */
  actorId?: string;
  /** A token's actor instead (unlinked tokens keep their own effects). */
  tokenId?: string;
  /** Scene the token is on; defaults to the active scene. */
  sceneId?: string;
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
  /** World actor id. Either this or `tokenId` is required. */
  actorId?: string;
  /** A token's actor instead (unlinked tokens keep their own effects). */
  tokenId?: string;
  /** Scene the token is on; defaults to the active scene. */
  sceneId?: string;
  name: string;
  img?: string;
  disabled?: boolean;
  statuses?: string[];
  changes?: EffectChangeData[];
  /** Foundry 14 keeps one unit: of several, the first non-zero of `seconds`, `turns`, `rounds` (in that order). */
  duration?: EffectDurationData;
  origin?: string;
  /** The effect subtype; checked against the world's registered types (Foundry 12+). Default `base`. */
  type?: string;
  /** Type data of the subtype, opaque to the bridge (Foundry 12+). */
  system?: Record<string, unknown>;
  /** HTML. */
  description?: string;
  /** An integer. */
  sort?: number;
  /** Foundry 14+ only. */
  showIcon?: ActiveEffectIconVisibility;
}

export interface AddEffectResult {
  actorId: string;
  effectId: string;
  name: string;
}

export interface RemoveActorEffectParams {
  /** World actor id. Either this or `tokenId` is required. */
  actorId?: string;
  /** A token's actor instead (unlinked tokens keep their own effects). */
  tokenId?: string;
  /** Scene the token is on; defaults to the active scene. */
  sceneId?: string;
  effectId: string;
}

export interface RemoveEffectResult {
  actorId: string;
  effectId: string;
  removed: boolean;
}

export interface UpdateActorEffectParams {
  /** World actor id. Either this or `tokenId` is required. */
  actorId?: string;
  /** A token's actor instead (unlinked tokens keep their own effects). */
  tokenId?: string;
  /** Scene the token is on; defaults to the active scene. */
  sceneId?: string;
  effectId: string;
  name?: string;
  img?: string;
  disabled?: boolean;
  changes?: EffectChangeData[];
  /** Foundry 14 keeps one unit: of several, the first non-zero of `seconds`, `turns`, `rounds` (in that order). */
  duration?: EffectDurationData;
  /** Type data, merged into the stored one (Foundry 12+). */
  system?: Record<string, unknown>;
  /** HTML; an empty string clears it. */
  description?: string;
  /** An integer. */
  sort?: number;
  /** Foundry 14+ only. */
  showIcon?: ActiveEffectIconVisibility;
  /** `#rrggbb` (`#rgb` is expanded). */
  tint?: string;
  /** A document UUID; null clears it. Foundry 14 refuses anything else. */
  origin?: string | null;
  /** Replaces the whole set. */
  statuses?: string[];
}

export interface UpdateEffectResult {
  actorId: string;
  effectId: string;
  name: string;
}

// Activate Item Command (full automation pipeline)
export interface ActivateItemConsume {
  spellSlot?: boolean;
  itemUses?: boolean;
  ammunition?: boolean;
}

export interface ActivateItemParams {
  actorId: string;
  itemId: string;
  activityId?: string;
  activityType?: string;
  targetTokenIds?: string[];
  templatePosition?: { x: number; y: number; direction?: number };
  spellLevel?: number;
  /** Act as this token of the actor (one of several copies); its actor for an unlinked token. */
  attackerTokenId?: string;
  /** dnd5e attack mode: `oneHanded`, `twoHanded`, `offhand`, `thrown`, `thrown-offhand`. */
  attackMode?: string;
  /** Ammunition item id, or `false` to attack without consuming any. */
  ammunition?: string | false;
  consume?: ActivateItemConsume;
  /** Skip every configuration dialog and auto-roll. Default true. */
  fastForward?: boolean;
  advantage?: boolean;
  disadvantage?: boolean;
  /** One-off bonus to this attack roll (`2`, `"1d4"`). */
  attackBonus?: number | string;
  /** One-off bonus to the first damage part (`"1d6"` for Sneak Attack). */
  damageBonus?: string;
  /** Added to every target's AC for this hit check (Midi-QOL only). */
  targetAcBonus?: number;
}

export type ActivationStatus = 'completed' | 'awaiting_user_dialog' | 'workflow_timeout' | 'workflow_aborted';
export type UserDialogKind = 'attack-roll' | 'consume' | 'damage' | 'other';

export interface HitPointsDeltaResult {
  applied: boolean;
  hpBefore: number;
  hpAfter: number;
  tempBefore?: number;
  tempAfter?: number;
}

/** Keyed by token id (actor id when the target has no token). */
export type AppliedHitPointsResult = Record<string, HitPointsDeltaResult>;

export interface MidiWorkflowResult {
  attackTotal: number | undefined;
  damageTotal: number | undefined;
  isCritical: boolean;
  isFumble: boolean;
  hitTargetIds: string[];
  saveTargetIds: string[];
  failedSaveTargetIds: string[];
  appliedDamage?: AppliedHitPointsResult;
  appliedHealing?: AppliedHitPointsResult;
}

export interface ActivateItemResult {
  itemId: string;
  itemName: string;
  itemType: string;
  activityUsed?: ActivityInfo;
  activated: boolean;
  /** `completed`, `awaiting_user_dialog` (a dialog on the GM's client holds the use), `workflow_timeout`, `workflow_aborted`. */
  status: ActivationStatus;
  /** The dialog that opened, when `status` is `awaiting_user_dialog`. */
  dialog?: UserDialogKind;
  targetsSet: number;
  rolls: RollResult[];
  chatMessageId?: string;
  workflow?: MidiWorkflowResult;
  /** HP changes the workflow (Midi-QOL) or the module (vanilla healing) applied, per token. */
  appliedDamage?: AppliedHitPointsResult;
  appliedHealing?: AppliedHitPointsResult;
  /** `no_roll_performed`, `midi_workflow_timeout`, `midi_workflow_aborted`. */
  warning?: string;
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
  settings: SceneSettingsResult;
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
  /** Foundry 12+. */
  style?: SceneGridStyle;
  /** `#rrggbb`. */
  color?: string;
  /** 0–1. */
  alpha?: number;
  /** Whole pixels, at least 1. Foundry 12+. */
  thickness?: number;
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

export interface CreateSceneParams extends SceneSettingsParams {
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

export type CreateSceneResult = ConfiguredSceneSummary;

export interface UpdateSceneParams extends SceneSettingsParams {
  sceneId: string;
  /** Milliseconds (1–600000) over which clients viewing the scene fade to the new `darkness`; needs `darkness`. */
  animateDarkness?: number;
  /** A level of the scene to open on; null = the first level. Foundry 14+; refused on older cores. */
  initialLevelId?: string | null;
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

export type UpdateSceneResult = ConfiguredSceneSummary;

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
  /** Draw this level of the scene. Foundry 14+; refused on older cores. */
  levelId?: string;
}

export interface ViewSceneResult {
  viewed: true;
  sceneId: string;
  /** Present when a level was asked for. */
  levelId?: string;
}

// World Info (pull query)
export type GetWorldInfoParams = Record<string, never>;

export interface WorldInfoData {
  id: string;
  title: string;
  system: string;
  systemVersion: string;
  foundryVersion: string;
  /** The module's own manifest version (since 8.17.0). */
  moduleVersion: string;
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
  /** Active modules only. */
  modules: WorldModuleSummary[];
  activeScene: WorldActiveScene | null;
  users: WorldUserSummary[];
  /** Null while the game is still loading. */
  paused: boolean | null;
  /** Seconds; null while the game is still loading. */
  worldTime: number | null;
}

// Pull query params (Batch 2)
export interface GetJournalsParams {
  /**
   * Index only: pages carry id/name/type/src but no text, markdown or
   * enriched HTML, and TextEditor.enrichHTML is skipped entirely — the part
   * that makes a full get-journals take tens of seconds on large worlds.
   * Used by the gateway for journal lists and search (module 8.12+).
   */
  light?: boolean;
}

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
  // Optional server-side selection: only documents of these subtypes / with
  // these ids are loaded (Foundry `type__in` / `_id__in` queries on v13+,
  // client-side filtering on older cores). Omitted → full pack as before.
  types?: string[];
  ids?: string[];
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

// Journal page search — substring search over page names and page text
// content across JournalEntry compendium packs (rules text and spell lists
// live in pages, which pack-index name search cannot see).
export interface SearchCompendiumPagesParams {
  query: string;
  packIds?: string[];
  pageTypes?: string[];
  searchContent?: boolean;
  limit?: number;
}

export interface CompendiumPageMatch {
  packId: string;
  packLabel: string;
  journalId: string;
  journalName: string;
  pageId: string;
  pageName: string;
  pageType: string;
  uuid: string;
  matchedIn: 'name' | 'content';
  snippet: string | null;
}

export type SearchCompendiumPagesResult = CompendiumPageMatch[];

// UUID resolution — resolves any absolute Foundry UUID (world, compendium,
// or embedded document) to the full document data.
export interface ResolveUuidParams {
  uuid: string;
}

export interface ResolveUuidResult {
  uuid: string;
  documentName: string;
  id: string;
  name: string | null;
  type: string | null;
  img: string | null;
  pack: string | null;
  parentUuid: string | null;
  data: Record<string, unknown>;
}

// Roll Table types
export type ListRollTablesParams = Record<string, never>;

export interface GetRollTableParams {
  tableId: string;
}

export interface RollOnTableParams {
  tableId: string;
  displayChat?: boolean;
  /** How many rows to draw, 1–100; default 1. Several draws stop early when the table runs out. */
  count?: number;
  /** Who sees the chat card; the GM's own roll mode when omitted. Matters only with `displayChat`. */
  visibility?: ChatVisibility;
  /** Draw from the inner tables a result points to; default true. */
  recursive?: boolean;
  /** A formula rolled instead of the table's own (`1d20+5`): at most 200 characters and 100 dice, no `@` references. */
  formula?: string;
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
  /** A RollTable folder; null moves the table to the root. (A `folder` key is ignored here, as it always was.) */
  folderId?: string | null;
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
  /** null at the root. */
  folderId: string | null;
}

export interface RollOnTableResult {
  tableId: string;
  tableName: string;
  /** The core's roll; for several draws a pool of them whose total is their sum. */
  roll: {
    formula: string;
    total: number;
  };
  results: TableResultData[];
  /** Every roll made, one per draw, in order. */
  rolls: TableRollSummary[];
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

export interface WallSummary extends WallDetails {
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

export interface CreateWallParams extends WallDetailChanges {
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

export interface UpdateWallParams extends WallDetailChanges {
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

export interface NoteSummary extends NoteDetails {
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

export interface CreateNoteParams extends NoteDetailChanges {
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

export interface UpdateNoteParams extends NoteDetailChanges {
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
  /**
   * Since 8.18.0. Any JSON object. A script macro reads it as the variable `args`
   * (also `scope.args`); a chat macro ignores it.
   */
  args?: Record<string, unknown>;
}

export interface ExecuteMacroResult {
  executed: true;
  macroId: string;
  macroName: string;
  macroType: MacroType;
  /**
   * Since 8.18.0. The macro's return value made JSON-safe (Documents reduced to
   * { documentName, id, uuid, name }, cycles as "[Circular]"). Absent when the
   * macro returned undefined or when the value was truncated.
   */
  result?: unknown;
  /** Since 8.18.0. Present only when the serialized result exceeded 256 KB; `result` is then absent. */
  resultTruncated?: true;
  /** Since 8.18.0. UTF-8 size of the serialized result; present only with resultTruncated. */
  resultBytes?: number;
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
  /** Foundry 13+: the world time on the world calendar. */
  date?: CalendarDate;
}

/** Exactly one of `seconds` and `duration` (Foundry 13+). */
export interface AdvanceTimeParams {
  seconds?: number;
  duration?: CalendarDuration;
}

export interface AdvanceTimeResult {
  worldTime: number;
  advancedBy: number;
  /** Foundry 13+. */
  date?: CalendarDate;
}

/** Exactly one of `worldTime` and `date` (Foundry 13+). */
export interface SetWorldTimeParams {
  worldTime?: number;
  date?: CalendarDateInput;
}

export interface SetWorldTimeResult {
  worldTime: number;
  /** Foundry 13+. */
  date?: CalendarDate;
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

/** Shown as given, cleaned of HTML; never read as a localization key. */
export interface NotifyParams {
  message: string;
  type?: NotifyType;
  permanent?: boolean;
  /** Also log to the browser console (core default: true). */
  console?: boolean;
}

export interface NotifyResult {
  shown: true;
  type: NotifyType;
  /** Foundry 13+: the id `remove-notification` takes. */
  notificationId?: number;
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
  /** False when the core refused the ping, as it does for a point outside the canvas. */
  pinged: boolean;
  x: number;
  y: number;
}

// Scene settings (additive params of create-scene / update-scene, `settings` of their results and of get-scene)

/** The core's grid line styles (`CONFIG.Canvas.gridStyles`). Foundry 12+. */
export type SceneGridStyle =
  | 'solidLines'
  | 'dashedLines'
  | 'dottedLines'
  | 'squarePoints'
  | 'diamondPoints'
  | 'roundPoints';

/** How fog of war remembers explored areas: not at all, per user, or shared by every player (Foundry 14+). */
export type SceneFogExplorationMode = 'disabled' | 'individual' | 'shared';

/** Darkness levels (0 = daylight, 1 = full darkness) between which the global light is on; min ≤ max. */
export interface SceneDarknessRange {
  min: number;
  max: number;
}

export interface SceneGlobalLightResult {
  /** The whole scene is lit while the darkness level is inside `darkness`. */
  enabled: boolean;
  /** Bright rather than dim light. */
  bright: boolean;
  /** `#rrggbb`; null = untinted. */
  color: string | null;
  /** Tint intensity, 0–1. */
  alpha: number;
  /** 0–1. */
  luminosity: number;
  /** -1–1. */
  saturation: number;
  /** -1–1. */
  contrast: number;
  /** 0–1. */
  shadows: number;
  /** `max` is what older cores called the global light threshold. */
  darkness: SceneDarknessRange;
}

/** Color grading of the scene in daylight (`baseAmbience`) or in full darkness (`darkAmbience`). */
export interface SceneAmbienceResult {
  /** Position on the color wheel as a fraction, 0 ≤ hue < 1. */
  hue: number;
  /** 0–1; 0 applies no hue. */
  intensity: number;
  /** -1–1. */
  luminosity: number;
  /** -1–1. */
  saturation: number;
  /** 0–1. */
  shadows: number;
}

export interface SceneEnvironmentResult {
  /** 0 (daylight) – 1 (full darkness). */
  darkness: number;
  /**
   * While locked the core silently drops a darkness change, unless the same
   * update also sets `darknessLock` (Foundry 13: sets it to false).
   */
  darknessLock: boolean;
  /** Blend the base ambience into the dark ambience as darkness rises (the day / night cycle). */
  blendAmbience: boolean;
  globalLight: SceneGlobalLightResult;
  baseAmbience: SceneAmbienceResult;
  darkAmbience: SceneAmbienceResult;
}

export interface SceneFogResult {
  exploration: SceneFogExplorationMode;
  /** Image drawn over unexplored areas; on Foundry 14 the first level's. null = none. */
  overlay: string | null;
  /** `#rrggbb`; null = the core default. */
  exploredColor: string | null;
  unexploredColor: string | null;
}

/** Where the camera starts when the scene is drawn; null = the core's choice (centred, fitted). */
export interface SceneInitialViewResult {
  /** Pixels. */
  x: number | null;
  y: number | null;
  /** Zoom factor. */
  scale: number | null;
}

export interface SceneGridAppearanceResult {
  /** A `SceneGridStyle`, or a style a module registered. */
  style: string;
  /** `#rrggbb`. */
  color: string;
  /** 0–1. */
  alpha: number;
  /** Line thickness in pixels. */
  thickness: number;
}

export interface SceneSettingsResult {
  /** A weather effect id (see `get-weather-effects`); null = no weather. */
  weather: string | null;
  /** Players see only what their tokens see. */
  tokenVision: boolean;
  environment: SceneEnvironmentResult;
  fog: SceneFogResult;
  initialView: SceneInitialViewResult;
  /** Played while the scene is active; `playlistSoundId` names one of its sounds, null = the whole playlist. */
  playlistId: string | null;
  playlistSoundId: string | null;
  /** Opened from the scene's "notes" entry. */
  journalId: string | null;
  journalPageId: string | null;
  grid: SceneGridAppearanceResult;
  /** Foreground image; on Foundry 14 the first level's. */
  foreground: string | null;
  /** Distance units at which the foreground is drawn; on Foundry 14 the first level's top, null = unbounded. */
  foregroundElevation: number | null;
  /** `#rrggbb` shown where the background image leaves the scene uncovered; on Foundry 14 the first level's. */
  backgroundColor: string;
  /** The level the scene opens on. Foundry 14+; omitted on older cores. */
  initialLevelId?: string | null;
}

/** Only the given keys change. Out-of-range values are rejected, not clamped. */
export interface SceneGlobalLightParams {
  enabled?: boolean;
  bright?: boolean;
  /** `#rrggbb`; null removes the tint. Foundry 12+, like every key but `enabled` and `darkness.max`. */
  color?: string | null;
  alpha?: number;
  luminosity?: number;
  saturation?: number;
  contrast?: number;
  shadows?: number;
  /** The resulting range must keep min ≤ max. */
  darkness?: Partial<SceneDarknessRange>;
}

/** Foundry 12+. Ranges as in `SceneAmbienceResult`. */
export type SceneAmbienceParams = Partial<SceneAmbienceResult>;

export interface SceneInitialViewParams {
  /** Whole pixels; null resets. */
  x?: number | null;
  y?: number | null;
  /** At least 0.001; null resets. */
  scale?: number | null;
}

/**
 * The scene settings `create-scene` and `update-scene` accept besides their
 * original ones. Absent keys are left alone; `null` clears where documented.
 */
export interface SceneSettingsParams {
  /** A weather effect id from `get-weather-effects`; null removes the weather. */
  weather?: string | null;
  tokenVision?: boolean;
  /** Image drawn over unexplored areas; null removes it. On Foundry 14 it goes to the first level. */
  fogOverlay?: string | null;
  /** `#rrggbb`; null restores the core default. */
  fogExploredColor?: string | null;
  fogUnexploredColor?: string | null;
  /** Foundry 12+. */
  darknessLock?: boolean;
  /** Foundry 12+. */
  blendAmbience?: boolean;
  globalLight?: SceneGlobalLightParams;
  baseAmbience?: SceneAmbienceParams;
  darkAmbience?: SceneAmbienceParams;
  /** null resets all three. */
  initialView?: SceneInitialViewParams | null;
  /** Must exist; null unlinks. Changing the playlist drops a sound that is not part of the new one. */
  playlistId?: string | null;
  /** A sound of the scene's (new) playlist; null = play the whole playlist. */
  playlistSoundId?: string | null;
  /** Must exist; null unlinks. Changing the entry drops a page that is not part of the new one. */
  journalId?: string | null;
  /** A page of the scene's (new) journal entry; null unlinks the page. */
  journalPageId?: string | null;
  /**
   * Distance units, a positive whole number. On Foundry 14 the first level's
   * top elevation, which may not go below that level's bottom.
   */
  foregroundElevation?: number;
  /** `#rrggbb`. On Foundry 14 the first level's background color. */
  backgroundColor?: string;
}

export interface ConfiguredSceneSummary extends SceneSummary {
  settings: SceneSettingsResult;
}

// Weather, table controls and fog of war

export type GetWeatherEffectsParams = Record<string, never>;

export interface SceneWeatherEffect {
  /** The value of a scene's `weather`. */
  id: string;
  /** Localized name. */
  label: string;
}

export interface GetWeatherEffectsResult {
  weatherEffects: SceneWeatherEffect[];
}

export interface PullUsersToSceneParams {
  sceneId?: string | null;
  /** Users whose view moves to the scene; omitted = every connected user except this GM. */
  userIds?: string[];
  /** The level they are shown. Foundry 14+; refused on older cores. */
  levelId?: string;
}

export interface PullUsersToSceneResult {
  sceneId: string;
  /** Connected users told to view the scene. */
  pulledUserIds: string[];
  /** Listed users who are not connected; nothing is sent to them. */
  offlineUserIds: string[];
  /** Present when a level was asked for. */
  levelId?: string;
}

export interface PreloadSceneParams {
  sceneId?: string | null;
  /** Load this level's textures instead of the initial level's. Foundry 14+; refused on older cores. */
  levelId?: string;
}

/** Every connected client starts loading the scene's images and first sound; nothing reports when they finish. */
export interface PreloadSceneResult {
  sceneId: string;
  preloading: true;
  /** Present when a level was asked for. */
  levelId?: string;
}

export interface RegenerateSceneThumbnailParams {
  sceneId?: string | null;
}

export interface RegenerateSceneThumbnailResult {
  sceneId: string;
  /** The stored thumbnail path; the core appends a cache-busting query. */
  thumb: string | null;
}

export interface ResetFogParams {
  sceneId?: string | null;
}

/** The server deletes every user's explored areas of the scene; clients viewing it redraw their fog. */
export interface ResetFogResult {
  sceneId: string;
  reset: true;
}

// Scene levels (Foundry 14+; refused on older cores)

export type SceneLevelFitMode = 'fill' | 'contain' | 'cover' | 'width' | 'height';

/** Distance units; null = unbounded (bottom −∞, top +∞). bottom ≤ top. */
export interface SceneLevelElevation {
  bottom: number | null;
  top: number | null;
}

export interface SceneLevelBackground {
  src: string | null;
  /** `#rrggbb` where the image leaves the level uncovered. */
  color: string;
  /** `#rrggbb`. */
  tint: string;
  /** 0–1: pixels less opaque than this do not block light or weather. */
  alphaThreshold: number;
}

export interface SceneLevelForeground {
  src: string | null;
  tint: string;
  alphaThreshold: number;
}

/** How the level's images sit on the scene. */
export interface SceneLevelPositioning {
  /** 0–1 within the image. */
  anchorX: number;
  anchorY: number;
  /** Whole pixels. */
  offsetX: number;
  offsetY: number;
  fit: SceneLevelFitMode;
  scaleX: number;
  scaleY: number;
  /** Degrees, 0 ≤ rotation < 360. */
  rotation: number;
}

export interface SceneLevelSummary {
  id: string;
  name: string;
  elevation: SceneLevelElevation;
  background: SceneLevelBackground;
  foreground: SceneLevelForeground;
  /** Image drawn over unexplored areas of this level; null = none. */
  fogOverlay: string | null;
  positioning: SceneLevelPositioning;
  /** Other levels seen (fully or partly) from this one. */
  visibleLevelIds: string[];
  /** Integer; levels are listed and stacked by it. */
  sort: number;
  /** The level the scene opens on. */
  initial: boolean;
}

export interface SceneLevelResult extends SceneLevelSummary {
  sceneId: string;
}

export interface GetSceneLevelsParams {
  sceneId?: string | null;
}

export interface GetSceneLevelsResult {
  sceneId: string;
  initialLevelId: string | null;
  levels: SceneLevelSummary[];
}

/** Only the given keys change; ranges as in the summary types. Out-of-range values are rejected. */
export interface SceneLevelAttributes {
  /** Default bottom 0 and top four grid cells' distance; the resulting range must keep bottom ≤ top. */
  elevation?: Partial<SceneLevelElevation>;
  /** `src: null` removes the image. */
  background?: Partial<SceneLevelBackground>;
  foreground?: Partial<SceneLevelForeground>;
  /** null removes the image. */
  fogOverlay?: string | null;
  positioning?: Partial<SceneLevelPositioning>;
  /** Replaces the whole set; every id must be another level of the scene. */
  visibleLevelIds?: string[];
  sort?: number;
}

export interface CreateSceneLevelParams extends SceneLevelAttributes {
  sceneId?: string | null;
  name: string;
}

export interface UpdateSceneLevelParams extends SceneLevelAttributes {
  sceneId?: string | null;
  levelId: string;
  name?: string;
}

/**
 * The only level of a scene cannot be deleted. The core also deletes what is
 * placed on that level alone (tokens, tiles, walls, …) and its fog exploration.
 */
export interface DeleteSceneLevelParams {
  sceneId?: string | null;
  levelId: string;
}

export interface DeleteSceneLevelResult {
  deleted: true;
  levelId: string;
  sceneId: string;
}

// Combat encounters, rounds, combatant groups, tracker configuration

/** Names the encounter a command is about; omitted, null or empty, the active combat (the one the GM's combat tracker shows). */
export interface CombatAddressParams {
  combatId?: string | null;
}

/** An encounter of the world, as `get-combats` lists it. */
export interface CombatEncounterSummary {
  id: string;
  /** Foundry 14+: the encounter's own name, null when it has none. Omitted on older cores. */
  name?: string | null;
  /** The scene the encounter is linked to; null when it is shown on every scene. */
  sceneId: string | null;
  /** The encounter's `active` flag. The server keeps at most one encounter of the world active. */
  active: boolean;
  /** Whether combat commands that name no `combatId` act on this encounter. */
  isDefault: boolean;
  started: boolean;
  round: number;
  /** Position of the current combatant in the turn order; null while it is no one's turn. */
  turn: number | null;
  combatantCount: number;
}

export type GetCombatsParams = Record<string, never>;

export interface GetCombatsResult {
  combats: CombatEncounterSummary[];
}

/**
 * Links an unlinked encounter to a scene, or unlinks a linked one so it is
 * shown on every scene. Linking is refused while a combatant is placed on
 * another scene.
 */
export interface ToggleCombatSceneLinkParams {
  combatId?: string | null;
  /** The scene to link an unlinked encounter to; the active scene when omitted. Not used when unlinking. */
  sceneId?: string | null;
}

/** Foundry 13+. A group of combatants of one encounter. */
export interface CombatantGroupSummary {
  id: string;
  name: string | null;
  img: string | null;
  /**
   * Null until set. While it is a number, every member reads this initiative
   * instead of its own, so the members take their turns together; rolling or
   * setting a member's initiative then changes only its own hidden value,
   * which shows again once the group's is cleared or the member leaves.
   * `roll-all-initiative` skips such members, and `reset-initiative` keeps the
   * group's initiative.
   */
  initiative: number | null;
  /** Derived by the core, not settable: every member is defeated (flag or defeated status), or the group has none. */
  defeated: boolean;
  /** Derived by the core, not settable: every member is hidden, or the group has none. */
  hidden: boolean;
  /** The combatants in the group; assign one with `groupId` on `add-combatant` / `update-combatant`. */
  memberIds: string[];
}

export interface CombatantGroupResult extends CombatantGroupSummary {
  combatId: string;
}

export interface GetCombatantGroupsResult {
  combatId: string;
  groups: CombatantGroupSummary[];
}

export interface CreateCombatantGroupParams {
  combatId?: string | null;
  name?: string;
  /** An image file path or URL. */
  img?: string;
  initiative?: number;
}

/** Partial: an omitted field is kept, `null` clears it. Members stay as they are. */
export interface UpdateCombatantGroupParams {
  combatId?: string | null;
  groupId: string;
  name?: string | null;
  img?: string | null;
  initiative?: number | null;
}

/** The members stay in the encounter, ungrouped. */
export interface DeleteCombatantGroupParams {
  combatId?: string | null;
  groupId: string;
}

export interface DeleteCombatantGroupResult {
  deleted: true;
  groupId: string;
  combatId: string;
}

/** Foundry 13+. How tokens show whose turn it is. */
export interface CombatTurnMarkerConfig {
  /** Tokens show a turn marker by default. */
  enabled: boolean;
  /** Id of the marker animation, one of `turnMarkerAnimations`. */
  animation: string;
  /** Image or video of the marker; null uses the core's default marker. */
  src: string | null;
  /** The marker is tinted by the token's disposition. */
  disposition: boolean;
}

/** The world's combat tracker configuration (core setting `combatTrackerConfig`). */
export interface CombatTrackerConfigResult {
  /** Path of the attribute the tracker shows for each combatant, inside the actor's system data (e.g. `attributes.hp.value`); null when none. */
  resource: string | null;
  /** Turns pass over defeated combatants. */
  skipDefeated: boolean;
  /** Foundry 13+; omitted on older cores. */
  turnMarker?: CombatTurnMarkerConfig;
  /** Foundry 13+: the turn marker animations this world knows (core: `spin`, `spinPulse`, `pulse`). Omitted on older cores. */
  turnMarkerAnimations?: string[];
}

export type GetCombatTrackerConfigParams = Record<string, never>;

/** Partial: an omitted field is kept. */
export interface UpdateCombatTrackerConfigParams {
  /** A dotted attribute path; `null` tracks no resource. */
  resource?: string | null;
  skipDefeated?: boolean;
  /** Foundry 13+, refused on older cores. `src: null` restores the core's default marker. */
  turnMarker?: Partial<CombatTurnMarkerConfig>;
}

/**
 * Who sees a chat message, applied the way the core applies its roll modes
 * (message modes since Foundry 14): `public` everyone; `gm` the GMs, or the
 * whisper recipients when there are any; `blind` like `gm`, and its author
 * does not see the content; `self` only the author (the GM running the module).
 */
export type ChatVisibility = 'public' | 'gm' | 'blind' | 'self';

/** Values for the `@path` references of a roll formula. */
export type RollDataValues = Record<string, unknown>;

export interface ValidateRollFormulaParams {
  formula: string;
  /** Whose roll data the `@path` references are checked against; a token id wins over an actor id. */
  actorId?: string;
  tokenId?: string;
  /** The token's scene; the active scene when omitted. */
  sceneId?: string;
  /** Layered over the actor's roll data: a top-level key replaces the actor's key of the same name. */
  data?: RollDataValues;
}

export interface ValidateRollFormulaResult {
  /** The formula as checked, trimmed. */
  formula: string;
  /** Foundry can parse and evaluate it (with the roll data substituted, when given) within the module's limits: 200 characters, 1000 dice. */
  valid: boolean;
  /** Why it is not valid; null when it is. */
  reason: string | null;
  /**
   * `@path` references the roll data does not set — all of them when no roll
   * data is given. `roll-dice` with roll data rejects such a formula; without
   * roll data the core rolls them as 0.
   */
  unresolvedReferences: string[];
}

export interface SimulateRollParams {
  formula: string;
  /** How many times to roll: 1–1000, default 100. At most 100000 dice in all. */
  iterations?: number;
  /** Whose roll data feeds the `@path` references; a token id wins over an actor id. A reference nothing sets is an error. */
  actorId?: string;
  tokenId?: string;
  /** The token's scene; the active scene when omitted. */
  sceneId?: string;
  /** Layered over the actor's roll data: a top-level key replaces the actor's key of the same name. */
  data?: RollDataValues;
}

export interface SimulateRollResult {
  /** The formula as given, trimmed. */
  formula: string;
  iterations: number;
  /** The total of every roll, in the order rolled. Nothing is posted to the chat. */
  totals: number[];
  min: number;
  max: number;
  /** Rounded to two decimals. */
  mean: number;
}

// Journal pages: how a page is shown and filed (additive on create-journal-page,
// update-journal-page and the pages of get-journal), journal categories (Foundry 13+),
// sharing an image, panning to a journal's map note, full-text search of world journals.
export type JournalPageFormat = 'html' | 'markdown';

export interface JournalPageTitle {
  show: boolean;
  /** Heading level of the page title, 1–6. */
  level: number;
}

export interface JournalPageVideo {
  controls: boolean;
  loop: boolean;
  autoplay: boolean;
  /** 0–1. */
  volume: number;
  /** Where playback starts, in seconds; null = the beginning. */
  timestamp: number | null;
  /** Pixels; null = the video's own size. */
  width: number | null;
  height: number | null;
}

export interface JournalPageTitleParams {
  show?: boolean;
  /** 1–6. */
  level?: number;
}

/** Partial: an absent field is kept. `null` resets `timestamp`, `width`, `height`. */
export interface JournalPageVideoParams {
  controls?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  /** 0–1. */
  volume?: number;
  /** Seconds, ≥ 0. */
  timestamp?: number | null;
  /** Pixels, a positive integer. */
  width?: number | null;
  height?: number | null;
}

/** Additive params of create-journal-page and update-journal-page. */
export interface JournalPageOptionsParams {
  /** Image pages: the caption under the image; `null` removes it. */
  caption?: string | null;
  /**
   * Text pages. Foundry renders a markdown page's HTML from its `markdown`, so
   * 'markdown' needs `markdown` in the same call and neither goes with `content`.
   * 'html' keeps the rendered HTML and drops the markdown source.
   */
  format?: JournalPageFormat;
  /** Text pages: the markdown source. Sending it makes the page a markdown page. */
  markdown?: string;
  title?: JournalPageTitleParams;
  /** Integer order of the page in its journal (Foundry steps by 100000). */
  sort?: number;
  /** Foundry 13+: a category of the same journal; `null` = uncategorized. */
  categoryId?: string | null;
  /** Video pages. */
  video?: JournalPageVideoParams;
}

/**
 * How a page is shown and filed. Foundry keeps all of it on every page of a
 * world, whatever its type; `categoryId` exists on Foundry 13+ only.
 */
export interface JournalPageLayoutFields {
  caption: string | null;
  format: JournalPageFormat;
  title: JournalPageTitle;
  sort: number;
  /** Foundry 13+ only; null when uncategorized or its category was deleted. */
  categoryId?: string | null;
  video: JournalPageVideo;
}

/** create-journal-page / update-journal-page. The layout fields are present for every page of a world. */
export interface JournalPageDetailResult extends JournalPageResult, Partial<JournalPageLayoutFields> {
  src?: string | null;
}

type JournalStoredPageData = JournalData['pages'][number];

export interface JournalPageDetailData extends JournalStoredPageData, Partial<JournalPageLayoutFields> {}

export interface JournalCategorySummary {
  id: string;
  name: string;
  sort: number;
}

/** get-journal: the journal with each page's layout and, on Foundry 13+, its categories. */
export interface JournalDetailData extends JournalData {
  pages: JournalPageDetailData[];
  /** Foundry 13+ only, in their sort order. */
  categories?: JournalCategorySummary[];
}

export interface CreateJournalCategoryParams {
  journalId: string;
  name: string;
  /** Integer; default: after the journal's last category. */
  sort?: number;
}

export interface UpdateJournalCategoryParams {
  journalId: string;
  categoryId: string;
  name?: string;
  sort?: number;
}

export interface DeleteJournalCategoryParams {
  journalId: string;
  categoryId: string;
}

export interface JournalCategoryResult extends JournalCategorySummary {
  journalId: string;
}

/** The pages of a deleted category are listed as uncategorized. */
export interface DeleteJournalCategoryResult {
  deleted: true;
  categoryId: string;
  journalId: string;
}

export interface ShowImageParams {
  /** Image or video file (path in the Foundry data, or a URL). */
  src: string;
  /** Window title of the popout. */
  title?: string;
  caption?: string;
  /** User ids; absent or empty = every connected user. */
  users?: string[];
}

export interface ShowImageResult {
  shown: true;
  src: string;
  title: string | null;
  caption: string | null;
  /** Who it was sent to; empty = every connected user. */
  users: string[];
}

export interface PanToNoteParams {
  journalId: string;
  /** Zoom level after the pan; default 1.5, kept within the canvas zoom limits. */
  scale?: number;
  /** Milliseconds; default 250. */
  duration?: number;
}

/** The GM's canvas panned to the journal's first map note on the viewed scene. */
export interface PanToNoteResult {
  panned: true;
  journalId: string;
  sceneId: string;
  noteId: string;
  x: number;
  y: number;
}

export interface SearchJournalsParams {
  /** Case-insensitive substring. */
  query: string;
  /** Only pages of these types; journal-name matches are then left out. */
  pageTypes?: string[];
  /** Also search page text (HTML stripped); default true. */
  searchContent?: boolean;
  /** 1–200, default 25. */
  limit?: number;
  /** Matches to skip, default 0. */
  offset?: number;
}

/** `journal`: the journal's name; `name`: the page's name; `content`: the page's text. */
export type JournalSearchMatchedIn = 'journal' | 'name' | 'content';

export interface JournalSearchMatch {
  journalId: string;
  journalName: string;
  /** null for a match on the journal's name. */
  pageId: string | null;
  pageName: string | null;
  pageType: string | null;
  /** Of the page, or of the journal for a journal-name match. */
  uuid: string;
  matchedIn: JournalSearchMatchedIn;
  /** Text around a content match. */
  snippet: string | null;
}

export interface SearchJournalsResult {
  matches: JournalSearchMatch[];
  hasMore: boolean;
}

// Ambient light commands

/**
 * Shader technique that blends the light with the scene (`AdaptiveLightingShader.SHADER_TECHNIQUES`).
 * `natural-attenuation` and `adaptive-attenuation` exist on Foundry 14+ only.
 */
export type LightColoration =
  | 'legacy'
  | 'luminance'
  | 'internal-halo'
  | 'external-halo'
  | 'color-burn'
  | 'internal-burn'
  | 'external-burn'
  | 'low-absorption'
  | 'high-absorption'
  | 'invert-absorption'
  | 'natural-light'
  | 'natural-attenuation'
  | 'adaptive-attenuation';

export interface LightAnimation {
  /**
   * A key of `CONFIG.Canvas.lightAnimations` (core: `torch`, `flame`, `pulse`, `revolving`, `siren`, `reactivepulse`,
   * `chroma`, `wave`, `fog`, `sunburst`, `dome`, `emanation`, `hexa`, `ghost`, `energy`, `vortex`, `witchwave`,
   * `rainbowswirl`, `radialrainbow`, `fairy`, `grid`, `starlight`, `smokepatch`) or, for a darkness source
   * (`negative`), of `CONFIG.Canvas.darknessAnimations` (core: `magicalGloom`, `roiling`, `hole`, `denseSmoke`),
   * plus what modules register; checked against the running world. `null` = not animated.
   */
  type: string | null;
  /** Integer 0–10. */
  speed: number;
  /** Integer 1–10. */
  intensity: number;
  reverse: boolean;
}

/** Partial: an omitted key keeps its value; `type: null` stops the animation. */
export interface LightAnimationChanges {
  type?: string | null;
  speed?: number;
  intensity?: number;
  reverse?: boolean;
}

/** Scene darkness levels (0 = daylight, 1 = full darkness) between which the source is active; min ≤ max. */
export interface LightDarknessRange {
  min: number;
  max: number;
}

/** Partial: an omitted bound keeps its value; the resulting range must keep min ≤ max. */
export interface LightDarknessRangeChanges {
  min?: number;
  max?: number;
}

/** What a light source emits — the light configuration shared by every document that carries one. */
export interface LightEmission {
  /** Radius of dim light in distance units, ≥ 0. */
  dim: number;
  /** Radius of bright light in distance units, ≥ 0. */
  bright: number;
  /** Emission angle in degrees, 0–360 (360 = all around). */
  angle: number;
  /** `#rrggbb`; null = uncolored. */
  color: string | null;
  /** Color intensity, 0–1. */
  alpha: number;
  /** null when the document holds a technique code this module does not know. */
  coloration: LightColoration | null;
  /** 0–1. */
  luminosity: number;
  /** How gradually bright fades into dim and dim into darkness, 0–1. */
  attenuation: number;
  /** −1–1. */
  saturation: number;
  /** −1–1. */
  contrast: number;
  /** 0–1. */
  shadows: number;
  animation: LightAnimation;
  darkness: LightDarknessRange;
  /** A darkness source: it removes light instead of emitting it. Foundry 12+; omitted on older cores. */
  negative?: boolean;
  /** Which source wins where several overlap; integer ≥ 0. Foundry 12+; omitted on older cores. */
  priority?: number;
}

export interface LightSummary extends LightEmission {
  id: string;
  /** Pixels; the core rounds to whole pixels. */
  x: number;
  y: number;
  /** Distance units (e.g. feet). Foundry 12+; omitted on older cores. */
  elevation?: number;
  /** Direction of a cone of light (`angle` < 360) in degrees; the core normalizes it into [0, 360). */
  rotation: number;
  /** Walls block the light. */
  walls: boolean;
  /** The light also provides vision of what it illuminates. */
  vision: boolean;
  /** Switched off. */
  hidden: boolean;
  /** null = unnamed. Foundry 14+; omitted on older cores. */
  name?: string | null;
  /** Protected from edits on the canvas. Foundry 14+; omitted on older cores. */
  locked?: boolean;
  /** Ids of the scene levels the light belongs to; empty = every level. Foundry 14+; omitted on older cores. */
  levels?: string[];
}

/**
 * What a caller may set on a light configuration; see `LightEmission` for meanings, units and ranges. Out-of-range
 * values are rejected, not clamped.
 */
export interface LightEmissionChanges {
  dim?: number;
  bright?: number;
  angle?: number;
  /** `#rrggbb` (or `#rgb`); `null` removes the color. */
  color?: string | null;
  alpha?: number;
  coloration?: LightColoration;
  luminosity?: number;
  attenuation?: number;
  saturation?: number;
  contrast?: number;
  shadows?: number;
  animation?: LightAnimationChanges;
  darkness?: LightDarknessRangeChanges;
  /** Foundry 12+; refused on older cores. */
  negative?: boolean;
  /** Foundry 12+; refused on older cores. */
  priority?: number;
}

/** What a caller may set on a light; see `LightSummary` for meanings, units and ranges. */
export interface LightAttributes extends LightEmissionChanges {
  /** Foundry 12+; refused on older cores. */
  elevation?: number;
  rotation?: number;
  walls?: boolean;
  vision?: boolean;
  hidden?: boolean;
  /** `null` or `''` removes the name. Foundry 14+, like `locked` and `levels`; refused on older cores. */
  name?: string | null;
  locked?: boolean;
  /** Replaces the whole set; every id must be a level of the scene; `[]` = every level. */
  levels?: string[];
}

export interface GetLightsParams {
  sceneId?: string | null;
}

export interface GetLightsResult {
  sceneId: string;
  lights: LightSummary[];
}

export interface LightResult extends LightSummary {
  sceneId: string;
}

export interface CreateLightParams extends LightAttributes {
  sceneId?: string | null;
  x: number;
  y: number;
}

export type CreateLightResult = LightResult;

export interface UpdateLightParams extends LightAttributes {
  sceneId?: string | null;
  lightId: string;
  x?: number;
  y?: number;
}

export type UpdateLightResult = LightResult;

export interface DeleteLightParams {
  sceneId?: string | null;
  lightId: string;
}

export interface DeleteLightResult {
  deleted: true;
  lightId: string;
  sceneId: string;
}

// Ambient sound commands

export interface AmbientSoundEffect {
  /**
   * A key of `CONFIG.soundEffects` (core: `lowpass`, `highpass`, `reverb`, plus what modules register; checked
   * against the running world); null = no effect.
   */
  type: string | null;
  /** Integer 1–10. */
  intensity: number;
}

/** Scene darkness levels (0 = daylight, 1 = full darkness) between which the sound is active; min ≤ max. */
export interface AmbientSoundDarknessRange {
  min: number;
  max: number;
}

export interface AmbientSoundSummary {
  id: string;
  /** Pixels; the core rounds to whole pixels. */
  x: number;
  y: number;
  /** Distance units (e.g. feet). Foundry 12+; omitted on older cores. */
  elevation?: number;
  /** Audible radius in distance units, ≥ 0. */
  radius: number;
  /** Audio file path relative to the Foundry data root, or a URL; null = no file. */
  path: string | null;
  /** Loop the file. */
  repeat: boolean;
  /** 0–1. */
  volume: number;
  /** Walls block the sound. When false it passes through them, with `muffledEffect` applied behind a wall. */
  walls: boolean;
  /** The volume fades with the distance from the source. */
  easing: boolean;
  /** Switched off. */
  hidden: boolean;
  darkness: AmbientSoundDarknessRange;
  /** Effect applied to the sound as heard directly. Foundry 12+; omitted on older cores. */
  baseEffect?: AmbientSoundEffect;
  /** Effect applied when the sound is heard through a wall. Foundry 12+; omitted on older cores. */
  muffledEffect?: AmbientSoundEffect;
  /** null = unnamed. Foundry 14+; omitted on older cores. */
  name?: string | null;
  /** Protected from edits on the canvas. Foundry 14+; omitted on older cores. */
  locked?: boolean;
  /** Ids of the scene levels the sound belongs to; empty = every level. Foundry 14+; omitted on older cores. */
  levels?: string[];
}

/** Partial: an omitted key keeps its value; `type: null` removes the effect. */
export interface AmbientSoundEffectChanges {
  type?: string | null;
  intensity?: number;
}

/** Partial: an omitted bound keeps its value; the resulting range must keep min ≤ max. */
export interface AmbientSoundDarknessRangeChanges {
  min?: number;
  max?: number;
}

/**
 * What a caller may set on an ambient sound; see `AmbientSoundSummary` for meanings, units and ranges.
 * Out-of-range values are rejected, not clamped.
 */
export interface AmbientSoundAttributes {
  /** Foundry 12+; refused on older cores. */
  elevation?: number;
  repeat?: boolean;
  volume?: number;
  walls?: boolean;
  easing?: boolean;
  hidden?: boolean;
  darkness?: AmbientSoundDarknessRangeChanges;
  /** Foundry 12+, like `muffledEffect`; refused on older cores. */
  baseEffect?: AmbientSoundEffectChanges;
  muffledEffect?: AmbientSoundEffectChanges;
  /** `null` or `''` removes the name. Foundry 14+, like `locked` and `levels`; refused on older cores. */
  name?: string | null;
  locked?: boolean;
  /** Replaces the whole set; every id must be a level of the scene; `[]` = every level. */
  levels?: string[];
}

export interface GetAmbientSoundsParams {
  sceneId?: string | null;
}

export interface GetAmbientSoundsResult {
  sceneId: string;
  ambientSounds: AmbientSoundSummary[];
}

export interface AmbientSoundResult extends AmbientSoundSummary {
  sceneId: string;
}

export interface CreateAmbientSoundParams extends AmbientSoundAttributes {
  sceneId?: string | null;
  x: number;
  y: number;
  /** Distance units, > 0. */
  radius: number;
  /**
   * One audio file, relative to the Foundry data root or a URL: .aac, .flac, .m4a, .mid, .mp3, .ogg, .opus, .wav or
   * .webm (a `?query` may follow). No wildcards, no base64 data.
   */
  path: string;
}

export type CreateAmbientSoundResult = AmbientSoundResult;

export interface UpdateAmbientSoundParams extends AmbientSoundAttributes {
  sceneId?: string | null;
  ambientSoundId: string;
  x?: number;
  y?: number;
  /** Distance units, > 0. */
  radius?: number;
  /** Same rules as on create; `null` detaches the audio file. */
  path?: string | null;
}

export type UpdateAmbientSoundResult = AmbientSoundResult;

export interface DeleteAmbientSoundParams {
  sceneId?: string | null;
  ambientSoundId: string;
}

export interface DeleteAmbientSoundResult {
  deleted: true;
  ambientSoundId: string;
  sceneId: string;
}

export interface PositionalSoundEffect {
  /** A key of `CONFIG.soundEffects` (core: `lowpass`, `highpass`, `reverb`, plus what modules register). */
  type: string;
  /** Integer 1–10; the core default is 5. */
  intensity?: number;
}

/** What happened in the GM's own browser; the request to the other clients went out in every case. */
export type SoundBroadcastGmState =
  /** Done in the GM's browser too. */
  | 'done'
  /** The GM is out of earshot (possible only with `gmAlways: false`). */
  | 'inaudible'
  /** The browser's audio is locked until the GM's first click or key press; it follows then. */
  | 'deferred'
  /** The GM's browser could not load the file (wrong path, unsupported format); the other clients will fail too. */
  | 'failed';

/**
 * A one-shot sound at a point of the canvas, played by every connected client; it leaves no document behind. Each
 * client plays it on the scene it is viewing and hears it according to its own tokens' positions. Needs a scene open
 * on the GM's canvas.
 */
export interface PlaySoundAtPositionParams {
  /** Same rules as an ambient sound's `path`. */
  src: string;
  /** Origin in pixels. */
  x: number;
  y: number;
  /**
   * Distance units; by default 0 (Foundry 14: the base elevation of each client's viewed level). Foundry 13+;
   * refused on older cores, which hear sounds without elevation.
   */
  elevation?: number;
  /** Audible radius in distance units (e.g. feet), > 0. */
  radius: number;
  /** 0–1; default 1. */
  volume?: number;
  /** The volume fades with the distance from the origin; default true. */
  easing?: boolean;
  /** Walls block the sound; default true. When false it passes through them, with `muffledEffect` behind a wall. */
  walls?: boolean;
  /** GM clients hear it at full volume wherever their tokens are; default true. */
  gmAlways?: boolean;
  /** Foundry 12+, like `muffledEffect`; refused on older cores. */
  baseEffect?: PositionalSoundEffect;
  muffledEffect?: PositionalSoundEffect;
  /** A guard: when given, the command is refused unless this scene is the one open on the GM's canvas. */
  sceneId?: string | null;
}

export interface PlaySoundAtPositionResult {
  broadcast: true;
  src: string;
  /** The scene open on the GM's canvas. */
  sceneId: string;
  x: number;
  y: number;
  radius: number;
  gmPlayback: SoundBroadcastGmState;
}

/** Asks every connected client to load an audio file into its cache, so that it later starts without a delay. */
export interface PreloadSoundParams {
  /** Same rules as an ambient sound's `path`. */
  src: string;
}

export interface PreloadSoundResult {
  broadcast: true;
  src: string;
  gmPreload: Exclude<SoundBroadcastGmState, 'inaudible'>;
}

// Tile commands (Foundry 12+; refused on older cores)

/** How the image fills the tile's rectangle. */
export type TileTextureFit = 'fill' | 'contain' | 'cover' | 'width' | 'height';

/**
 * What makes a tile fade or open up while a token is under it (roofs, canopies). `fade`: the whole tile fades;
 * `radial`: a circle around the token is revealed; `vision`: what the token can see is revealed (a roof seen
 * through a window); `surface`: Foundry 14+ only, the tile is revealed along the occluded surfaces.
 */
export type TileOcclusionMode = 'fade' | 'radial' | 'vision' | 'surface';

export interface TileTexture {
  /** Image or video (webm, mp4, …) path relative to the Foundry data root, or a URL; null = no image. */
  src: string | null;
  /** `#rrggbb` multiplied into the image; `#ffffff` = untinted. */
  tint: string;
  /** Scale of the image inside the tile; a negative value mirrors it. */
  scaleX: number;
  scaleY: number;
  /** Anchor of the image inside the tile (0.5 = centered). */
  anchorX: number;
  anchorY: number;
  fit: TileTextureFit;
  /** 0–1: pixels more transparent than this do not count as the tile (hover, click, occlusion). */
  alphaThreshold: number;
  /** Image offset in whole pixels. Foundry 12–13 only; omitted on Foundry 14+, which removed it. */
  offsetX?: number;
  offsetY?: number;
  /** Image rotation inside the tile in degrees. Foundry 12–13 only; omitted on Foundry 14+. */
  rotation?: number;
}

export interface TileRestrictions {
  /** The tile blocks light sources beneath it from lighting what is above it. */
  light: boolean;
  /** The tile stops weather effects beneath it. Both restrictions together are what Foundry 11 called a roof. */
  weather: boolean;
}

export interface TileOcclusion {
  /** Empty = the tile never fades. Foundry 12–13 hold at most one mode. */
  modes: TileOcclusionMode[];
  /** Opacity of the tile while it is occluded, 0–1. */
  alpha: number;
}

/** Playback of a video texture; ignored for an image. */
export interface TileVideo {
  loop: boolean;
  autoplay: boolean;
  /** 0–1. */
  volume: number;
}

export interface TileSummary {
  id: string;
  /** Foundry 14+; omitted on older cores. */
  name?: string | null;
  /** Top-left corner in whole pixels. */
  x: number;
  y: number;
  /** Whole pixels. */
  width: number;
  height: number;
  /**
   * Distance units. There is no overhead flag since Foundry 12: a tile whose elevation is at or above the scene's
   * foreground elevation (Foundry 14: the top of its level) is an overhead tile drawn above tokens.
   */
  elevation: number;
  /** Integer stacking order among tiles of the same elevation; higher is drawn on top. */
  sort: number;
  /** Degrees clockwise; the core normalizes it into 0–360. */
  rotation: number;
  /** Opacity 0–1. */
  alpha: number;
  /** Seen by the GM only. */
  hidden: boolean;
  /** Protected from edits on the canvas. */
  locked: boolean;
  texture: TileTexture;
  restrictions: TileRestrictions;
  occlusion: TileOcclusion;
  video: TileVideo;
  /** Ids of the scene levels the tile belongs to; empty = every level. Foundry 14+; omitted on older cores. */
  levels?: string[];
}

/** What a caller may set on a tile; see `TileSummary` for meanings, units and ranges. Nested objects are partial. */
export interface TileAttributes {
  elevation?: number;
  sort?: number;
  rotation?: number;
  alpha?: number;
  hidden?: boolean;
  locked?: boolean;
  texture?: {
    /** `null` removes the image. */
    src?: string | null;
    tint?: string;
    scaleX?: number;
    scaleY?: number;
    anchorX?: number;
    anchorY?: number;
    fit?: TileTextureFit;
    alphaThreshold?: number;
    /** Foundry 12–13 only: refused on Foundry 14+. */
    offsetX?: number;
    offsetY?: number;
    rotation?: number;
  };
  restrictions?: Partial<TileRestrictions>;
  occlusion?: {
    /** Replaces the modes; `[]` turns occlusion off. Several modes or `surface` need Foundry 14+. */
    modes?: TileOcclusionMode[];
    alpha?: number;
  };
  video?: Partial<TileVideo>;
  /** Foundry 14+ only. `null` removes the name. */
  name?: string | null;
  /** Foundry 14+ only. Replaces the levels; `[]` = every level. */
  levels?: string[];
}

export interface GetTilesParams {
  sceneId?: string | null;
}

export interface GetTilesResult {
  sceneId: string;
  tiles: TileSummary[];
}

export interface TileResult extends TileSummary {
  sceneId: string;
}

/** Without `sort` the core puts the new tile on top of the others. */
export interface CreateTileParams extends TileAttributes {
  sceneId?: string | null;
  x: number;
  y: number;
  /** Pixels, > 0. */
  width: number;
  height: number;
}

export type CreateTileResult = TileResult;

export interface UpdateTileParams extends TileAttributes {
  sceneId?: string | null;
  tileId: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export type UpdateTileResult = TileResult;

export interface DeleteTileParams {
  sceneId?: string | null;
  tileId: string;
}

export interface DeleteTileResult {
  deleted: true;
  tileId: string;
  sceneId: string;
}

// Drawing commands (Foundry 12+; refused on older cores)

/** A freehand line is a polygon with a `bezierFactor` above 0, which is how the core's freehand tool stores it. */
export type DrawingShapeType = 'rectangle' | 'ellipse' | 'polygon';
/** `pattern` tiles `fill.texture` over the shape. */
export type DrawingFillType = 'none' | 'solid' | 'pattern';

export interface DrawingShape {
  /** null for a shape type the canvas does not draw (a circle written by other tools). */
  type: DrawingShapeType | null;
  /** Bounding box in whole pixels; for a polygon, the extent of its points. */
  width: number;
  height: number;
  /** Polygon vertices relative to (x, y) as a flat list `[x0, y0, x1, y1, …]`; empty for other shapes. */
  points: number[];
}

export interface DrawingFill {
  type: DrawingFillType;
  /** `#rrggbb`. */
  color: string;
  /** 0–1. */
  alpha: number;
  /** Image path relative to the Foundry data root, or a URL, used by a `pattern` fill; null = none. */
  texture: string | null;
}

export interface DrawingStroke {
  /** Line width in whole pixels; 0 = no outline. */
  width: number;
  /** `#rrggbb`. */
  color: string;
  /** 0–1. */
  alpha: number;
}

export interface DrawingText {
  /** The label, centered in the shape and wrapped at its width; null = no text. */
  content: string | null;
  /** null = the core's default font. */
  fontFamily: string | null;
  /** Integer 8–256. */
  fontSize: number;
  /** `#rrggbb`. */
  color: string;
  /** 0–1. */
  alpha: number;
}

export interface DrawingSummary {
  id: string;
  /** Foundry 14+; omitted on older cores. */
  name?: string | null;
  /** The user who owns the drawing. */
  authorId: string | null;
  /** Top-left corner of the bounding box in pixels. */
  x: number;
  y: number;
  shape: DrawingShape;
  /** Distance units. */
  elevation: number;
  /** Integer stacking order; higher is drawn on top. */
  sort: number;
  /** Degrees clockwise; the core normalizes it into 0–360. */
  rotation: number;
  /** Smoothing of polygon edges, 0–0.5 (0 = straight segments). */
  bezierFactor: number;
  fill: DrawingFill;
  stroke: DrawingStroke;
  text: DrawingText;
  /** Seen by the GM only. */
  hidden: boolean;
  /** Protected from edits on the canvas. */
  locked: boolean;
  /** Drawn on the interface layer, above the scene and its lighting (an information drawing). */
  interface: boolean;
  /** Ids of the scene levels the drawing belongs to; empty = every level. Foundry 14+; omitted on older cores. */
  levels?: string[];
}

/**
 * The shape of a new drawing. Polygon points are relative to (x, y); the module normalizes them the way the
 * core's drawing tools do: the bounding box moves to start at (0, 0), x / y shift by the same amount, and
 * width / height become the extent of the points.
 */
export type DrawingShapeInput =
  | { type: 'rectangle' | 'ellipse'; width: number; height: number }
  | { type: 'polygon'; points: number[] };

/** What a caller may set on a drawing; see `DrawingSummary` for meanings, units and ranges. Nested objects are partial. */
export interface DrawingAttributes {
  elevation?: number;
  sort?: number;
  rotation?: number;
  bezierFactor?: number;
  fill?: {
    type?: DrawingFillType;
    color?: string;
    alpha?: number;
    /** `null` removes the pattern image. */
    texture?: string | null;
  };
  stroke?: Partial<DrawingStroke>;
  text?: {
    /** `null` or `''` removes the text. */
    content?: string | null;
    /** `null` returns to the default font. */
    fontFamily?: string | null;
    fontSize?: number;
    color?: string;
    alpha?: number;
  };
  hidden?: boolean;
  locked?: boolean;
  interface?: boolean;
  /** Foundry 14+ only. `null` removes the name. */
  name?: string | null;
  /** Foundry 14+ only. Replaces the levels; `[]` = every level. */
  levels?: string[];
}

export interface GetDrawingsParams {
  sceneId?: string | null;
}

export interface GetDrawingsResult {
  sceneId: string;
  drawings: DrawingSummary[];
}

export interface DrawingResult extends DrawingSummary {
  sceneId: string;
}

/**
 * A drawing must show something: visible text, a fill or an outline, on a shape larger than its outline (else it
 * is refused). Omitted attributes take the core defaults: an 8 px outline and the fill / outline color of the
 * author, no fill, no text; without `sort` the drawing goes on top.
 * A text label on the map: `shape: { type: 'rectangle', width: 400, height: 80 }`, `stroke: { width: 0 }`,
 * `text: { content: 'Tavern', fontSize: 48 }`.
 */
export interface CreateDrawingParams extends DrawingAttributes {
  sceneId?: string | null;
  x: number;
  y: number;
  shape: DrawingShapeInput;
  /** The owning user; defaults to the current (GM) user, as in the core. */
  authorId?: string;
}

export type CreateDrawingResult = DrawingResult;

export interface UpdateDrawingParams extends DrawingAttributes {
  sceneId?: string | null;
  drawingId: string;
  x?: number;
  y?: number;
  /**
   * Partial: an omitted key keeps its value. A rectangle or ellipse takes width / height; a polygon takes points
   * (normalized as on create, which moves x / y). Turning a drawing into a polygon needs points.
   */
  shape?: {
    type?: DrawingShapeType;
    width?: number;
    height?: number;
    points?: number[];
  };
}

export type UpdateDrawingResult = DrawingResult;

export interface DeleteDrawingParams {
  sceneId?: string | null;
  drawingId: string;
}

export interface DeleteDrawingResult {
  deleted: true;
  drawingId: string;
  sceneId: string;
}

// Measured template commands (Foundry 12–13: Foundry 14 merged measured templates into regions, so they are refused there)

export type MeasuredTemplateType = 'circle' | 'cone' | 'rectangle' | 'ray';

export interface MeasuredTemplateSummary {
  id: string;
  /** The user who owns the template. */
  authorId: string | null;
  type: MeasuredTemplateType;
  /** Origin in whole pixels: the center of a circle, the apex of a cone, the start of a ray, a corner of a rectangle. */
  x: number;
  y: number;
  /** Distance units. */
  elevation: number;
  /** Integer stacking order; higher is drawn on top. */
  sort: number;
  /** Distance units, ≥ 0: the radius of a circle, the length of a cone or ray, the diagonal of a rectangle. */
  distance: number;
  /** Degrees, 0 = east, clockwise; the core normalizes it into 0–360. For a rectangle, the angle of its diagonal. */
  direction: number;
  /** Opening angle of a cone in degrees, 0–360; ignored by the other types. */
  angle: number;
  /** Width of a ray in distance units; ignored by the other types. */
  width: number;
  /** `#rrggbb`. */
  borderColor: string;
  /** `#rrggbb`. */
  fillColor: string;
  /** Image or video path relative to the Foundry data root, or a URL, shown inside the area; null = none. */
  texture: string | null;
  /** Seen by the GM only. */
  hidden: boolean;
}

/** What a caller may set on a template; see `MeasuredTemplateSummary` for meanings, units and ranges. */
export interface MeasuredTemplateAttributes {
  elevation?: number;
  sort?: number;
  direction?: number;
  angle?: number;
  width?: number;
  borderColor?: string;
  fillColor?: string;
  /** `null` removes the image. */
  texture?: string | null;
  hidden?: boolean;
}

export interface GetTemplatesParams {
  sceneId?: string | null;
}

export interface GetTemplatesResult {
  sceneId: string;
  templates: MeasuredTemplateSummary[];
}

export interface MeasuredTemplateResult extends MeasuredTemplateSummary {
  sceneId: string;
}

/**
 * Omitted attributes follow the core's template tools: a cone opens at `CONFIG.MeasuredTemplate.defaults.angle`
 * (53.13° unless the game system changes it), a ray is `defaults.width` grid squares wide, the fill takes the
 * author's color, the border is black, and without `sort` the template goes on top.
 */
export interface CreateTemplateParams extends MeasuredTemplateAttributes {
  sceneId?: string | null;
  type: MeasuredTemplateType;
  x: number;
  y: number;
  /** Distance units, > 0. */
  distance: number;
  /** The owning user; defaults to the current (GM) user, as in the core. */
  authorId?: string;
}

export type CreateTemplateResult = MeasuredTemplateResult;

export interface UpdateTemplateParams extends MeasuredTemplateAttributes {
  sceneId?: string | null;
  templateId: string;
  type?: MeasuredTemplateType;
  x?: number;
  y?: number;
  distance?: number;
}

export type UpdateTemplateResult = MeasuredTemplateResult;

export interface DeleteTemplateParams {
  sceneId?: string | null;
  templateId: string;
}

export interface DeleteTemplateResult {
  deleted: true;
  templateId: string;
  sceneId: string;
}

// Region commands (Foundry 12+; v11 refuses with "Regions require Foundry 12 or newer")

/**
 * Who sees the region outside the Regions layer: `layer` = only on the Regions layer, `gamemaster` = always for GMs,
 * `always` = everyone. `observer` (always for users with Observer permission) and `layer-unlocked` (on the layer,
 * while unlocked) exist on Foundry 14+ only.
 */
export type RegionVisibility = 'layer' | 'gamemaster' | 'always' | 'observer' | 'layer-unlocked';
/** Highlight the true shapes or the grid spaces they cover. Foundry 14+. */
export type RegionHighlightMode = 'shapes' | 'coverage';
/** Which kind of wall restriction constrains the shapes. Foundry 14+. */
export type RegionRestrictionType = 'light' | 'darkness' | 'sight' | 'sound' | 'move';
/** Footprint variants of `CONST.TOKEN_SHAPES`. */
export type RegionTokenShapeKind =
  | 'ellipse-1'
  | 'ellipse-2'
  | 'trapezoid-1'
  | 'trapezoid-2'
  | 'rectangle-1'
  | 'rectangle-2';
/** Cone end: `flat` allows angles up to 90°, `semicircle` up to 180°, `round` up to 360°. */
export type RegionConeCurvature = 'round' | 'flat' | 'semicircle';

/** Scene coordinates in pixels. */
export interface RegionPoint {
  x: number;
  y: number;
}

/** A grid space: `row` / `column` are integer grid offsets. */
export interface RegionGridCell {
  row: number;
  column: number;
}

/**
 * Lengths are pixels, rotations degrees clockwise (the core normalizes them into 0–360). Optional fields default as
 * documented and are always present in results; fields marked "Foundry 14+" are refused on older cores and omitted
 * from their results.
 */
export interface RegionShapeBase {
  /** Cuts this shape out of the shapes listed before it. Default false. */
  hole?: boolean;
}

export interface RegionRectangleShape extends RegionShapeBase {
  type: 'rectangle';
  x: number;
  y: number;
  /** > 0. */
  width: number;
  /** > 0. */
  height: number;
  /** Default 0. */
  rotation?: number;
  /** Where (x, y) sits in the rectangle as a fraction of the width: 0 = left edge (default). Foundry 14+. */
  anchorX?: number;
  /** As `anchorX`, of the height: 0 = top edge (default). Foundry 14+. */
  anchorY?: number;
  /** Snapped to the grid spaces it covers. Default false. Foundry 14+. */
  gridBased?: boolean;
}

export interface RegionCircleShape extends RegionShapeBase {
  type: 'circle';
  x: number;
  y: number;
  /** > 0. */
  radius: number;
  /** Foundry 14+. */
  gridBased?: boolean;
}

export interface RegionEllipseShape extends RegionShapeBase {
  type: 'ellipse';
  x: number;
  y: number;
  /** > 0. */
  radiusX: number;
  /** > 0. */
  radiusY: number;
  rotation?: number;
  /** Foundry 14+. */
  gridBased?: boolean;
}

export interface RegionPolygonShape extends RegionShapeBase {
  type: 'polygon';
  /** At least 3 vertices. */
  points: RegionPoint[];
  /** Reference point of the polygon; null = derived by the core. Foundry 14+. */
  origin?: RegionPoint | null;
}

/** Foundry 14+. */
export interface RegionConeShape extends RegionShapeBase {
  type: 'cone';
  /** The apex. */
  x: number;
  y: number;
  /** > 0. */
  radius: number;
  /** Opening angle in degrees, > 0 and ≤ 360 (see `curvature` for the limits). */
  angle: number;
  /** Direction of the axis. Default 0. */
  rotation?: number;
  /** Default `round`. */
  curvature?: RegionConeCurvature;
  gridBased?: boolean;
}

/** Foundry 14+. A band around the circle of `radius`. */
export interface RegionRingShape extends RegionShapeBase {
  type: 'ring';
  x: number;
  y: number;
  /** > 0. */
  radius: number;
  /** ≥ 0, inwards from `radius`. */
  innerWidth: number;
  /** ≥ 0, outwards from `radius`. */
  outerWidth: number;
  gridBased?: boolean;
}

/** Foundry 14+. A ray of `length` from (x, y). */
export interface RegionLineShape extends RegionShapeBase {
  type: 'line';
  x: number;
  y: number;
  /** > 0. */
  length: number;
  /** > 0. */
  width: number;
  rotation?: number;
  gridBased?: boolean;
}

/** Foundry 14+. A token footprint: (x, y) is its top-left corner in whole pixels, width / height in grid spaces. */
export interface RegionTokenShape extends RegionShapeBase {
  type: 'token';
  x: number;
  y: number;
  /** > 0. */
  width: number;
  /** > 0. */
  height: number;
  shape: RegionTokenShapeKind;
}

/** Foundry 14+. A set of grid spaces. */
export interface RegionGridShape extends RegionShapeBase {
  type: 'grid';
  cells: RegionGridCell[];
  /** null = derived by the core. */
  origin?: RegionPoint | null;
}

export type RegionEmanationBaseShape =
  | RegionRectangleShape
  | RegionCircleShape
  | RegionEllipseShape
  | RegionConeShape
  | RegionLineShape
  | RegionPolygonShape
  | RegionTokenShape
  | RegionGridShape;

/** Foundry 14+. Everything within `radius` of the `base` shape. */
export interface RegionEmanationShape extends RegionShapeBase {
  type: 'emanation';
  base: RegionEmanationBaseShape;
  /** ≥ 0. */
  radius: number;
  gridBased?: boolean;
}

export type RegionShape = RegionEmanationBaseShape | RegionRingShape | RegionEmanationShape;

/** Distance units (e.g. feet). */
export interface RegionElevation {
  /** null = unbounded below. */
  bottom: number | null;
  /** null = unbounded above; never below `bottom`. */
  top: number | null;
  /** `top` itself is inside the region. Foundry 14+ (older cores always include it). */
  topInclusive?: boolean;
}

/** Wall restriction of the shapes. Foundry 14+. */
export interface RegionRestriction {
  enabled: boolean;
  type: RegionRestrictionType;
  /** Integer ≥ 0: light and darkness sources below it do not suppress the constraint. */
  priority: number;
}

/** Core region event ids. `regionAnimation` exists on Foundry 14+ only. */
export type RegionEventName =
  | 'regionBoundary'
  | 'regionAnimation'
  | 'behaviorActivated'
  | 'behaviorDeactivated'
  | 'behaviorViewed'
  | 'behaviorUnviewed'
  | 'tokenEnter'
  | 'tokenExit'
  | 'tokenMoveIn'
  | 'tokenMoveOut'
  | 'tokenMoveWithin'
  | 'tokenAnimateIn'
  | 'tokenAnimateOut'
  | 'tokenTurnStart'
  | 'tokenTurnEnd'
  | 'tokenRoundStart'
  | 'tokenRoundEnd';

/** `adjustDarknessLevel`. */
export interface RegionAdjustDarknessLevelConfig {
  /** `override` sets the darkness to `modifier`; `brighten` / `darken` scale it by it. Default `override`. */
  mode: 'override' | 'brighten' | 'darken';
  /** 0–1. Default 0. */
  modifier: number;
}

/** `displayScrollingText`. */
export interface RegionDisplayScrollingTextConfig {
  /** Subset of tokenAnimateIn, tokenAnimateOut, tokenTurnStart, tokenTurnEnd, tokenRoundStart, tokenRoundEnd. */
  events: RegionEventName[];
  text: string;
  /** `#rrggbb`. Default `#ffffff`. */
  color: string;
  /** Default `anyone`; `observer` = users who can observe the token. */
  visibility: 'gamemaster' | 'observer' | 'anyone';
  /** Disable the behavior after it fired once. */
  once: boolean;
}

/** `executeMacro`. */
export interface RegionExecuteMacroConfig {
  events: RegionEventName[];
  /**
   * UUID of a Macro (world or compendium); null = none. A new or changed target must exist ("Macro not found: <uuid>"),
   * and a script macro needs the module's "Allow Script Macros" setting.
   */
  macroUuid: string | null;
  /** Run on every client, not only on the triggering user's. */
  everyone: boolean;
}

/**
 * `executeScript`: JavaScript run in the clients. Creating one, changing one or turning a behavior into one needs
 * the module's "Allow Script Macros" setting.
 */
export interface RegionExecuteScriptConfig {
  events: RegionEventName[];
  /** Body of an async function; must compile. */
  source: string;
}

/** `modifyMovementCost`. */
export interface RegionModifyMovementCostConfig {
  /**
   * Cost multiplier per movement action that has its own terrain difficulty (`walk`, `fly`, `swim`, `burrow`, …,
   * as the world configures them): 0–5 in steps of 0.25; null = impassable for that action. Partial on update.
   */
  difficulties: Record<string, number | null>;
}

/** `pauseGame`. */
export interface RegionPauseGameConfig {
  once: boolean;
}

/** `teleportToken`. */
export interface RegionTeleportTokenConfig {
  /** UUIDs of destination Regions (absolute). Foundry 13 and older keep at most one. */
  destinationUuids: string[];
  /** Let the moving user choose whether to teleport. */
  choice: boolean;
  /** Foundry 14+. Default `random`. */
  placement?: 'random' | 'center' | 'relative';
  /** Foundry 14+. Snap the token at the destination. Default true. */
  snap?: boolean;
  /** Foundry 14+. */
  revealed?: boolean;
  /** Foundry 14+. Confirmation texts; null = the default text. Partial on update. */
  dialog?: { revealed: string | null; unrevealed: string | null };
  /** Foundry 14+. Scene transition: `type` a key of `CONFIG.Canvas.sceneTransitions` or null; `duration` ms, integer 500–10000. Partial on update. */
  transition?: { type: string | null; duration: number };
}

/** `toggleBehavior`. */
export interface RegionToggleBehaviorConfig {
  /** Subset of tokenEnter, tokenExit, tokenMoveIn, tokenMoveOut, tokenTurnStart, tokenTurnEnd, tokenRoundStart, tokenRoundEnd. */
  events: RegionEventName[];
  /** UUIDs of RegionBehaviors to enable (absolute). */
  enableUuids: string[];
  /** UUIDs of RegionBehaviors to disable; disjoint from `enableUuids`. */
  disableUuids: string[];
}

/** `applyActiveEffect`. Foundry 14+. */
export interface RegionApplyActiveEffectConfig {
  /** UUIDs of ActiveEffects applied while a token is inside. */
  effectUuids: string[];
}

/** `changeLevel`. Foundry 14+. */
export interface RegionChangeLevelConfig {
  /** Movement action ids (`CONFIG.Token.movement.actions`, except `displace`). */
  movementActions: string[];
}

/** `defineSurface`. Foundry 14+. */
export interface RegionDefineSurfaceConfig {
  /** Default `bottom`. */
  placement: 'bottom' | 'top' | 'both';
  light: boolean;
  move: boolean;
  sight: boolean;
  sound: boolean;
  occlusion: boolean;
  exposure: boolean;
  culling: boolean;
}

/**
 * The type's settings. Core types (one interface each above; `suppressWeather` has none: `{}`) are validated
 * field by field: on create omitted fields take the core defaults, on update omitted fields are kept, and a type
 * change starts from the defaults. A type registered by a game system or module is passed through as an opaque
 * object (its stored `system` data) and validated by the core.
 */
export type RegionBehaviorConfig =
  | RegionAdjustDarknessLevelConfig
  | RegionDisplayScrollingTextConfig
  | RegionExecuteMacroConfig
  | RegionExecuteScriptConfig
  | RegionModifyMovementCostConfig
  | RegionPauseGameConfig
  | RegionTeleportTokenConfig
  | RegionToggleBehaviorConfig
  | RegionApplyActiveEffectConfig
  | RegionChangeLevelConfig
  | RegionDefineSurfaceConfig
  | Record<string, unknown>;

export interface RegionBehaviorSummary {
  id: string;
  name: string;
  /** Core id (`teleportToken`, …) or `<package>.<name>` of a system / module type. */
  type: string;
  disabled: boolean;
}

export interface RegionBehaviorDetail extends RegionBehaviorSummary {
  config: RegionBehaviorConfig;
}

export interface RegionBehaviorResult extends RegionBehaviorDetail {
  sceneId: string;
  regionId: string;
}

export interface RegionBase {
  id: string;
  name: string;
  /** `#rrggbb`. */
  color: string;
  shapes: RegionShape[];
  elevation: RegionElevation;
  /** null when the document holds a code this module does not know. */
  visibility: RegionVisibility | null;
  locked: boolean;
  /** Ids of the scene levels the region belongs to; empty = every level. Foundry 14+. */
  levelIds?: string[];
  /** Foundry 14+. */
  restriction?: RegionRestriction;
  /** Token the region moves with; null = none. Foundry 14+. */
  attachedTokenId?: string | null;
  /** Foundry 14+. */
  highlightMode?: RegionHighlightMode;
  /** Foundry 14+. */
  displayMeasurements?: boolean;
  /** Hidden from players. Foundry 14+. */
  hidden?: boolean;
}

export interface RegionSummary extends RegionBase {
  behaviors: RegionBehaviorSummary[];
}

export interface RegionDetail extends RegionBase {
  behaviors: RegionBehaviorDetail[];
}

export interface RegionResult extends RegionDetail {
  sceneId: string;
}

/** What a caller may set on a region; see `RegionBase`. Fields marked Foundry 14+ are refused on older cores. */
export interface RegionAttributes {
  color?: string;
  /** Replaces all shapes. */
  shapes?: RegionShape[];
  /** Partial on update; null = unbounded. */
  elevation?: { bottom?: number | null; top?: number | null; topInclusive?: boolean };
  visibility?: RegionVisibility;
  locked?: boolean;
  /** Must name levels of the scene. */
  levelIds?: string[];
  /** Partial on update. */
  restriction?: { enabled?: boolean; type?: RegionRestrictionType; priority?: number };
  /** Must name a token of the scene; null detaches. */
  attachedTokenId?: string | null;
  highlightMode?: RegionHighlightMode;
  displayMeasurements?: boolean;
  hidden?: boolean;
}

export interface GetRegionsParams {
  sceneId?: string | null;
}

export interface GetRegionsResult {
  sceneId: string;
  regions: RegionSummary[];
}

export interface GetRegionParams {
  sceneId?: string | null;
  regionId: string;
}

export type GetRegionResult = RegionResult;

export interface CreateRegionParams extends RegionAttributes {
  sceneId?: string | null;
  /** Non-blank. */
  name: string;
}

export type CreateRegionResult = RegionResult;

export interface UpdateRegionParams extends RegionAttributes {
  sceneId?: string | null;
  regionId: string;
  name?: string;
}

export type UpdateRegionResult = RegionResult;

export interface DeleteRegionParams {
  sceneId?: string | null;
  regionId: string;
}

export interface DeleteRegionResult {
  deleted: true;
  regionId: string;
  sceneId: string;
}

export interface CreateRegionBehaviorParams {
  sceneId?: string | null;
  regionId: string;
  /** Must be registered in the world (core types of the running Foundry plus system / module types). */
  type: string;
  /** Default ''. */
  name?: string;
  disabled?: boolean;
  config?: RegionBehaviorConfig;
}

export type CreateRegionBehaviorResult = RegionBehaviorResult;

export interface UpdateRegionBehaviorParams {
  sceneId?: string | null;
  regionId: string;
  behaviorId: string;
  /** Changing the type replaces the whole config (omitted fields take the new type's defaults). */
  type?: string;
  name?: string;
  disabled?: boolean;
  config?: RegionBehaviorConfig;
}

export type UpdateRegionBehaviorResult = RegionBehaviorResult;

export interface DeleteRegionBehaviorParams {
  sceneId?: string | null;
  regionId: string;
  behaviorId: string;
}

export interface DeleteRegionBehaviorResult {
  deleted: true;
  behaviorId: string;
  regionId: string;
  sceneId: string;
}

export interface GetRegionTokensParams {
  sceneId?: string | null;
  regionId: string;
}

export interface RegionTokenRef {
  id: string;
  name: string;
}

/**
 * The tokens the core records as inside the region (each token's `_regions`). The core refreshes that record
 * asynchronously after a token moves or the region changes, so a change made a moment ago may not show yet.
 */
export interface GetRegionTokensResult {
  sceneId: string;
  regionId: string;
  tokens: RegionTokenRef[];
}

export interface TestRegionPointParams {
  sceneId?: string | null;
  regionId: string;
  /** Pixels. */
  x: number;
  y: number;
  /** Distance units. Default 0. */
  elevation?: number;
}

export interface TestRegionPointResult {
  sceneId: string;
  regionId: string;
  x: number;
  y: number;
  elevation: number;
  /** Inside the shapes and the elevation range, as `RegionDocument#testPoint` answers. */
  inside: boolean;
}

// Card stacks (the core Cards documents: decks, hands, piles) and their cards
export type CardStackType = 'deck' | 'hand' | 'pile';
/** Which cards a deal or a draw takes: from the top of the stack (lowest `sort`), from the bottom, or at random. */
export type CardDrawMode = 'top' | 'bottom' | 'random';

export interface CardFaceSummary {
  name: string | null;
  /** HTML. */
  text: string;
  img: string | null;
}

export interface CardSummary {
  id: string;
  /** The card's own name, also while it lies face down. */
  name: string;
  description: string;
  /** `base`, or a card type the game system defines. */
  type: string;
  suit: string;
  value: number | null;
  faces: CardFaceSummary[];
  /** Index of the face shown; null when the card lies face down (its back is shown). */
  face: number | null;
  /** True when `face` names one of `faces`. */
  faceUp: boolean;
  back: CardFaceSummary;
  /** The image shown now: the face shown, else the back, else the image of the card's deck. */
  img: string;
  /** In a deck: the card is out, in a hand or a pile. The core also marks every card it moves into a hand or a pile as drawn. */
  drawn: boolean;
  /** The stack the card came from and goes back to on a recall; null when it has none. */
  originId: string | null;
  /** Integer; a lower value lies nearer the top of the stack. */
  sort: number;
  /** Opaque game-system data. */
  system: Record<string, unknown>;
  flags: Record<string, unknown>;
}

export interface CardStackSummary {
  id: string;
  uuid: string;
  name: string;
  /** `deck`, `hand` or `pile`, or a type the game system defines. */
  type: string;
  img: string | null;
  folderId: string | null;
  folderName: string | null;
  /** Users with owner permission on the stack (for a hand, usually its player). */
  ownerIds: string[];
  /** Every card in the stack, a deck's cards that are out included. */
  cardCount: number;
  /** Cards that can be dealt or drawn from it: a deck's cards that are not out, every card of a hand or a pile. */
  availableCount: number;
  /** A deck's cards that are out in hands or piles; null for a hand or a pile. */
  drawnCount: number | null;
}

export interface CardStackDetails extends CardStackSummary {
  description: string;
  /** Top first (ascending `sort`). */
  cards: CardSummary[];
}

/** A face or the back of a card. Absent fields take the core defaults; `null` clears a field. */
export interface CardFaceInput {
  name?: string | null;
  /** HTML. */
  text?: string | null;
  img?: string | null;
}

export interface CardResult {
  stackId: string;
  card: CardSummary;
}

export interface CardMoveSummary {
  cardId: string;
  name: string;
  /** null when no stack held the card before (a deck takes back a card whose copy is gone). */
  fromStackId: string | null;
  /** null when no stack holds it now (a hand returns a card its deck no longer has, or the deck was deleted). */
  toStackId: string | null;
}

/** What an operation moved, read from the stacks as the core left them, and the counts of every stack involved. */
export interface CardOperationResult {
  moved: CardMoveSummary[];
  stacks: CardStackSummary[];
}

export interface CardMoveOptions {
  /** true lays the cards face down, false turns them face up on their first face; absent keeps each card's face. */
  faceDown?: boolean;
  /** Post the core's chat notification of the action. Default true. */
  chatNotification?: boolean;
}

export interface GetCardStacksParams {
  type?: CardStackType;
}

export interface GetCardStacksResult {
  cardStacks: CardStackSummary[];
}

export interface GetCardStackParams {
  stackId: string;
}

export type GetCardStackResult = CardStackDetails;

export interface CreateCardStackParams {
  name: string;
  /** Required unless `preset` is given; then it defaults to the preset's type and must match it. */
  type?: CardStackType;
  /**
   * Fill the stack from a core preset (`CONFIG.Cards.presets`): `pokerDark` or `pokerLight`,
   * a standard 52-card deck, or a preset a module adds. The other params override the
   * preset's name, image and description.
   */
  preset?: string;
  description?: string;
  img?: string;
  /** A folder of card stacks; absent, null or '': the directory root. */
  folderId?: string | null;
}

export type CreateCardStackResult = CardStackDetails;

export interface UpdateCardStackParams {
  stackId: string;
  name?: string;
  /** null clears it. */
  description?: string | null;
  img?: string;
  /** null or '' moves the stack to the directory root. */
  folderId?: string | null;
}

export type UpdateCardStackResult = CardStackDetails;

export interface DeleteCardStackParams {
  stackId: string;
  /**
   * The core recalls the stack's cards before it deletes the stack and posts that in chat.
   * false skips the message: Foundry 14 or newer only, refused on older cores. Default true.
   */
  chatNotification?: boolean;
}

export interface DeleteCardStackResult {
  deleted: true;
  stackId: string;
  /** What that recall moved: a hand's cards back to their decks, or a deck's cards out of hands and piles. */
  moved: CardMoveSummary[];
}

export interface CreateCardParams {
  stackId: string;
  name: string;
  /** Default `base`; else a card type the game system defines. */
  type?: string;
  description?: string;
  suit?: string;
  value?: number | null;
  /** Default: one face with the core's default image, as the card sheet creates a card. */
  faces?: CardFaceInput[];
  /** Index of the face shown, or null for face down. Default 0 when the card has a face, else null. */
  face?: number | null;
  back?: CardFaceInput;
  /** Integer. Default 0. */
  sort?: number;
  system?: Record<string, unknown>;
  flags?: Record<string, unknown>;
}

export type CreateCardResult = CardResult;

export interface UpdateCardParams {
  stackId: string;
  cardId: string;
  name?: string;
  /** null clears it. */
  description?: string | null;
  /** null clears it. */
  suit?: string | null;
  value?: number | null;
  /** Replaces the whole list. */
  faces?: CardFaceInput[];
  face?: number | null;
  /** Merged field by field into the stored back. */
  back?: CardFaceInput;
  sort?: number;
  /** Merged into the stored object, as the core merges updates. */
  system?: Record<string, unknown>;
  flags?: Record<string, unknown>;
}

export type UpdateCardResult = CardResult;

export interface DeleteCardParams {
  stackId: string;
  cardId: string;
}

export interface DeleteCardResult {
  deleted: true;
  stackId: string;
  cardId: string;
}

export interface ShuffleCardsParams extends CardMoveOptions {
  stackId: string;
}

export interface DealCardsParams extends CardMoveOptions {
  /** The stack dealt from, usually a deck. */
  stackId: string;
  /** Hands or piles, no duplicates; each gets `count` cards, dealt in turn. */
  toStackIds: string[];
  /** Cards per destination, ≥ 1. Default 1. */
  count?: number;
  /** Default `top`. */
  drawMode?: CardDrawMode;
}

export interface DrawCardsParams extends CardMoveOptions {
  /** The hand or pile that draws. */
  stackId: string;
  /** The stack drawn from, usually a deck. */
  fromStackId: string;
  /** ≥ 1. Default 1. */
  count?: number;
  /** Default `top`. */
  drawMode?: CardDrawMode;
}

export interface PassCardsParams extends CardMoveOptions {
  stackId: string;
  /**
   * Any other stack. A card passed to the deck it came from goes back into it; a deck
   * passing its own cards to another deck copies them; other cards cannot go into a deck.
   */
  toStackId: string;
  /** Cards of `stackId`, no duplicates. */
  cardIds: string[];
}

export interface PlayCardParams extends CardMoveOptions {
  stackId: string;
  cardId: string;
  /** A hand or a pile. */
  toStackId: string;
}

export type DiscardCardParams = PlayCardParams;

export interface RecallCardsParams extends CardMoveOptions {
  /** A deck takes back all its cards from every stack; a hand or a pile returns its cards to their decks. */
  stackId: string;
}

export interface FlipCardParams {
  stackId: string;
  cardId: string;
  /**
   * A face index, null to lay the card face down, or `next` / `previous` to step through its
   * faces (`next` from face down shows the first face, `previous` from the first face lays it
   * face down). Absent: the core's flip, face down when a face is shown, else the first face.
   */
  face?: number | null | 'next' | 'previous';
}

export type FlipCardResult = CardResult;

export interface ShowCardParams {
  stackId: string;
  cardId: string;
  /** User ids to whisper the message to; absent or empty: a public message. */
  whisperTo?: string[];
}

export interface ShowCardResult {
  stackId: string;
  cardId: string;
  messageId: string;
}

// Users

export type UserRoleName = 'none' | 'player' | 'trusted' | 'assistant' | 'gamemaster';

export interface UserCharacterRef {
  id: string;
  name: string;
}

export interface UserSceneRef {
  id: string;
  name: string;
}

export interface UserSummary {
  id: string;
  name: string;
  /** `none` is a banned user. */
  role: UserRoleName;
  /** True for the assistant and gamemaster roles. */
  isGM: boolean;
  /** True for the user this module runs as: the GM whose browser hosts it. */
  isSelf: boolean;
  /** Connected to the world right now. */
  active: boolean;
  /** CSS hex color, `#rrggbb`. */
  color: string | null;
  /** The image the core shows for the user: their own avatar, else their character's image, else the default token. */
  avatar: string | null;
  pronouns: string | null;
  /** The actor assigned as the user's character. */
  character: UserCharacterRef | null;
  /** The scene the user's client shows; null for a user who is offline or views no scene. */
  viewedScene: UserSceneRef | null;
  /**
   * Ids of the tokens the user has targeted. The core tracks another user's
   * targets only on the scene this GM client is viewing, so the list is empty
   * for a user who looks at a different scene.
   */
  targetTokenIds: string[];
}

export interface UserDetails extends UserSummary {
  /**
   * Names of the core permissions (`CONST.USER_PERMISSIONS`, e.g. `TOKEN_CREATE`)
   * the user effectively holds: the role defaults of the world with the user's
   * own overrides applied.
   */
  permissions: string[];
}

export interface GetUsersParams {
  /** Only the users connected right now. Default false. */
  activeOnly?: boolean;
}

export interface GetUsersResult {
  users: UserSummary[];
}

export interface GetUserParams {
  userId: string;
}

export type GetUserResult = UserDetails;

export interface UpdateUserParams {
  userId: string;
  /** Must not be blank. */
  name?: string;
  /** CSS hex color in the full `#rrggbb` form. */
  color?: string;
  /** `null` or an empty string clears the pronouns. */
  pronouns?: string | null;
  /** The actor to assign as the user's character; `null` unassigns it. */
  characterId?: string | null;
  /**
   * Only `none` (banned), `player` and `trusted` can be assigned, and only to
   * a user who is neither assistant nor gamemaster nor the module's own user.
   * The core logs a connected user out when their role changes.
   */
  role?: UserRoleName;
}

export type UpdateUserResult = UserDetails;

// Settings

export type SettingScopeName = 'world' | 'client' | 'user';
export type SettingValueTypeName = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'unknown';
export type SettingAccessLevel = 'read-write' | 'read-only' | 'none';

export interface SettingChoice {
  value: string | number;
  /** Localized where a translation is loaded. */
  label: string;
}

export interface SettingRange {
  min: number | null;
  max: number | null;
  /** Counted from `min` (or 0); 1 for an integer field without a step of its own. */
  step: number | null;
}

export interface SettingSummary {
  /** `<namespace>.<key>`. */
  id: string;
  /** `core`, the game system id or a module id. */
  namespace: string;
  key: string;
  /** Localized where a translation is loaded, otherwise the registered text or i18n key. */
  name: string | null;
  hint: string | null;
  /**
   * Where the value lives. `world`: the world database, one value for
   * everyone. `user` (Foundry 13+): the world database, one value per user —
   * this API reads and writes the value of the GM user the module runs as.
   * `client`: the local storage of the GM browser that hosts the module, so
   * the value belongs to that one browser and says nothing about the players'.
   */
  scope: SettingScopeName;
  /** Shown in the Configure Settings dialog; false for a value a package keeps for itself. */
  config: boolean;
  /** `unknown` when the setting is registered without a type or with a custom class. */
  valueType: SettingValueTypeName;
  /** The allowed values, when the setting is a choice. */
  choices: SettingChoice[] | null;
  /** The bounds of a numeric setting. */
  range: SettingRange | null;
  /** Whether `null` is a value `set-setting` accepts. */
  nullable: boolean;
  /**
   * A change takes effect only after a reload — of every client for a `world`
   * setting, of the GM browser otherwise. The module never reloads anything.
   */
  requiresReload: boolean;
  /**
   * What this API may do with the value. `none`: the key, or a field inside
   * the default value (e.g. `turn.password` of `core.rtcWorldSettings`), looks
   * like a credential. `read-only`: `core.permissions`. The module's own
   * settings are not listed at all.
   */
  access: SettingAccessLevel;
}

export interface SettingDetails extends SettingSummary {
  /** Plain JSON; a data-model value is given as its source object. */
  value: unknown;
  /** The registered default, as plain JSON. */
  default: unknown;
}

export interface GetSettingsParams {
  /** Only the settings of this namespace. */
  namespace?: string | null;
  scope?: SettingScopeName | null;
}

export interface GetSettingsResult {
  settings: SettingSummary[];
}

export interface GetSettingParams {
  namespace: string;
  key: string;
}

export type GetSettingResult = SettingDetails;

export interface SetSettingParams {
  namespace: string;
  key: string;
  /**
   * Plain JSON of the setting's `valueType`, one of its `choices` and inside
   * its `range` when it has them; `null` only where `nullable` is true. The
   * core then validates a field- or model-typed value in depth.
   */
  value: unknown;
}

export interface SetSettingResult extends SettingDetails {
  previousValue: unknown;
  /**
   * False when the setting already held this value. A reload is due only when
   * `changed` and `requiresReload` are both true; the module never reloads.
   */
  changed: boolean;
}

// Token appearance and senses, prototype tokens, core movement (Foundry 13+)

export type TokenShape = 'ellipse-1' | 'ellipse-2' | 'trapezoid-1' | 'trapezoid-2' | 'rectangle-1' | 'rectangle-2';
export type TokenTextureFit = 'fill' | 'contain' | 'cover' | 'width' | 'height';
/** Who sees a token's nameplate or resource bars, and when. */
export type TokenDisplayMode = 'none' | 'control' | 'owner-hover' | 'hover' | 'owner' | 'always';
export type TokenRingEffect = 'pulse' | 'gradient' | 'background-wave' | 'invisibility' | 'color-over-subject';
export type TokenTurnMarkerMode = 'disabled' | 'default' | 'custom';

export interface TokenTexture {
  /** Image or video path. */
  src: string;
  /** `#rrggbb`. */
  tint: string;
  fit: TokenTextureFit;
  /** Where the image sits in the token's frame, as a fraction of its size (0.5 = centered). */
  anchorX: number;
  anchorY: number;
  /** Size multipliers; a negative value mirrors the image on that axis. */
  scaleX: number;
  scaleY: number;
  /** Pixels less opaque than this (0–1) do not catch the pointer. */
  alphaThreshold: number;
  /** Pixel offset, integer. Foundry 13 and older; omitted on 14+. */
  offsetX?: number;
  offsetY?: number;
  /** Degrees. Foundry 13 and older; omitted on 14+. */
  rotation?: number;
}

/** Partial; out-of-range values are rejected, not clamped. */
export interface TokenTextureChanges {
  /** A non-empty path. */
  src?: string;
  /** `#rrggbb` (or `#rgb`). */
  tint?: string;
  fit?: TokenTextureFit;
  anchorX?: number;
  anchorY?: number;
  /** Non-zero. */
  scaleX?: number;
  scaleY?: number;
  /** 0–1. */
  alphaThreshold?: number;
  /** Integer. Foundry 13 and older, like `offsetY` and `rotation`; refused on 14+. */
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
}

export interface TokenSight {
  enabled: boolean;
  /** Distance units; null = unlimited. */
  range: number | null;
  /** Vision cone in degrees, 0–360. */
  angle: number;
  /** A key of `CONFIG.Canvas.visionModes` (core: basic, darkvision, monochromatic, tremorsense, lightAmplification). */
  visionMode: string;
  /** `#rrggbb`; null = none. */
  color: string | null;
  /** 0–1. */
  attenuation: number;
  /** −1–1, like `saturation` and `contrast`. */
  brightness: number;
  saturation: number;
  contrast: number;
}

/** Partial; out-of-range values are rejected, not clamped. */
export interface TokenSightChanges {
  enabled?: boolean;
  /** ≥ 0; null = unlimited. */
  range?: number | null;
  angle?: number;
  /** Checked against the running world. */
  visionMode?: string;
  /** `#rrggbb` (or `#rgb`); null removes the color. */
  color?: string | null;
  attenuation?: number;
  brightness?: number;
  saturation?: number;
  contrast?: number;
  /**
   * With `visionMode`: also apply the defaults that mode defines (attenuation, brightness, …), as the token sheet
   * does when the mode is picked. Fields given here win over the defaults. Default false.
   */
  applyModeDefaults?: boolean;
}

export interface TokenDetectionMode {
  /**
   * A key of `CONFIG.Canvas.detectionModes` (core: basicSight, lightPerception, seeAll, seeInvisibility, senseAll,
   * senseInvisibility, feelTremor); checked against the running world. Each id at most once.
   */
  id: string;
  enabled: boolean;
  /** Distance units; null = unlimited. */
  range: number | null;
}

export interface TokenRing {
  enabled: boolean;
  /** `#rrggbb`; null = the default. */
  ringColor: string | null;
  backgroundColor: string | null;
  effects: TokenRingEffect[];
  /** Scale of the subject image inside the ring, ≥ 0.5. */
  subjectScale: number;
  /** null = derived from the token image. */
  subjectTexture: string | null;
}

/** Partial; `effects` replaces the whole set. */
export interface TokenRingChanges {
  enabled?: boolean;
  /** `#rrggbb` (or `#rgb`); null resets to the default. */
  ringColor?: string | null;
  backgroundColor?: string | null;
  effects?: TokenRingEffect[];
  subjectScale?: number;
  subjectTexture?: string | null;
}

export interface TokenTurnMarker {
  mode: TokenTurnMarkerMode;
  /** An id of `CONFIG.Combat.settings.turnMarkerAnimations`; null = the combat tracker's choice. */
  animation: string | null;
  /** Image or video of the marker; null = the combat tracker's choice. */
  src: string | null;
  /** Tint the marker with the token's disposition color. */
  disposition: boolean;
}

/** Partial. */
export interface TokenTurnMarkerChanges {
  mode?: TokenTurnMarkerMode;
  /** Checked against the running world; null = the combat tracker's choice. */
  animation?: string | null;
  src?: string | null;
  disposition?: boolean;
}

/** What a token looks like and perceives: the fields a placed token shares with an actor's prototype token. */
export interface TokenAppearance {
  /** Grid spaces, > 0. */
  width: number;
  height: number;
  /** Grid spaces, ≥ 0. Foundry 14+; omitted on older cores. */
  depth?: number;
  texture: TokenTexture;
  /** Opacity, 0–1. */
  alpha: number;
  /** Degrees. */
  rotation: number;
  lockRotation: boolean;
  disposition: TokenDisposition;
  displayName: TokenDisplayMode;
  displayBars: TokenDisplayMode;
  /** Attribute path shown by the first resource bar (system-defined, e.g. `attributes.hp`); null = no bar. */
  bar1: string | null;
  bar2: string | null;
  /** The light the token emits. */
  light: LightEmission;
  sight: TokenSight;
  detectionModes: TokenDetectionMode[];
  /** Distance units within which the token reveals occludable overhead tiles. */
  occludableRadius: number;
  /** Dynamic token ring. Foundry 12+; omitted on older cores. */
  ring?: TokenRing;
  /** Foundry 13+; omitted on older cores. */
  turnMarker?: TokenTurnMarker;
  /** A key of `CONFIG.Token.movement.actions`; null = the default action. Foundry 13+; omitted on older cores. */
  movementAction?: string | null;
}

/** The appearance of a placed token: the shared fields plus what only a placed token stores. */
export interface TokenAppearanceDetail extends TokenAppearance {
  /** Foundry 13+; omitted on older cores. */
  shape?: TokenShape;
  /** Protected from edits on the canvas. */
  locked: boolean;
  /** Stacking order among the scene's tokens; integer. */
  sort: number;
}

/**
 * Appearance fields a caller may set on a token or a prototype token; see `TokenAppearance` for meanings, units and
 * ranges. Out-of-range values, unknown registry ids and fields the running Foundry generation does not store are
 * rejected.
 */
export interface TokenAppearanceChanges {
  width?: number;
  height?: number;
  /** Foundry 14+; refused on older cores. */
  depth?: number;
  texture?: TokenTextureChanges;
  alpha?: number;
  lockRotation?: boolean;
  displayBars?: TokenDisplayMode;
  /** A non-empty attribute path, or null for no bar. */
  bar1?: string | null;
  bar2?: string | null;
  light?: LightEmissionChanges;
  sight?: TokenSightChanges;
  /** Replaces the whole list. */
  detectionModes?: TokenDetectionMode[];
  /** ≥ 0. */
  occludableRadius?: number;
  /** Foundry 12+; refused on older cores. */
  ring?: TokenRingChanges;
  /** Foundry 13+; refused on older cores. */
  turnMarker?: TokenTurnMarkerChanges;
  /** Checked against the running world; null = the default action. Foundry 13+; refused on older cores. */
  movementAction?: string | null;
}

/** What only a placed token stores; `create-token` / `update-token` accept these next to the appearance. */
export interface TokenPlacementChanges {
  /** Foundry 13+; refused on older cores. */
  shape?: TokenShape;
  locked?: boolean;
  /** Integer. */
  sort?: number;
}

export interface TokenAppearanceRequest {
  /** Add the full appearance snapshot (`appearance`) to the result. Default false. */
  includeAppearance?: boolean;
}

export interface TokenAppearanceExtras {
  /** Present when the request set `includeAppearance`. */
  appearance?: TokenAppearanceDetail;
}

export interface CreateTokenAppearanceParams extends TokenAppearanceChanges, TokenPlacementChanges, TokenAppearanceRequest {
  /**
   * Build the token from the actor's prototype token (its image, size, vision, light, name rules …) the way dropping
   * the actor on the canvas does, with the other params applied on top. Default false: the token gets the core's
   * defaults for everything not given, as this command has always done.
   */
  fromPrototype?: boolean;
  name?: string;
  /** One of the names, or the legacy number (-2 secret, -1 hostile, 0 neutral, 1 friendly). */
  disposition?: TokenDisposition | number;
  /** One of the names, or the legacy number (0, 10, 20, 30, 40, 50). */
  displayName?: TokenDisplayMode | number;
}

export interface UpdateTokenAppearanceParams extends TokenAppearanceChanges, TokenPlacementChanges, TokenAppearanceRequest {}

export interface PrototypeTokenSnapshot extends TokenAppearance {
  actorId: string;
  /** The name tokens are placed with. */
  name: string;
  /** Placed tokens share the actor's data (linked) instead of being independent copies. */
  actorLink: boolean;
  /** Placed tokens pick a random image matching the wildcard `texture.src`. */
  randomImg: boolean;
  /** Unlinked tokens get a number appended to their name ("Goblin (2)"). */
  appendNumber: boolean;
  /** Unlinked tokens get a random adjective prepended ("Sneaky Goblin"). */
  prependAdjective: boolean;
}

export interface GetPrototypeTokenParams {
  actorId: string;
}

export type GetPrototypeTokenResult = PrototypeTokenSnapshot;

export interface UpdatePrototypeTokenParams extends TokenAppearanceChanges {
  actorId: string;
  name?: string;
  actorLink?: boolean;
  randomImg?: boolean;
  appendNumber?: boolean;
  prependAdjective?: boolean;
  rotation?: number;
  /** One of the names, or the legacy number (-2 secret, -1 hostile, 0 neutral, 1 friendly). */
  disposition?: TokenDisposition | number;
  /** One of the names, or the legacy number (0, 10, 20, 30, 40, 50). */
  displayName?: TokenDisplayMode | number;
}

export type UpdatePrototypeTokenResult = PrototypeTokenSnapshot;

export interface GetActorTokensParams {
  actorId: string;
}

export interface ActorTokenPlacement {
  sceneId: string;
  sceneName: string;
  /** The scene is the active one. */
  sceneActive: boolean;
  tokenId: string;
  name: string;
  x: number;
  y: number;
  elevation: number;
  hidden: boolean;
  actorLink: boolean;
}

export interface GetActorTokensResult {
  actorId: string;
  /** Every token placed for the actor, on every scene of the world. */
  tokens: ActorTokenPlacement[];
}

export interface GetTokenImagesParams {
  actorId: string;
}

export interface GetTokenImagesResult {
  actorId: string;
  /** The prototype picks a random image; otherwise `images` is just the prototype's image. */
  randomImg: boolean;
  /** The images the wildcard path of the prototype token matches, as the server lists them. */
  images: string[];
}

export type TokenMovementState = 'completed' | 'pending' | 'paused' | 'stopped' | 'planned';

export interface TokenMovementWaypointParams {
  /** Top-left corner in pixels; default: the previous waypoint's (the token's own for the first). */
  x?: number;
  y?: number;
  /** Distance units; default: the previous waypoint's. */
  elevation?: number;
  /**
   * How the token moves to this waypoint: a key of `CONFIG.Token.movement.actions` (core: walk, fly, swim, burrow,
   * crawl, climb, jump, blink, displace), checked against the running world. Default: the previous waypoint's.
   */
  action?: string;
  /** The position is already snapped to the grid. */
  snapped?: boolean;
  /** Shown as a waypoint the user placed. */
  explicit?: boolean;
  /** The movement may be stopped or paused here; the last waypoint always is a checkpoint. */
  checkpoint?: boolean;
}

export interface TokenMovementSnapshot {
  sceneId: string;
  tokenId: string;
  /** The token's movement right now; `completed` when nothing is in progress. */
  state: TokenMovementState;
  /** null when the token has not moved since the scene was loaded. */
  movementId: string | null;
  /** The user who started that movement; null when none. */
  userId: string | null;
  /** The token's stored position. */
  x: number;
  y: number;
  elevation: number;
}

export interface MoveTokenPathParams {
  sceneId?: string | null;
  tokenId: string;
  /** 1–100 waypoints, from the token's position onwards. */
  waypoints: TokenMovementWaypointParams[];
  /** Pass through walls. Default false: the movement stops at the first wall. */
  ignoreWalls?: boolean;
  /** Ignore terrain cost and impassable terrain. Default false. */
  ignoreCost?: boolean;
  /** Turn the token in the direction it moves. Default false. */
  autoRotate?: boolean;
  /** Show the movement ruler to the players. Default false. */
  showRuler?: boolean;
}

export interface MoveTokenPathResult extends TokenMovementSnapshot {
  /** The position changed. */
  moved: boolean;
  /** The token stands at the last waypoint. */
  arrived: boolean;
}

export interface TokenMovementParams {
  sceneId?: string | null;
  tokenId: string;
}

export interface StopTokenMovementResult extends TokenMovementSnapshot {
  /** The movement was or is stopped; false when nothing was in progress. */
  stopped: boolean;
}

export interface PauseTokenMovementParams extends TokenMovementParams {
  /** The key `resume-token-movement` must pass; default `foundry-api-bridge`. */
  key?: string;
}

export interface PauseTokenMovementResult extends TokenMovementSnapshot {
  /** The movement was or is paused; false when nothing was in progress. */
  paused: boolean;
  key: string;
}

export interface ResumeTokenMovementParams extends TokenMovementParams {
  /** Default: the token's current movement. */
  movementId?: string;
  /** The key the movement was paused with; default `foundry-api-bridge`. */
  key?: string;
}

export interface ResumeTokenMovementResult extends TokenMovementSnapshot {
  /** The core resumes the movement after its current workflow, so `state` may still read `paused`. */
  requested: true;
}

export interface MeasureTokenPathParams {
  sceneId?: string | null;
  tokenId: string;
  /** 1–100 waypoints; the path starts at the token's position. */
  waypoints: TokenMovementWaypointParams[];
}

export interface TokenPathSegmentMeasurement {
  /** Distance units. */
  distance: number;
  /** null = impassable. */
  cost: number | null;
  spaces: number;
  diagonals: number;
}

export interface MeasureTokenPathResult {
  sceneId: string;
  tokenId: string;
  /** Distance units, along the grid as the scene's diagonal rule counts it. */
  distance: number;
  /** Movement cost; null = impassable. */
  cost: number | null;
  /** Grid spaces moved; 0 on a gridless scene. */
  spaces: number;
  diagonals: number;
  units: string;
  segments: TokenPathSegmentMeasurement[];
  /**
   * `terrain`: cost includes terrain and movement-action rules (the token is on the canvas); `distance`: the token's
   * scene is not on the canvas and cost equals distance.
   */
  costBasis: 'terrain' | 'distance';
}

export interface FindTokenPathParams {
  sceneId?: string | null;
  tokenId: string;
  /** 1–100 waypoints the path must pass; it starts at the token's position. */
  waypoints: TokenMovementWaypointParams[];
  ignoreWalls?: boolean;
  ignoreCost?: boolean;
}

export interface TokenPathWaypoint {
  x: number;
  y: number;
  elevation: number;
  action: string;
}

export interface FindTokenPathResult {
  sceneId: string;
  tokenId: string;
  /**
   * The path from the token's position. The core's own pathfinder does not route around walls: it returns the
   * straight path cut at the first obstacle. A module may install a real one.
   */
  waypoints: TokenPathWaypoint[];
  /** The path reaches the last requested waypoint. */
  complete: boolean;
}

export interface TokenMovementHistoryEntry {
  x: number;
  y: number;
  elevation: number;
  action: string;
  movementId: string;
  userId: string | null;
  /** Cost of the move to this waypoint; null = impassable or unknown. */
  cost: number | null;
  checkpoint: boolean;
  explicit: boolean;
  snapped: boolean;
}

export interface GetTokenMovementHistoryResult {
  sceneId: string;
  tokenId: string;
  /** Recorded only while the token's combatant is in a started combat. */
  waypoints: TokenMovementHistoryEntry[];
  /** Sum of the recorded costs; null when one is impassable or unknown. */
  cost: number | null;
  /** The recorded movements, oldest first. */
  movementIds: string[];
}

export interface RevertTokenMovementParams extends TokenMovementParams {
  /** The movement to undo, together with every later one; default: the last recorded movement. */
  movementId?: string;
}

export interface RevertTokenMovementResult extends TokenMovementSnapshot {
  reverted: boolean;
}

export interface ClearTokenMovementHistoryParams {
  /** The scene of `tokenId`, or the scene whose tokens are cleared; default: the active scene. */
  sceneId?: string | null;
  /** Only this token. */
  tokenId?: string | null;
  /** The tokens of this combat's combatants, on whatever scene; not together with `tokenId`. */
  combatId?: string | null;
}

export interface ClearTokenMovementHistoryResult {
  scope: 'token' | 'scene' | 'combat';
  sceneId: string | null;
  combatId: string | null;
  /** The tokens whose history was cleared; tokens without a history are left alone. */
  tokenIds: string[];
}

/** Selection and targets act for the GM user on the GM's canvas, so only tokens of the viewed scene count. */
export interface SelectTokensParams {
  /** Tokens of the viewed scene; `[]` with `releaseOthers` releases the whole selection. */
  tokenIds: string[];
  /** Release the tokens selected so far. Default true. */
  releaseOthers?: boolean;
}

export interface SelectTokensResult {
  /** The scene on the GM's canvas. */
  sceneId: string;
  /** Every token selected now. */
  selected: string[];
}

export type GetSelectedTokensParams = Record<string, never>;

export interface SelectedTokenEntry {
  id: string;
  name: string;
  actorId: string | null;
}

export interface GetSelectedTokensResult {
  /** The scene on the GM's canvas; null when the canvas shows none. */
  sceneId: string | null;
  tokens: SelectedTokenEntry[];
}

export interface SetTargetsParams {
  /** The whole new target set, tokens of the viewed scene; `[]` clears it. */
  tokenIds: string[];
}

export interface SetTargetsResult {
  sceneId: string;
  /** Every token targeted now. */
  targets: string[];
}

export interface ShowSpeechBubbleParams {
  sceneId?: string | null;
  tokenId: string;
  /** Plain text, 1–1000 characters; HTML and enricher syntax are shown literally. */
  text: string;
  /** Let clients pan to the speaker (each client's own setting still decides). Default true. */
  pan?: boolean;
  /** Only clients that can see the token show the bubble. Default false. */
  requireVisible?: boolean;
}

export interface ShowSpeechBubbleResult {
  sceneId: string;
  tokenId: string;
  /**
   * The GM's canvas showed the bubble. Other clients show it when they view the token's scene and have chat bubbles
   * enabled in their settings.
   */
  shownHere: boolean;
}

// Walls: proximity thresholds, door sounds, door animation; note details

export type WallProximity = 'proximity' | 'reverse-proximity';

export interface WallSenseThreshold {
  /**
   * `proximity`: the wall does not restrict the sense for a source nearer than `distance`; `reverse-proximity`: for a
   * source farther than `distance`; null: the plain restriction (`sense`, `light`, `sound`) applies. A proximity
   * sense reads `normal` in that plain field.
   */
  proximity: WallProximity | null;
  /** Distance units; null = none. */
  distance: number | null;
}

export interface WallThreshold {
  light: WallSenseThreshold;
  sight: WallSenseThreshold;
  sound: WallSenseThreshold;
  /** Light and sound fade across the threshold instead of stopping at it. */
  attenuation: boolean;
}

export interface WallSenseThresholdChanges {
  /**
   * Sets the sense's restriction too, so it may not be combined with that plain field in one request; null returns a
   * proximity sense to `normal`.
   */
  proximity?: WallProximity | null;
  /** > 0; null clears. A proximity sense needs a distance. */
  distance?: number | null;
}

export interface WallThresholdChanges {
  light?: WallSenseThresholdChanges;
  sight?: WallSenseThresholdChanges;
  sound?: WallSenseThresholdChanges;
  attenuation?: boolean;
}

export interface WallDoorAnimation {
  /** A key of `CONFIG.Wall.animationTypes` (core: ascend, descend, slide, swing, swivel). */
  type: string;
  /** Opens the other way. */
  reverse: boolean;
  /** Two leaves opening from the middle. */
  double: boolean;
  /** Milliseconds. */
  duration: number;
  /** Mirrors the door image. */
  flip: boolean;
  /** 0–2. */
  strength: number;
  /** Image of the door; null = none. */
  texture: string | null;
}

/** Partial; out-of-range values are rejected, not clamped. */
export interface WallDoorAnimationChanges {
  /** Checked against the running world. */
  type?: string;
  reverse?: boolean;
  double?: boolean;
  /** Integer > 0. */
  duration?: number;
  flip?: boolean;
  /** 0–2 in steps of 0.05. */
  strength?: number;
  texture?: string | null;
}

/** Wall fields beyond the plain restrictions; each is omitted on a core that does not store it. */
export interface WallDetails {
  /** Foundry 11+. */
  threshold?: WallThreshold;
  /** A key of `CONFIG.Wall.doorSounds` (see `get-door-sounds`); null = no sound. Foundry 11+. */
  doorSound?: string | null;
  /** How the door opens on the canvas; null = not configured. Foundry 13+. */
  animation?: WallDoorAnimation | null;
}

export interface WallDetailChanges {
  threshold?: WallThresholdChanges;
  /** A key of `CONFIG.Wall.doorSounds`, checked against the running world; null or `''` removes the sound. */
  doorSound?: string | null;
  /** Partial; null removes the animation. Foundry 13+; refused on older cores. */
  animation?: WallDoorAnimationChanges | null;
}

export type GetDoorSoundsParams = Record<string, never>;

export interface DoorSoundEntry {
  /** The value for `doorSound` of `create-wall` / `update-wall`. */
  id: string;
  /** Localized name. */
  label: string;
}

export interface GetDoorSoundsResult {
  /** The sounds the running world registers in `CONFIG.Wall.doorSounds`, modules included. */
  sounds: DoorSoundEntry[];
}

/** Note fields beyond the label and icon; each is omitted on a core that does not store it. */
export interface NoteDetails {
  /** Distance units. */
  elevation?: number;
  /** Stacking order among the scene's notes; integer. */
  sort?: number;
  /** null = the core's default font. */
  fontFamily?: string | null;
  /** Protected from edits on the canvas. Foundry 14+. */
  locked?: boolean;
  /** Ids of the scene levels the note belongs to; empty = every level. Foundry 14+. */
  levels?: string[];
}

export interface NoteDetailChanges {
  elevation?: number;
  /** Integer. */
  sort?: number;
  /** A font family name; null or `''` = the core's default font. */
  fontFamily?: string | null;
  /** Foundry 14+; refused on older cores. */
  locked?: boolean;
  /** Replaces the whole set; every id must be a level of the scene; `[]` = every level. Foundry 14+; refused on older cores. */
  levels?: string[];
}

// Active effects: full snapshots (`get-actor-effect`) and effects on items

/**
 * How an effect changes its target: `custom`, `multiply`, `add`, `downgrade`,
 * `upgrade`, `override`; Foundry 14 adds `subtract` and system-registered types.
 */
export type ActiveEffectChangeType = string;

export type ActiveEffectDurationUnit =
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'months'
  | 'years'
  | 'rounds'
  | 'turns';

/** Foundry 14+: when the effect icon shows on its tokens. */
export type ActiveEffectIconVisibility = 'never' | 'conditional' | 'always';

export interface ActiveEffectChange {
  /** The attribute path the change targets, e.g. `system.attributes.ac.bonus`. */
  key: string;
  type: ActiveEffectChangeType;
  /** As stored: always a string on Foundry 13, any JSON value on Foundry 14. */
  value: unknown;
  /** null when the core default priority of the type applies. */
  priority: number | null;
  /** Foundry 14+: the application phase (`initial`, `final`, or system-registered). Omitted on older cores. */
  phase?: string;
}

export interface ActiveEffectDuration {
  /** The length in `units`; null on Foundry 14 for an effect that only waits for its `expiry` event. */
  value: number | null;
  units: ActiveEffectDurationUnit;
  /** Foundry 14+: the event at which the effect ends once its time has run out; null when none. Omitted on older cores. */
  expiry?: string | null;
  /** Foundry 14+: whether the core has marked the effect expired. Omitted on older cores. */
  expired?: boolean;
  /** Foundry 13 and older: turns the effect lasts on top of `value` rounds. Omitted when there are none. */
  extraTurns?: number;
}

/** One ActiveEffect as the core stores it. */
export interface ActiveEffectDetails {
  id: string;
  name: string;
  /** null when the effect has no icon of its own. */
  img: string | null;
  /** The effect subtype (`base` unless the system registers others). */
  type: string;
  disabled: boolean;
  /** For an effect on an item: whether it applies to the actor that owns the item. Always false on an actor. */
  transfer: boolean;
  /** HTML; empty when there is none. */
  description: string;
  /** `#rrggbb`. */
  tint: string;
  /** The UUID of the document the effect came from; null when none. */
  origin: string | null;
  statuses: string[];
  sort: number;
  changes: ActiveEffectChange[];
  /** null for a permanent effect. */
  duration: ActiveEffectDuration | null;
  /** Foundry 14+. Omitted on older cores. */
  showIcon?: ActiveEffectIconVisibility;
  /** Type data of the effect's subtype, opaque to the bridge. On Foundry 14 its `changes` list is reported as `changes`. */
  system: Record<string, unknown>;
}

export interface ActiveEffectChangeInput {
  key: string;
  /** Checked against the change types the running core and system register. */
  type: ActiveEffectChangeType;
  /** Stored as a string on Foundry 13. */
  value: string | number | boolean;
  priority?: number | null;
  /** Foundry 14+ only. */
  phase?: string;
}

export interface ActiveEffectDurationInput {
  /** A whole number, at least 1. */
  value: number;
  /** Foundry 13 stores only `seconds`, `rounds` and `turns`. */
  units: ActiveEffectDurationUnit;
  /** Foundry 14+ only: the expiry event (`turnStart`, `turnEnd`, `roundEnd`, …); default `turnStart`, null for none. */
  expiry?: string | null;
}

/** Attributes of a new or updated effect; an omitted one keeps the core default (create) or its value (update). */
export interface ActiveEffectAttributes {
  /** null clears the icon. */
  img?: string | null;
  disabled?: boolean;
  /** Whether an item's effect applies to the actor that owns the item; the core default is true. */
  transfer?: boolean;
  /** HTML; an empty string clears it. */
  description?: string;
  /** `#rrggbb` (`#rgb` is expanded). */
  tint?: string;
  /** A document UUID; null clears it. Foundry 14 refuses anything else. */
  origin?: string | null;
  /** Replaces the whole set. */
  statuses?: string[];
  /** An integer. */
  sort?: number;
  /** Replaces the whole list. */
  changes?: ActiveEffectChangeInput[];
  /** null makes the effect permanent. */
  duration?: ActiveEffectDurationInput | null;
  /** Foundry 14+ only. */
  showIcon?: ActiveEffectIconVisibility;
  /** Type data, merged into the stored one on update. */
  system?: Record<string, unknown>;
}

/**
 * The item an item-effect command addresses: `itemId` alone names a world item;
 * with `actorId` — or `tokenId` (+ `sceneId`) for one token's own actor — it
 * names an item that actor owns.
 */
export interface ItemEffectAddress {
  itemId: string;
  actorId?: string | null;
  tokenId?: string | null;
  /** The token's scene; the active scene when omitted. */
  sceneId?: string | null;
}

/** Where an item-effect command acted: the owning actor fields are null for a world item. */
export interface ItemEffectOwner {
  itemId: string;
  actorId: string | null;
  tokenId: string | null;
  sceneId: string | null;
}

export type GetItemEffectsParams = ItemEffectAddress;

export interface ItemEffectsResult extends ItemEffectOwner {
  itemName: string;
  effects: ActiveEffectDetails[];
}

export interface CreateItemEffectParams extends ItemEffectAddress, ActiveEffectAttributes {
  name: string;
  /** The effect subtype; checked against the world's registered types. Default `base`. */
  type?: string;
}

export interface UpdateItemEffectParams extends ItemEffectAddress, ActiveEffectAttributes {
  effectId: string;
  name?: string;
}

export interface DeleteItemEffectParams extends ItemEffectAddress {
  effectId: string;
}

export type ItemEffectResult = ActiveEffectDetails & ItemEffectOwner;

export interface DeleteItemEffectResult extends ItemEffectOwner {
  deleted: true;
  effectId: string;
}

export interface GetActorEffectParams {
  /** World actor id. Either this or `tokenId` is required. */
  actorId?: string | null;
  /** A token's actor instead (unlinked tokens keep their own effects). */
  tokenId?: string | null;
  /** Scene the token is on; defaults to the active scene. */
  sceneId?: string | null;
  effectId: string;
}

export type ActorEffectResult = ActiveEffectDetails & {
  actorId: string;
  /** The token the actor was reached through; null for a world actor. */
  tokenId: string | null;
  sceneId: string | null;
};

// Roll tables — previews, results, folders
/** A result's type on the wire, as `get-roll-table` reports it: 0 text, 1 world document, 2 compendium entry. */
export type TableResultTypeCode = 0 | 1 | 2;

/** One roll a draw made. */
export interface TableRollSummary {
  formula: string;
  total: number;
}

/**
 * Rolls the table (`RollTable#roll`) without drawing: no chat card, no row
 * marked as drawn. Like every roll of the core, a table without a formula is
 * normalized and saved first.
 */
export interface PreviewTableRollParams {
  tableId: string;
  /** A formula rolled instead of the table's own (`1d20+5`): at most 200 characters and 100 dice, no `@` references. */
  formula?: string;
  /** Roll the inner tables a result points to; default true. */
  recursive?: boolean;
}

export interface PreviewTableRollResult {
  tableId: string;
  tableName: string;
  roll: TableRollSummary;
  /** The rows the roll lands on, left undrawn. Drawn rows are never landed on; empty when no row can be reached. */
  results: TableResultData[];
}

/** Gives each row a range as wide as its weight, in row order from 1, and sets the formula to `1d<total weight>`. */
export interface NormalizeRollTableParams {
  tableId: string;
}

/** `RollTable.fromFolder`: a new table at the root, named after the folder, one weight-1 document row per document. */
export interface CreateRollTableFromFolderParams {
  /** A folder of world documents (actors, items, scenes, journal entries, playlists, roll tables, cards, macros); its direct contents become the rows. */
  folderId: string;
}

export interface CreateTableResultParams {
  tableId: string;
  /** The row's text; the label of a document row. */
  text: string;
  /** The inclusive span of integer roll totals the row answers to, low first. */
  range: [number, number];
  /** A positive integer; default 1. */
  weight?: number;
  /** Default 0 (text). A document reference needs 1 (world document) or 2 (compendium entry). */
  type?: TableResultTypeCode;
  /** Given together with `documentId`: the document type of a world document (`Actor`), the pack id of a compendium entry (`dnd5e.items`). */
  documentCollection?: string;
  documentId?: string;
  img?: string;
}

export interface UpdateTableResultParams {
  tableId: string;
  resultId: string;
  text?: string;
  range?: [number, number];
  weight?: number;
  /** Changing a row to 0 (text) drops its document reference. */
  type?: TableResultTypeCode;
  /** Set together with `documentId`; both null drop the reference. */
  documentCollection?: string | null;
  documentId?: string | null;
  /** null clears it. */
  img?: string | null;
  drawn?: boolean;
}

export interface TableResultEntryResult {
  tableId: string;
  result: TableResultData;
}

export interface DeleteTableResultParams {
  tableId: string;
  resultId: string;
}

export interface DeleteTableResultResult {
  deleted: true;
  tableId: string;
  resultId: string;
}

// Playlists — management
export type PlaylistSorting = 'alphabetical' | 'manual';
export type PlaylistStepDirection = 'next' | 'previous';

export interface PlaylistSoundSnapshot extends PlaylistSoundSummary {
  description: string | null;
  /** null: the sound plays on its playlist's channel. */
  channel: PlaylistChannel | null;
  /** Fade in / out in milliseconds; null: the playlist's fade. */
  fade: number | null;
  sort: number;
}

/** `get-playlist`'s detail plus the folder id, the sorting mode and fuller sounds. */
export interface PlaylistSnapshot extends PlaylistDetail {
  folderId: string | null;
  sorting: PlaylistSorting;
  sounds: PlaylistSoundSnapshot[];
}

export interface CreatePlaylistParams {
  name: string;
  description?: string;
  /** Default sequential. */
  mode?: PlaylistMode;
  /** Default music. */
  channel?: PlaylistChannel;
  /** Fade in / out of its sounds in milliseconds, a positive integer. */
  fade?: number;
  /** Default alphabetical. */
  sorting?: PlaylistSorting;
  /** A Playlist folder; absent, null or empty: the root. */
  folderId?: string | null;
}

export interface UpdatePlaylistParams {
  playlistId: string;
  name?: string;
  /** null clears it. */
  description?: string | null;
  /** A different mode stops the playlist, as the core's mode button does. */
  mode?: PlaylistMode;
  /** A different channel stops the playlist (the core does it). */
  channel?: PlaylistChannel;
  /** A positive integer of milliseconds; null clears it. */
  fade?: number | null;
  sorting?: PlaylistSorting;
  /** A Playlist folder; null moves the playlist to the root. */
  folderId?: string | null;
}

export interface DeletePlaylistParams {
  playlistId: string;
}

export interface DeletePlaylistResult {
  deleted: true;
  playlistId: string;
}

export interface UpdatePlaylistSoundParams {
  playlistId: string;
  soundId: string;
  name?: string;
  /** An audio file (aac, flac, m4a, mid, mp3, ogg, opus, wav, webm); a new path restarts a playing sound. */
  path?: string;
  /** null clears it. */
  description?: string | null;
  /** 0–1. A playing sound fades to it on every client. */
  volume?: number;
  repeat?: boolean;
  /** Milliseconds, an integer of 0 or more; null: the playlist's fade. */
  fade?: number | null;
  /** null: the playlist's channel. */
  channel?: PlaylistChannel | null;
  /** An integer. */
  sort?: number;
}

export interface PlaylistSoundResult {
  playlistId: string;
  sound: PlaylistSoundSnapshot;
}

export interface DeletePlaylistSoundParams {
  playlistId: string;
  soundId: string;
}

export interface DeletePlaylistSoundResult {
  deleted: true;
  playlistId: string;
  soundId: string;
}

export interface PlayNextInPlaylistParams {
  playlistId: string;
  /** Default next. */
  direction?: PlaylistStepDirection;
}

export interface PlayNextInPlaylistResult {
  playlistId: string;
  /** The sound playing now. */
  sound: PlaylistSoundSnapshot | null;
}

export interface ImportPlaylistSoundsParams {
  playlistId: string;
  /** 1–100 audio file paths; each becomes a sound named after its file. */
  paths: string[];
}

export interface ImportPlaylistSoundsResult {
  playlistId: string;
  /** The sounds created. */
  sounds: PlaylistSoundSnapshot[];
  /** Requested paths that did not become a sound (not an audio file, or already in the playlist); a path given twice counts once. */
  skipped: string[];
}

// Hotbar (User#hotbar: 5 pages of 10 slots)
export interface HotbarSlot {
  /** 1–50: slots 1–10 are page 1, 11–20 page 2, and so on. */
  slot: number;
  /** 1–5. */
  page: number;
  macroId: string;
  /** Null when the slot still holds the id of a macro that was deleted. */
  macroName: string | null;
  macroType: MacroType | null;
}

export interface HotbarSnapshot {
  userId: string;
  userName: string;
  /** Only the slots that hold a macro, in slot order. */
  slots: HotbarSlot[];
}

export interface GetHotbarParams {
  /** The user whose hotbar is read; absent, null or '' = the GM user the module runs as. */
  userId?: string | null;
  /** 1–5: only that page's slots. Absent = every page. */
  page?: number;
}

export interface GetHotbarResult extends HotbarSnapshot {
  page: number | null;
}

export interface AssignHotbarSlotParams {
  macroId: string;
  /** 1–50. Absent = the first free slot, as the core picks it. The macro in the slot is replaced. */
  slot?: number;
  userId?: string | null;
}

export interface AssignHotbarSlotResult extends HotbarSnapshot {
  slot: number;
  /** What the slot held before; null when it was empty. */
  replacedMacroId: string | null;
}

/** Moves the macro of `fromSlot` to `toSlot`; whatever `toSlot` held moves to `fromSlot`, as a drag on the hotbar does. */
export interface MoveHotbarSlotParams {
  fromSlot: number;
  toSlot: number;
  userId?: string | null;
}

export interface MoveHotbarSlotResult extends HotbarSnapshot {
  fromSlot: number;
  toSlot: number;
  macroId: string;
  /** The macro that was in `toSlot` and now sits in `fromSlot`; null when `toSlot` was empty. */
  swappedMacroId: string | null;
}

export interface ClearHotbarSlotParams {
  slot: number;
  userId?: string | null;
}

export interface ClearHotbarSlotResult extends HotbarSnapshot {
  slot: number;
  /** Null when the slot was already empty. */
  clearedMacroId: string | null;
}

// World info (additive fields of get-world-info)
export interface WorldModuleSummary {
  id: string;
  title: string;
  version: string;
}

export interface WorldUserSummary {
  id: string;
  name: string;
  isGM: boolean;
  /** Connected right now. */
  active: boolean;
}

export interface WorldActiveScene {
  id: string;
  name: string;
}

// Calendar (Foundry 13+: game.time.calendar, CONFIG.time.worldCalendarConfig)

/**
 * A world time read on the world calendar, the way the core decomposes it.
 * Names are localized.
 */
export interface CalendarDate {
  worldTime: number;
  /** Completed years since year 0, as the core counts and prints them (`yearZero` is not applied). */
  year: number;
  /** 1-based position of the month in `get-calendar`'s `months`. */
  month: number;
  monthName: string;
  /** Day of the month, 1-based. */
  day: number;
  /** Day of the year, 1-based. */
  dayOfYear: number;
  weekday: string;
  hour: number;
  minute: number;
  second: number;
  /** Null when no season of the calendar covers the date. */
  season: string | null;
  leapYear: boolean;
  /** The core's `timestamp` formatter (a system may replace it). */
  formatted: string;
}

/** A calendar date to resolve into a world time. `month` and `day` are 1-based; omitted time parts are 0. */
export interface CalendarDateInput {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
}

/** A span of calendar time; each part is an integer and may be negative. Day length follows the calendar. */
export interface CalendarDuration {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

export interface CalendarDurationBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface CalendarMonthInfo {
  name: string;
  abbreviation: string | null;
  ordinal: number;
  days: number;
  /** Days in a leap year; null = the same as `days`. */
  leapDays: number | null;
}

export interface CalendarWeekdayInfo {
  name: string;
  abbreviation: string | null;
  ordinal: number;
}

/** A season spans either ordinal months or days of the year (1-based); the other pair is null. */
export interface CalendarSeasonInfo {
  name: string;
  abbreviation: string | null;
  monthStart: number | null;
  monthEnd: number | null;
  dayStart: number | null;
  dayEnd: number | null;
}

export interface CalendarDefinitionInfo {
  name: string;
  description: string | null;
  yearZero: number;
  /** Index into `weekdays` of the weekday at world time 0. */
  firstWeekday: number;
  leapYear: { leapStart: number; leapInterval: number } | null;
  months: CalendarMonthInfo[];
  weekdays: CalendarWeekdayInfo[];
  seasons: CalendarSeasonInfo[];
  daysPerYear: number;
  hoursPerDay: number;
  minutesPerHour: number;
  secondsPerMinute: number;
}

export type GetCalendarParams = Record<string, never>;

export interface GetCalendarResult {
  calendar: CalendarDefinitionInfo;
  now: CalendarDate;
}

/** Each end is a world time or a calendar date, never both; the start defaults to now. */
export interface GetTimeDifferenceParams {
  fromWorldTime?: number;
  fromDate?: CalendarDateInput;
  toWorldTime?: number;
  toDate?: CalendarDateInput;
}

export interface GetTimeDifferenceResult {
  from: CalendarDate;
  to: CalendarDate;
  /** `to` minus `from`; negative when `to` is earlier. */
  seconds: number;
  /** The absolute difference in whole calendar days, hours, minutes and seconds. */
  duration: CalendarDurationBreakdown;
}

// Progress notifications (Foundry 13+; shown in the GM's browser only; messages are cleaned of HTML)
export interface CreateProgressNotificationParams {
  message: string;
  type?: NotifyType;
  /** 0–1. */
  pct?: number;
  /** Stays after reaching 100 % until removed. */
  permanent?: boolean;
  /** Also log to the browser console (core default: true). */
  console?: boolean;
}

export interface CreateProgressNotificationResult {
  notificationId: number;
  type: NotifyType;
  pct: number;
}

/** At least one of `message` and `pct`. At `pct` 1 a non-permanent notification closes half a second later. */
export interface UpdateProgressNotificationParams {
  notificationId: number;
  message?: string;
  /** 0–1. */
  pct?: number;
}

export interface UpdateProgressNotificationResult {
  notificationId: number;
  /** What was applied; null for a part that was not changed. */
  pct: number | null;
  message: string | null;
  /** True once `pct` reached 1. */
  completed: boolean;
}

export interface RemoveNotificationParams {
  notificationId: number;
}

export interface RemoveNotificationResult {
  removed: true;
  notificationId: number;
}

// Grid and canvas helpers

export type GridDiagonalRule =
  | 'equidistant'
  | 'exact'
  | 'approximate'
  | 'rectilinear'
  | 'alternating1'
  | 'alternating2'
  | 'illegal';

export type GridSnappingMode =
  | 'center'
  | 'edgeMidpoint'
  | 'vertex'
  | 'topLeftVertex'
  | 'topRightVertex'
  | 'bottomLeftVertex'
  | 'bottomRightVertex'
  | 'corner'
  | 'topLeftCorner'
  | 'topRightCorner'
  | 'bottomLeftCorner'
  | 'bottomRightCorner'
  | 'sideMidpoint'
  | 'topSideMidpoint'
  | 'bottomSideMidpoint'
  | 'leftSideMidpoint'
  | 'rightSideMidpoint';

/** A point in scene pixels. */
export interface GridPathWaypoint {
  x: number;
  y: number;
  /** Grid units (Foundry 13+). */
  elevation?: number;
  /** Jump to this waypoint: its segment is measured but costs nothing. */
  teleport?: boolean;
}

/** Measured on the scene's grid with the world's diagonal rule; no canvas needed. */
export interface MeasureGridPathParams {
  sceneId?: string | null;
  /** 2–100 waypoints. */
  waypoints: GridPathWaypoint[];
}

export interface GridPathMeasurement {
  /** Grid units. */
  distance: number;
  /** Movement cost of the direct path (the distance unless teleported). */
  cost: number;
  /** Grid spaces moved; always 0 on a gridless scene. */
  spaces: number;
  diagonals: number;
  /** Straight-line length in grid units. */
  euclidean: number;
}

export interface MeasureGridPathResult extends GridPathMeasurement {
  sceneId: string;
  gridType: SceneGridType;
  units: string;
  /** Null on a gridless scene. */
  diagonalRule: GridDiagonalRule | null;
  segments: GridPathMeasurement[];
}

export interface SnapToGridParams {
  sceneId?: string | null;
  x: number;
  y: number;
  /** One mode or several (the nearest candidate of any wins). */
  mode: GridSnappingMode | GridSnappingMode[];
  /** Subdivisions of a grid space, a positive integer (default 1). */
  resolution?: number;
}

export interface SnapToGridResult {
  sceneId: string;
  x: number;
  y: number;
}

export type GetCanvasViewParams = Record<string, never>;

/** The GM's own view of the canvas. */
export interface GetCanvasViewResult {
  sceneId: string;
  sceneName: string;
  /** View center in scene pixels. */
  x: number;
  y: number;
  scale: number;
  visibleArea: { x: number; y: number; width: number; height: number };
  /** Foundry 14+: the viewed scene level. */
  levelId?: string | null;
}

export type ScrollingTextAnchor = 'center' | 'top' | 'bottom' | 'left' | 'right';

/**
 * Scrolling text on the GM's canvas only: the core does not broadcast it, so
 * players never see it.
 */
export interface ShowScrollingTextParams {
  x: number;
  y: number;
  /** Plain text, 1–200 characters. */
  text: string;
  /** `#rrggbb`. */
  color?: string;
  /** Pixels, 8–128. */
  fontSize?: number;
  anchor?: ScrollingTextAnchor;
  /** Direction the text scrolls in (default top). */
  direction?: ScrollingTextAnchor;
  /** Milliseconds, 200–10000 (default 2000). */
  duration?: number;
  /** Random offset of the start position, 0–1. */
  jitter?: number;
}

export interface ShowScrollingTextResult {
  /** False when the world setting "Scrolling Status Text" is off. */
  shown: boolean;
  sceneId: string;
  x: number;
  y: number;
}

/** Any document the documents commands address by uuid: world, embedded or compendium. */
export interface DocumentReference {
  uuid: string;
  /** The core document name: `Actor`, `JournalEntryPage`, `Folder`, … */
  documentType: string;
  id: string;
  /** Null for documents without a name (walls, tiles, …). */
  name: string | null;
  /** The compendium pack holding the document; null for world documents. Compendium documents are read-only here. */
  packId: string | null;
  /** The parent of an embedded document (an actor's item, a journal's page); null for primary documents. */
  parentUuid: string | null;
}

/**
 * `inherit` (defer to the parent document) applies to embedded documents only, e.g. journal pages; `none` hides the
 * document; `owner` lets the user edit it.
 */
export type DocumentOwnershipLevel = 'inherit' | 'none' | 'limited' | 'observer' | 'owner';

export interface DocumentUserOwnership {
  userId: string;
  /** Null for an entry of a user who no longer exists. */
  userName: string | null;
  level: DocumentOwnershipLevel;
}

export interface GetDocumentOwnershipParams {
  uuid: string;
}

/** The ownership stored on the document. A user without an entry gets `defaultLevel`; a GM is always owner. */
export interface DocumentOwnershipResult extends DocumentReference {
  defaultLevel: DocumentOwnershipLevel;
  /** Explicit per-user entries only. */
  users: DocumentUserOwnership[];
}

export interface SetDocumentOwnershipParams {
  /** A world document whose type has ownership (Actor, Item, JournalEntry and its pages, RollTable, Scene, Cards, Macro, Playlist, CombatantGroup; Region on Foundry 14). */
  uuid: string;
  defaultLevel?: DocumentOwnershipLevel;
  /** User id → level. `null` removes the user's entry so `defaultLevel` applies. Unlisted users are kept. */
  users?: Record<string, DocumentOwnershipLevel | null>;
}

export interface GetDocumentFlagsParams {
  uuid: string;
  /** One flag scope (`core`, `world`, the system id or a module id); absent = every scope. */
  scope?: string | null;
}

export interface GetDocumentFlagsResult extends DocumentReference {
  scope: string | null;
  /** The flags of `scope` (`{}` when it has none), or every scope keyed by scope name. */
  flags: Record<string, unknown>;
}

export interface SetDocumentFlagParams {
  /** A world document; compendium documents are read-only. */
  uuid: string;
  /** `core`, `world`, the world's system id or an active module id. */
  scope: string;
  /** A flag key; dots address nested keys (`a.b`). */
  key: string;
  /** Any JSON value up to 64 KiB. An object is merged into an existing object flag (core `setFlag`); unset it first to replace it. */
  value: unknown;
}

export interface SetDocumentFlagResult extends DocumentReference {
  scope: string;
  key: string;
  /** The value now stored. */
  value: unknown;
}

export interface UnsetDocumentFlagParams {
  uuid: string;
  scope: string;
  key: string;
}

export interface UnsetDocumentFlagResult extends DocumentReference {
  unset: true;
  scope: string;
  key: string;
  /** False when there was no such flag (nothing changed). */
  existed: boolean;
}

export type DocumentSortPosition = 'before' | 'after';

export interface SortDocumentParams {
  /** A world document whose type has a sort order: a sidebar document, a folder, or an embedded one (item, page, card, tile, …). */
  uuid: string;
  /** A sibling of the same type: same folder (sidebar documents, folders) or same parent (embedded documents). */
  targetUuid: string;
  position: DocumentSortPosition;
}

/** Only visible where the container sorts manually; an alphabetically sorted folder ignores `sort`. */
export interface SortDocumentResult extends DocumentReference {
  sort: number;
  targetUuid: string;
  position: DocumentSortPosition;
}

/** `ActiveEffect` is indexed on Foundry 14 only. */
export type SearchableDocumentType =
  | 'ActiveEffect'
  | 'Actor'
  | 'Card'
  | 'Cards'
  | 'Item'
  | 'JournalEntry'
  | 'JournalEntryPage'
  | 'Macro'
  | 'Playlist'
  | 'PlaylistSound'
  | 'RollTable'
  | 'Scene';

export type DocumentSearchSource = 'all' | 'world' | 'compendiums';

/**
 * A name lookup in the core document index (`game.documentIndex`), not a full-text search. Foundry 13 and older match
 * the query as a prefix of the whole name ("gob" finds "Goblin Boss", "boss" does not); Foundry 14 matches every word
 * of the query as a prefix of some word of the name ("boss gob" finds it, one-letter words are ignored). Case is
 * ignored. The index holds the names of world documents with their embedded items, pages, cards and sounds, and the
 * index entries of compendium packs; it never looks into descriptions, journal text or system data.
 */
export interface SearchDocumentsParams {
  query: string;
  /** Default: every indexed type. */
  documentTypes?: SearchableDocumentType[];
  /** Default `all`. */
  source?: DocumentSearchSource;
  /** Most matches per document type, 1–100, default 10. */
  limit?: number;
}

export interface DocumentSearchHit {
  uuid: string;
  id: string;
  name: string;
  documentType: string;
  /** The document's own type (`npc`, `weapon`, `text`, …); null for untyped documents. */
  subtype: string | null;
  packId: string | null;
  /** The sidebar folder, or the pack folder of a compendium entry; null at the root and for embedded documents. */
  folderId: string | null;
  parentUuid: string | null;
}

export interface SearchDocumentsResult {
  query: string;
  results: DocumentSearchHit[];
}

/** The document types `export-document` and `import-document` accept; never User, Setting, ChatMessage, FogExploration. */
export type TransferableDocumentType =
  | 'Actor'
  | 'Cards'
  | 'Item'
  | 'JournalEntry'
  | 'Macro'
  | 'Playlist'
  | 'RollTable'
  | 'Scene';

export interface ExportDocumentParams {
  /** A world, compendium or actor-owned document of a transferable type. */
  uuid: string;
}

export interface ExportDocumentResult extends DocumentReference {
  /** What the core "Export Data" writes: the document without id, sort, explicit user ownership and state, with `_stats.exportSource`. At most 8 MiB. */
  data: Record<string, unknown>;
}

export interface ImportDocumentParams {
  documentType: TransferableDocumentType;
  /** Exported document data (see `export-document`); older core versions are migrated by the server, newer ones refused. At most 8 MiB. */
  data: Record<string, unknown>;
  /** A folder of the same document type; absent = the sidebar root. */
  folderId?: string | null;
}

/** The new world document: a fresh id, no sort, default ownership `none` with the GM as owner. */
export interface ImportDocumentResult extends DocumentReference {
  folderId: string | null;
}

// Compendium management — world packs, writing into packs, bulk imports and adventures.

/** A compendium pack's document type (`CONST.COMPENDIUM_DOCUMENT_TYPES`; `ActiveEffect` only on Foundry 14+). */
export type CompendiumPackDocumentType =
  | 'ActiveEffect'
  | 'Actor'
  | 'Adventure'
  | 'Cards'
  | 'Item'
  | 'JournalEntry'
  | 'Macro'
  | 'Playlist'
  | 'RollTable'
  | 'Scene';

/** `inherit`: the same level as the role below (for `player`: none). */
export type CompendiumOwnershipLevel = 'inherit' | 'none' | 'limited' | 'observer' | 'owner';

/** What each user role may do with a pack. Gamemasters always own every pack. */
export interface CompendiumOwnership {
  player: CompendiumOwnershipLevel;
  trusted: CompendiumOwnershipLevel;
  assistant: CompendiumOwnershipLevel;
}

export interface CompendiumFolderNode {
  id: string;
  name: string;
  /** The enclosing pack folder; null at the pack root. */
  parentId: string | null;
}

export interface CompendiumPackInfo {
  /** `<package>.<name>`, e.g. `world.monsters`. */
  id: string;
  label: string;
  documentType: string;
  system: string;
  /** `world`, `system` or `module`; only world packs can be deleted. */
  packageType: string;
  packageName: string;
  /** A locked pack refuses every write; module and system packs are locked unless configured otherwise. */
  locked: boolean;
  ownership: CompendiumOwnership;
  /** The world folder (type `Compendium`) the pack is shown in; null at the sidebar root. */
  folderId: string | null;
  documentCount: number;
  folders: CompendiumFolderNode[];
}

export interface GetCompendiumInfoParams {
  packId: string;
}

export type GetCompendiumInfoResult = CompendiumPackInfo;

export interface CreateCompendiumParams {
  /** The pack id is derived from it (`world.<slug>`); a label whose slug is taken is refused. */
  label: string;
  documentType: CompendiumPackDocumentType;
  /** A world folder of type `Compendium`; absent, null or '': the sidebar root. */
  folderId?: string | null;
}

export type CreateCompendiumResult = CompendiumPackInfo;

export interface DuplicateCompendiumParams {
  /** Any pack, a locked module or system pack included; the copy is a new unlocked world pack. */
  packId: string;
  /** Default `Copy of <label>`. */
  label?: string;
  /** A world folder of type `Compendium`; absent, null or '': the sidebar root. */
  folderId?: string | null;
}

export type DuplicateCompendiumResult = CompendiumPackInfo;

export interface ConfigureCompendiumParams {
  packId: string;
  /** Unlocking a module or system pack makes it writable, but a package update replaces its content. */
  locked?: boolean;
  /** Changes only the given roles; null resets the pack to the ownership its package declares. */
  ownership?: Partial<CompendiumOwnership> | null;
  /** A world folder of type `Compendium`; null moves the pack to the sidebar root. */
  folderId?: string | null;
}

export type ConfigureCompendiumResult = CompendiumPackInfo;

export interface DeleteCompendiumParams {
  /** A world pack (`world.*`) that is not locked. */
  packId: string;
}

export interface DeleteCompendiumResult {
  deleted: true;
  packId: string;
  label: string;
  documentCount: number;
}

export interface CompendiumDocumentRef {
  id: string;
  uuid: string;
  name: string;
  /** The document's subtype; null for document types without one. */
  type: string | null;
  img: string | null;
  /** The pack folder; null at the pack root. */
  folderId: string | null;
}

export interface ExportToCompendiumParams {
  /** An unlocked pack of a world document type (not Adventure or ActiveEffect). */
  packId: string;
  /** The world document of the pack's type to copy; it always becomes a new pack document. */
  documentId: string;
  /** The name of the copy; default the source name. */
  name?: string;
  /** A folder of the pack; absent, null or '': the pack root. */
  folderId?: string | null;
}

export interface ExportToCompendiumResult {
  packId: string;
  sourceId: string;
  document: CompendiumDocumentRef;
}

export interface ExportFolderToCompendiumParams {
  /** An unlocked pack whose type matches the folder's type. */
  packId: string;
  /** A world folder; its documents and those of its subfolders are exported. */
  folderId: string;
  /** A folder of the pack to export into; absent, null or '': the pack root. */
  packFolderId?: string | null;
  /** Recreate the subfolders inside the pack. Default false: every document lands in the target folder. */
  keepFolders?: boolean;
  /** Overwrite pack documents of the same name instead of adding copies. Default false. */
  updateByName?: boolean;
  /** Keep the world ids, overwriting pack documents with the same id. Default false. */
  keepId?: boolean;
}

export interface ExportFolderToCompendiumResult {
  packId: string;
  folderId: string;
  exportedCount: number;
  /** New pack documents. */
  createdCount: number;
  /** Pack documents overwritten (`updateByName` / `keepId`). */
  updatedCount: number;
  /** Documents in the pack afterwards. */
  documentCount: number;
}

export interface UpdateCompendiumDocumentParams {
  /** An unlocked pack. */
  packId: string;
  documentId: string;
  name?: string;
  /** A folder of the pack; null moves the document to the pack root. */
  folderId?: string | null;
  /**
   * Any other changes in the document's own source shape, the way the core's `Document#update`
   * takes them (nested objects or dot-notation keys); validated by the core data model.
   * `_id` cannot be changed; `name` and `folderId` win over `name` / `folder` given here.
   */
  changes?: Record<string, unknown>;
}

export interface UpdateCompendiumDocumentResult {
  packId: string;
  document: CompendiumDocumentRef;
}

export interface DeleteCompendiumDocumentParams {
  /** An unlocked pack. */
  packId: string;
  documentId: string;
}

export interface DeleteCompendiumDocumentResult {
  deleted: true;
  packId: string;
  documentId: string;
  name: string;
}

export interface CompendiumImportedDocument {
  id: string;
  name: string;
}

export interface CompendiumWorldFolder {
  id: string;
  name: string;
}

export interface ImportCompendiumParams {
  /**
   * A pack of a world document type; Adventure packs go through import-adventure. A large pack
   * can outlast the server's command timeout; the import still finishes inside Foundry.
   */
  packId: string;
  /** An existing world folder of the pack's type to import into. */
  folderId?: string | null;
  /** The name of the new top-level folder when `folderId` is absent; default the pack label. */
  folderName?: string;
  /**
   * Keep the pack's document ids, so references between imported documents keep working
   * (a scene's tokens to their actors). Refused when one of them already exists in the world.
   * Default false.
   */
  keepId?: boolean;
}

export interface ImportCompendiumResult {
  packId: string;
  /** The world folder that holds the import (created unless `folderId` was given). */
  folder: CompendiumWorldFolder | null;
  importedCount: number;
  documents: CompendiumImportedDocument[];
  /**
   * Script macros left in the pack because "Allow Script Macros" is off. Present (possibly empty) for a Macro pack
   * imported without the opt-in, absent otherwise.
   */
  skippedScriptMacros?: CompendiumImportedDocument[];
}

export interface ImportCompendiumFolderParams {
  /** A pack of a world document type. */
  packId: string;
  /** The pack folder to import with its subfolders and their documents. */
  packFolderId: string;
  /** An existing world folder of the pack's type to put it in; absent, null or '': the directory root. */
  folderId?: string | null;
  /** Keep the pack's document ids; refused when one of them already exists in the world. Default false. */
  keepId?: boolean;
}

export interface ImportCompendiumFolderResult {
  packId: string;
  packFolderId: string;
  /** The world folder that mirrors the pack folder (it keeps the pack folder's id). */
  folder: CompendiumWorldFolder;
  /** Folders created; folders that already exist in the world with the same id are reused. */
  createdFolderCount: number;
  importedCount: number;
  documents: CompendiumImportedDocument[];
  /**
   * Script macros of the folder left in the pack because "Allow Script Macros" is off. Present (possibly empty) for
   * a folder of a Macro pack imported without the opt-in, absent otherwise.
   */
  skippedScriptMacros?: CompendiumImportedDocument[];
}

/** A document type an adventure can contain. */
export type AdventureContentType =
  | 'Actor'
  | 'Combat'
  | 'Item'
  | 'JournalEntry'
  | 'Scene'
  | 'RollTable'
  | 'Macro'
  | 'Cards'
  | 'Playlist'
  | 'Folder';

export interface AdventureContentEntry {
  id: string;
  name: string;
  /** A world document with this id exists and an import would overwrite it. */
  existsInWorld: boolean;
}

export interface AdventureContentGroup {
  /** An {@link AdventureContentType}. */
  documentType: string;
  count: number;
  existingCount: number;
  documents: AdventureContentEntry[];
}

export interface GetAdventureParams {
  /** A pack of type Adventure. */
  packId: string;
  adventureId: string;
}

export interface GetAdventureResult {
  packId: string;
  adventureId: string;
  uuid: string;
  name: string;
  img: string | null;
  /** HTML. */
  caption: string;
  /** HTML. */
  description: string;
  /** The world recorded an import of this adventure before. */
  imported: boolean;
  /** Only the types the adventure contains. */
  contents: AdventureContentGroup[];
  totalCount: number;
  /** Documents an import would overwrite. */
  existingCount: number;
}

export interface ImportAdventureParams {
  packId: string;
  adventureId: string;
  /** Import only these types (their folders come along); absent: everything. `Folder` is not selectable. */
  documentTypes?: Exclude<AdventureContentType, 'Folder'>[];
  /**
   * The import keeps the adventure's ids, so a world document with the same id is replaced
   * entirely. Without `overwrite: true` such an import is refused before anything is written.
   */
  overwrite?: boolean;
}

export interface AdventureImportGroup {
  /** An {@link AdventureContentType}. */
  documentType: string;
  count: number;
  documents: CompendiumImportedDocument[];
}

export interface ImportAdventureResult {
  packId: string;
  adventureId: string;
  name: string;
  createdCount: number;
  updatedCount: number;
  created: AdventureImportGroup[];
  /** World documents the import replaced. */
  updated: AdventureImportGroup[];
  /**
   * Script macros of the adventure left out because "Allow Script Macros" is off. Present (possibly empty) when the
   * import brought Macro documents without the opt-in, absent otherwise.
   */
  skippedScriptMacros?: CompendiumImportedDocument[];
}

// Files

/**
 * `data`: the user data directory; `public`: the core's own assets (icons,
 * sounds, …), read-only; `s3`: an S3 bucket, when the server configures one.
 */
export type FileSourceName = 'data' | 'public' | 's3';

export interface BrowseFilesParams {
  /** Default `data`. Refused when the server does not offer the source. */
  source?: FileSourceName;
  /**
   * Directory relative to the source root, `/`-separated; absent or empty for
   * the root. The URL-encoded form the results report is accepted; `..` and
   * `.` segments are rejected.
   */
  path?: string;
  /** `s3` only: the bucket to list. Without it an `s3` browse lists the buckets as `directories`. */
  bucket?: string;
  /** Only files with these extensions (`png` or `.png`, case-insensitive); directories are always listed. */
  extensions?: string[];
  /** The last segment of `path` is a glob pattern (`*`, `?`, `[…]`) matched against the names in its directory. */
  wildcard?: boolean;
}

export interface BrowseFilesResult {
  source: FileSourceName;
  /** The directory the core listed, as it reports it (URL-encoded segments). */
  path: string;
  /** `s3` only; null otherwise. */
  bucket: string | null;
  /**
   * Paths as the core reports them — relative to the source root with
   * URL-encoded segments for `data` / `public`, full URLs for `s3` — usable as
   * document image or sound paths.
   */
  directories: string[];
  files: string[];
}

export interface CreateDirectoryParams {
  /**
   * The new directory in the `data` source, strictly inside the current
   * world's directory (`worlds/<world id>/…`) and outside its `data` / `packs`
   * database folders. Its parent must exist. Segments are decoded once; `..`,
   * `.`, `\`, `%`, control characters and `<>:"|?*` are rejected.
   */
  path: string;
}

export interface CreateDirectoryResult {
  source: 'data';
  /** The created directory, URL-encoded per segment the way the core reports paths. */
  path: string;
}

export interface UploadFileParams {
  /**
   * Target directory in the `data` source: the current world's directory or a
   * directory inside it, under the same rules as `create-directory`. It must
   * exist.
   */
  directory: string;
  /**
   * File name with extension, one segment, not starting with a dot. Allowed:
   * raster images (apng, avif, bmp, gif, jpeg, jpg, png, tiff, webp), audio
   * (aac, flac, m4a, mid, mp3, ogg, opus, wav, webm) and video (m4v, mp4, ogv,
   * webm). SVG, HTML, text, JSON, fonts and 3D models are refused: the server
   * would serve them from the Foundry origin.
   */
  fileName: string;
  /** The file content in base64 (standard alphabet, whitespace ignored), at most 20 MB decoded. */
  content: string;
  /**
   * Replace a file of the same name. Default false: an existing file is an
   * error (the core itself would overwrite a media file silently).
   */
  overwrite?: boolean;
}

export interface UploadFileResult {
  source: 'data';
  /** The stored path the core reported (relative to the data root, URL-encoded), usable as a document image or sound path. */
  path: string;
  /** Decoded size in bytes. */
  size: number;
  /** An existing file of the same name was replaced. */
  overwritten: boolean;
}

// Player dialogs

export type UserQuestionKind = 'confirm' | 'prompt' | 'choice';

/**
 * `pending`: waiting for the player. `answered`: the player submitted the
 * dialog. `dismissed`: they closed it without answering. `timeout`: no answer
 * in time. `cancelled`: `cancel-user-question` stopped the wait. `failed`: the
 * core refused the question or the reply was not a valid answer.
 */
export type UserQuestionStatus = 'pending' | 'answered' | 'dismissed' | 'timeout' | 'cancelled' | 'failed';

export interface AskUserBaseParams {
  /** The user to ask; they must be connected. */
  userId: string;
  /** Window title, plain text, at most 100 characters. */
  title: string;
  /** Plain text, at most 2000 characters; HTML is shown as typed, a blank line starts a paragraph. */
  content: string;
  /**
   * How long to wait, 10–1800 seconds; default 300. The core cannot close a
   * dialog on another user's screen: after a timeout the player still sees it
   * and a late answer is ignored.
   */
  timeoutSeconds?: number;
}

export interface AskUserConfirmParams extends AskUserBaseParams {
  /** Yes / no buttons. */
  kind: 'confirm';
  /** Plain text, at most 40 characters; default the core's "Yes". */
  yesLabel?: string;
  /** Plain text, at most 40 characters; default the core's "No". */
  noLabel?: string;
}

export interface AskUserPromptParams extends AskUserBaseParams {
  /** One input field and a confirm button. */
  kind: 'prompt';
  /** Default `text`. */
  inputType?: 'text' | 'number';
  /** Plain text label of the input, at most 100 characters. */
  inputLabel?: string;
  /** Pre-filled value: a string (at most 1000 characters) for `text`, a finite number for `number`. */
  defaultValue?: string | number;
}

export interface AskUserChoiceParams extends AskUserBaseParams {
  /** One button per choice. */
  kind: 'choice';
  /** 2–10 distinct labels, plain text, at most 60 characters each. */
  choices: string[];
}

export type AskUserParams = AskUserConfirmParams | AskUserPromptParams | AskUserChoiceParams;

export type UserQuestionAnswer =
  | { kind: 'confirm'; confirmed: boolean }
  /** A text answer is cut at 1000 characters; an empty number field reads as null. */
  | { kind: 'prompt'; value: string | number | null }
  /** `index` into the asked `choices`. */
  | { kind: 'choice'; index: number; label: string };

export interface UserQuestion {
  requestId: string;
  userId: string;
  userName: string;
  kind: UserQuestionKind;
  title: string;
  status: UserQuestionStatus;
  /** Epoch milliseconds. */
  askedAt: number;
  /** When the wait ends, epoch milliseconds. */
  expiresAt: number;
  /** When the status left `pending`, epoch milliseconds; null while pending. */
  settledAt: number | null;
  /** Set when the status is `answered`. */
  answer: UserQuestionAnswer | null;
  /** Why the question failed; null unless the status is `failed`. */
  error: string | null;
}

/**
 * Returns at once with status `pending`; poll `get-user-answer`. Questions
 * live in the memory of the GM browser: a reload forgets them, and a settled
 * question is forgotten 30 minutes after it settled. At most 5 pending
 * questions per user and 100 questions in all.
 */
export type AskUserResult = UserQuestion;

export interface GetUserAnswerParams {
  requestId: string;
}

export type GetUserAnswerResult = UserQuestion;

export interface CancelUserQuestionParams {
  requestId: string;
}

export interface CancelUserQuestionResult {
  question: UserQuestion;
  /** This call stopped a pending question; false when it had already settled. */
  cancelled: boolean;
  /** Always false: the core cannot close a dialog on another user's screen, so the player still sees it; their answer is ignored. */
  remoteDialogClosed: boolean;
}

// Event push

/** What the router knows about the connection a command arrived on. */
export interface CommandContext {
  /** The connection label: `MCP` or `API`. */
  channel: string;
}

/**
 * A pushed game event (Foundry → server). It has no `id`: it answers no
 * command. Sent only on a channel that subscribed with `subscribe-events`.
 */
export interface EventMessage {
  type: 'event';
  /** A name from `get-event-types`, e.g. `token-moved`. */
  event: string;
  data: Record<string, unknown>;
  /** Epoch milliseconds when the event happened (for a coalesced event: its last change). */
  ts: number;
  /**
   * Per channel, from 1, for every event queued for that channel; it restarts
   * after the channel reconnects. A gap means the rate guard dropped events.
   */
  seq: number;
}

export interface SubscribeEventsParams {
  /** Event names from `get-event-types`, or `['*']` for all. Added to the current subscription. */
  events: string[];
}

export interface UnsubscribeEventsParams {
  /** Event names to stop; absent (or `['*']`) stops all. */
  events?: string[];
}

export type GetEventSubscriptionsParams = Record<string, never>;
export type GetEventTypesParams = Record<string, never>;

/** The subscription of the channel the command arrived on. */
export interface EventSubscriptionResult {
  channel: string;
  /** `['*']` for all events, else the subscribed names; empty when not subscribed. */
  events: string[];
  /** Events waiting to be sent on this channel. */
  queued: number;
  /** Events dropped by the rate guard since the channel subscribed. */
  dropped: number;
  /** `seq` of the last event queued for this channel; 0 before the first. */
  lastSeq: number;
}

export interface EventTypeSummary {
  name: string;
  description: string;
}

export interface GetEventTypesResult {
  eventTypes: EventTypeSummary[];
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
  'dnd5e/filter-compendium-actors': FilterCompendiumActorsParams;
  'dnd5e/filter-compendium-items': FilterCompendiumItemsParams;
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
  'pf2e/filter-compendium-actors': Pf2eFilterCompendiumActorsParams;
  'pf2e/filter-compendium-items': Pf2eFilterCompendiumItemsParams;
  'swade/roll-attribute': SwadeRollAttributeParams;
  'swade/roll-skill': SwadeRollSkillParams;
  'swade/roll-attack': SwadeRollAttackParams;
  'swade/roll-damage': SwadeRollDamageParams;
  'swade/apply-damage': SwadeApplyDamageParams;
  'swade/soak': SwadeSoakParams;
  'swade/bennies': SwadeBenniesParams;
  'swade/set-status': SwadeSetStatusParams;
  'swade/get-actor-summary': SwadeGetActorSummaryParams;
  'swade/get-action-cards': SwadeGetActionCardsParams;
  'coc7/roll-skill': Coc7RollSkillParams;
  'coc7/roll-characteristic': Coc7RollCharacteristicParams;
  'coc7/roll-attribute': Coc7RollAttributeParams;
  'coc7/roll-attack': Coc7RollAttackParams;
  'coc7/roll-damage': Coc7RollDamageParams;
  'coc7/apply-damage': Coc7ApplyDamageParams;
  'coc7/sanity-check': Coc7SanityCheckParams;
  'coc7/bout-of-madness': Coc7BoutOfMadnessParams;
  'coc7/luck': Coc7LuckParams;
  'coc7/set-condition': Coc7SetConditionParams;
  'coc7/get-actor-summary': Coc7GetActorSummaryParams;
  'pf1/roll-ability': Pf1RollAbilityParams;
  'pf1/roll-skill': Pf1RollSkillParams;
  'pf1/roll-save': Pf1RollSaveParams;
  'pf1/roll-caster-level': Pf1RollSpellbookCheckParams;
  'pf1/roll-concentration': Pf1RollSpellbookCheckParams;
  'pf1/use-item': Pf1UseItemParams;
  'pf1/apply-damage': Pf1ApplyDamageParams;
  'pf1/set-condition': Pf1SetConditionParams;
  'pf1/get-actor-summary': Pf1GetActorSummaryParams;
  'get-world-info': GetWorldInfoParams;
  'get-actors': Record<string, never>;
  'filter-actors': FilterActorsParams;
  'filter-items': FilterItemsParams;
  'get-actor': GetActorParams;
  'create-actor': CreateActorParams;
  'create-actor-from-compendium': CreateActorFromCompendiumParams;
  'update-actor': UpdateActorParams;
  'dnd5e/apply-damage': ApplyDamageParams;
  'apply-damage': ApplyDamageParams; // alias of 'dnd5e/apply-damage'
  'dnd5e/apply-healing': ApplyHealingParams;
  'apply-healing': ApplyHealingParams; // alias of 'dnd5e/apply-healing'
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
  'resolve-uuid': ResolveUuidParams;
  'search-compendium-pages': SearchCompendiumPagesParams;
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
  'get-weather-effects': GetWeatherEffectsParams;
  'pull-users-to-scene': PullUsersToSceneParams;
  'preload-scene': PreloadSceneParams;
  'regenerate-scene-thumbnail': RegenerateSceneThumbnailParams;
  'reset-fog': ResetFogParams;
  'get-scene-levels': GetSceneLevelsParams;
  'create-scene-level': CreateSceneLevelParams;
  'update-scene-level': UpdateSceneLevelParams;
  'delete-scene-level': DeleteSceneLevelParams;
  'get-combats': GetCombatsParams;
  'activate-combat': CombatAddressParams;
  'toggle-combat-scene-link': ToggleCombatSceneLinkParams;
  'next-round': CombatAddressParams;
  'previous-round': CombatAddressParams;
  'reset-initiative': CombatAddressParams;
  'get-combatant-groups': CombatAddressParams;
  'create-combatant-group': CreateCombatantGroupParams;
  'update-combatant-group': UpdateCombatantGroupParams;
  'delete-combatant-group': DeleteCombatantGroupParams;
  'get-combat-tracker-config': GetCombatTrackerConfigParams;
  'update-combat-tracker-config': UpdateCombatTrackerConfigParams;
  'validate-roll-formula': ValidateRollFormulaParams;
  'simulate-roll': SimulateRollParams;
  'create-journal-category': CreateJournalCategoryParams;
  'update-journal-category': UpdateJournalCategoryParams;
  'delete-journal-category': DeleteJournalCategoryParams;
  'show-image': ShowImageParams;
  'pan-to-note': PanToNoteParams;
  'search-journals': SearchJournalsParams;
  'get-lights': GetLightsParams;
  'create-light': CreateLightParams;
  'update-light': UpdateLightParams;
  'delete-light': DeleteLightParams;
  'get-ambient-sounds': GetAmbientSoundsParams;
  'create-ambient-sound': CreateAmbientSoundParams;
  'update-ambient-sound': UpdateAmbientSoundParams;
  'delete-ambient-sound': DeleteAmbientSoundParams;
  'play-sound-at-position': PlaySoundAtPositionParams;
  'preload-sound': PreloadSoundParams;
  'get-tiles': GetTilesParams;
  'create-tile': CreateTileParams;
  'update-tile': UpdateTileParams;
  'delete-tile': DeleteTileParams;
  'get-drawings': GetDrawingsParams;
  'create-drawing': CreateDrawingParams;
  'update-drawing': UpdateDrawingParams;
  'delete-drawing': DeleteDrawingParams;
  'get-templates': GetTemplatesParams;
  'create-template': CreateTemplateParams;
  'update-template': UpdateTemplateParams;
  'delete-template': DeleteTemplateParams;
  'get-regions': GetRegionsParams;
  'get-region': GetRegionParams;
  'create-region': CreateRegionParams;
  'update-region': UpdateRegionParams;
  'delete-region': DeleteRegionParams;
  'create-region-behavior': CreateRegionBehaviorParams;
  'update-region-behavior': UpdateRegionBehaviorParams;
  'delete-region-behavior': DeleteRegionBehaviorParams;
  'get-region-tokens': GetRegionTokensParams;
  'test-region-point': TestRegionPointParams;
  'get-card-stacks': GetCardStacksParams;
  'get-card-stack': GetCardStackParams;
  'create-card-stack': CreateCardStackParams;
  'update-card-stack': UpdateCardStackParams;
  'delete-card-stack': DeleteCardStackParams;
  'create-card': CreateCardParams;
  'update-card': UpdateCardParams;
  'delete-card': DeleteCardParams;
  'shuffle-cards': ShuffleCardsParams;
  'deal-cards': DealCardsParams;
  'draw-cards': DrawCardsParams;
  'pass-cards': PassCardsParams;
  'play-card': PlayCardParams;
  'discard-card': DiscardCardParams;
  'recall-cards': RecallCardsParams;
  'flip-card': FlipCardParams;
  'show-card': ShowCardParams;
  'get-users': GetUsersParams;
  'get-user': GetUserParams;
  'update-user': UpdateUserParams;
  'get-settings': GetSettingsParams;
  'get-setting': GetSettingParams;
  'set-setting': SetSettingParams;
  'get-prototype-token': GetPrototypeTokenParams;
  'update-prototype-token': UpdatePrototypeTokenParams;
  'get-actor-tokens': GetActorTokensParams;
  'get-token-images': GetTokenImagesParams;
  'move-token-path': MoveTokenPathParams;
  'stop-token-movement': TokenMovementParams;
  'pause-token-movement': PauseTokenMovementParams;
  'resume-token-movement': ResumeTokenMovementParams;
  'measure-token-path': MeasureTokenPathParams;
  'find-token-path': FindTokenPathParams;
  'get-token-movement-history': TokenMovementParams;
  'revert-token-movement': RevertTokenMovementParams;
  'clear-token-movement-history': ClearTokenMovementHistoryParams;
  'select-tokens': SelectTokensParams;
  'get-selected-tokens': GetSelectedTokensParams;
  'set-targets': SetTargetsParams;
  'show-speech-bubble': ShowSpeechBubbleParams;
  'get-door-sounds': GetDoorSoundsParams;
  'get-actor-effect': GetActorEffectParams;
  'get-item-effects': GetItemEffectsParams;
  'create-item-effect': CreateItemEffectParams;
  'update-item-effect': UpdateItemEffectParams;
  'delete-item-effect': DeleteItemEffectParams;
  'preview-table-roll': PreviewTableRollParams;
  'normalize-roll-table': NormalizeRollTableParams;
  'create-roll-table-from-folder': CreateRollTableFromFolderParams;
  'create-table-result': CreateTableResultParams;
  'update-table-result': UpdateTableResultParams;
  'delete-table-result': DeleteTableResultParams;
  'create-playlist': CreatePlaylistParams;
  'update-playlist': UpdatePlaylistParams;
  'delete-playlist': DeletePlaylistParams;
  'update-playlist-sound': UpdatePlaylistSoundParams;
  'delete-playlist-sound': DeletePlaylistSoundParams;
  'play-next-in-playlist': PlayNextInPlaylistParams;
  'import-playlist-sounds': ImportPlaylistSoundsParams;
  'get-hotbar': GetHotbarParams;
  'assign-hotbar-slot': AssignHotbarSlotParams;
  'move-hotbar-slot': MoveHotbarSlotParams;
  'clear-hotbar-slot': ClearHotbarSlotParams;
  'get-calendar': GetCalendarParams;
  'get-time-difference': GetTimeDifferenceParams;
  'create-progress-notification': CreateProgressNotificationParams;
  'update-progress-notification': UpdateProgressNotificationParams;
  'remove-notification': RemoveNotificationParams;
  'measure-grid-path': MeasureGridPathParams;
  'snap-to-grid': SnapToGridParams;
  'get-canvas-view': GetCanvasViewParams;
  'show-scrolling-text': ShowScrollingTextParams;
  'get-document-ownership': GetDocumentOwnershipParams;
  'set-document-ownership': SetDocumentOwnershipParams;
  'get-document-flags': GetDocumentFlagsParams;
  'set-document-flag': SetDocumentFlagParams;
  'unset-document-flag': UnsetDocumentFlagParams;
  'sort-document': SortDocumentParams;
  'search-documents': SearchDocumentsParams;
  'export-document': ExportDocumentParams;
  'import-document': ImportDocumentParams;
  'get-compendium-info': GetCompendiumInfoParams;
  'create-compendium': CreateCompendiumParams;
  'duplicate-compendium': DuplicateCompendiumParams;
  'configure-compendium': ConfigureCompendiumParams;
  'delete-compendium': DeleteCompendiumParams;
  'export-to-compendium': ExportToCompendiumParams;
  'export-folder-to-compendium': ExportFolderToCompendiumParams;
  'update-compendium-document': UpdateCompendiumDocumentParams;
  'delete-compendium-document': DeleteCompendiumDocumentParams;
  'import-compendium': ImportCompendiumParams;
  'import-compendium-folder': ImportCompendiumFolderParams;
  'get-adventure': GetAdventureParams;
  'import-adventure': ImportAdventureParams;
  'browse-files': BrowseFilesParams;
  'create-directory': CreateDirectoryParams;
  'upload-file': UploadFileParams;
  'ask-user': AskUserParams;
  'get-user-answer': GetUserAnswerParams;
  'cancel-user-question': CancelUserQuestionParams;
  'subscribe-events': SubscribeEventsParams;
  'unsubscribe-events': UnsubscribeEventsParams;
  'get-event-subscriptions': GetEventSubscriptionsParams;
  'get-event-types': GetEventTypesParams;
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
  'dnd5e/filter-compendium-actors': FilterCompendiumActorsResult;
  'dnd5e/filter-compendium-items': FilterCompendiumItemsResult;
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
  'pf2e/filter-compendium-actors': Pf2eCompendiumSearchResult;
  'pf2e/filter-compendium-items': Pf2eCompendiumSearchResult;
  'swade/roll-attribute': SwadeTraitRollResult;
  'swade/roll-skill': SwadeTraitRollResult;
  'swade/roll-attack': SwadeAttackRollResult;
  'swade/roll-damage': SwadeDamageRollResult;
  'swade/apply-damage': SwadeApplyDamageResult;
  'swade/soak': SwadeSoakResult;
  'swade/bennies': SwadeBenniesResult;
  'swade/set-status': SwadeSetStatusResult;
  'swade/get-actor-summary': SwadeActorSummary;
  'swade/get-action-cards': SwadeActionCardsResult;
  'coc7/roll-skill': Coc7CheckResult;
  'coc7/roll-characteristic': Coc7CheckResult;
  'coc7/roll-attribute': Coc7CheckResult;
  'coc7/roll-attack': Coc7AttackRollResult;
  'coc7/roll-damage': Coc7DamageRollResult;
  'coc7/apply-damage': Coc7ApplyDamageResult;
  'coc7/sanity-check': Coc7SanityCheckResult;
  'coc7/bout-of-madness': Coc7BoutOfMadnessResult;
  'coc7/luck': Coc7LuckResult;
  'coc7/set-condition': Coc7SetConditionResult;
  'coc7/get-actor-summary': Coc7ActorSummary;
  'pf1/roll-ability': Pf1CheckResult;
  'pf1/roll-skill': Pf1CheckResult;
  'pf1/roll-save': Pf1CheckResult;
  'pf1/roll-caster-level': Pf1CheckResult;
  'pf1/roll-concentration': Pf1CheckResult;
  'pf1/use-item': Pf1UseItemResult;
  'pf1/apply-damage': Pf1ApplyDamageResult;
  'pf1/set-condition': Pf1SetConditionResult;
  'pf1/get-actor-summary': Pf1ActorSummary;
  'get-world-info': WorldInfoResult;
  'get-actors': ActorSummary[];
  'filter-actors': FilterActorsResult;
  'filter-items': FilterItemsResult;
  'get-actor': ActorDetailResult;
  'create-actor': ActorResult;
  'create-actor-from-compendium': ActorResult;
  'update-actor': ActorResult;
  'dnd5e/apply-damage': HitPointsChangeResult;
  'apply-damage': HitPointsChangeResult; // alias of 'dnd5e/apply-damage'
  'dnd5e/apply-healing': HitPointsChangeResult;
  'apply-healing': HitPointsChangeResult; // alias of 'dnd5e/apply-healing'
  'delete-actor': DeleteResult;
  'send-chat-message': SendChatMessageResult;
  'create-journal': JournalResult;
  'update-journal': JournalResult;
  'delete-journal': DeleteResult;
  'create-journal-page': JournalPageDetailResult;
  'update-journal-page': JournalPageDetailResult;
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
  'get-journal': JournalDetailData;
  'get-items': ItemData[];
  'get-item': ItemData;
  'get-compendiums': CompendiumMetadata[];
  'get-compendium': CompendiumData;
  'get-compendium-index': GetCompendiumIndexResult;
  'search-compendium': SearchCompendiumResult;
  'search-compendiums': SearchCompendiumsResult;
  'get-compendium-document': CompendiumDocumentResult;
  'import-from-compendium': ImportFromCompendiumResult;
  'resolve-uuid': ResolveUuidResult;
  'search-compendium-pages': SearchCompendiumPagesResult;
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
  'get-weather-effects': GetWeatherEffectsResult;
  'pull-users-to-scene': PullUsersToSceneResult;
  'preload-scene': PreloadSceneResult;
  'regenerate-scene-thumbnail': RegenerateSceneThumbnailResult;
  'reset-fog': ResetFogResult;
  'get-scene-levels': GetSceneLevelsResult;
  'create-scene-level': SceneLevelResult;
  'update-scene-level': SceneLevelResult;
  'delete-scene-level': DeleteSceneLevelResult;
  'get-combats': GetCombatsResult;
  'activate-combat': CombatEncounterSummary;
  'toggle-combat-scene-link': CombatEncounterSummary;
  'next-round': CombatResult;
  'previous-round': CombatResult;
  'reset-initiative': CombatResult;
  'get-combatant-groups': GetCombatantGroupsResult;
  'create-combatant-group': CombatantGroupResult;
  'update-combatant-group': CombatantGroupResult;
  'delete-combatant-group': DeleteCombatantGroupResult;
  'get-combat-tracker-config': CombatTrackerConfigResult;
  'update-combat-tracker-config': CombatTrackerConfigResult;
  'validate-roll-formula': ValidateRollFormulaResult;
  'simulate-roll': SimulateRollResult;
  'create-journal-category': JournalCategoryResult;
  'update-journal-category': JournalCategoryResult;
  'delete-journal-category': DeleteJournalCategoryResult;
  'show-image': ShowImageResult;
  'pan-to-note': PanToNoteResult;
  'search-journals': SearchJournalsResult;
  'get-lights': GetLightsResult;
  'create-light': CreateLightResult;
  'update-light': UpdateLightResult;
  'delete-light': DeleteLightResult;
  'get-ambient-sounds': GetAmbientSoundsResult;
  'create-ambient-sound': CreateAmbientSoundResult;
  'update-ambient-sound': UpdateAmbientSoundResult;
  'delete-ambient-sound': DeleteAmbientSoundResult;
  'play-sound-at-position': PlaySoundAtPositionResult;
  'preload-sound': PreloadSoundResult;
  'get-tiles': GetTilesResult;
  'create-tile': CreateTileResult;
  'update-tile': UpdateTileResult;
  'delete-tile': DeleteTileResult;
  'get-drawings': GetDrawingsResult;
  'create-drawing': CreateDrawingResult;
  'update-drawing': UpdateDrawingResult;
  'delete-drawing': DeleteDrawingResult;
  'get-templates': GetTemplatesResult;
  'create-template': CreateTemplateResult;
  'update-template': UpdateTemplateResult;
  'delete-template': DeleteTemplateResult;
  'get-regions': GetRegionsResult;
  'get-region': GetRegionResult;
  'create-region': CreateRegionResult;
  'update-region': UpdateRegionResult;
  'delete-region': DeleteRegionResult;
  'create-region-behavior': CreateRegionBehaviorResult;
  'update-region-behavior': UpdateRegionBehaviorResult;
  'delete-region-behavior': DeleteRegionBehaviorResult;
  'get-region-tokens': GetRegionTokensResult;
  'test-region-point': TestRegionPointResult;
  'get-card-stacks': GetCardStacksResult;
  'get-card-stack': GetCardStackResult;
  'create-card-stack': CreateCardStackResult;
  'update-card-stack': UpdateCardStackResult;
  'delete-card-stack': DeleteCardStackResult;
  'create-card': CreateCardResult;
  'update-card': UpdateCardResult;
  'delete-card': DeleteCardResult;
  'shuffle-cards': CardOperationResult;
  'deal-cards': CardOperationResult;
  'draw-cards': CardOperationResult;
  'pass-cards': CardOperationResult;
  'play-card': CardOperationResult;
  'discard-card': CardOperationResult;
  'recall-cards': CardOperationResult;
  'flip-card': FlipCardResult;
  'show-card': ShowCardResult;
  'get-users': GetUsersResult;
  'get-user': GetUserResult;
  'update-user': UpdateUserResult;
  'get-settings': GetSettingsResult;
  'get-setting': GetSettingResult;
  'set-setting': SetSettingResult;
  'get-prototype-token': GetPrototypeTokenResult;
  'update-prototype-token': UpdatePrototypeTokenResult;
  'get-actor-tokens': GetActorTokensResult;
  'get-token-images': GetTokenImagesResult;
  'move-token-path': MoveTokenPathResult;
  'stop-token-movement': StopTokenMovementResult;
  'pause-token-movement': PauseTokenMovementResult;
  'resume-token-movement': ResumeTokenMovementResult;
  'measure-token-path': MeasureTokenPathResult;
  'find-token-path': FindTokenPathResult;
  'get-token-movement-history': GetTokenMovementHistoryResult;
  'revert-token-movement': RevertTokenMovementResult;
  'clear-token-movement-history': ClearTokenMovementHistoryResult;
  'select-tokens': SelectTokensResult;
  'get-selected-tokens': GetSelectedTokensResult;
  'set-targets': SetTargetsResult;
  'show-speech-bubble': ShowSpeechBubbleResult;
  'get-door-sounds': GetDoorSoundsResult;
  'get-actor-effect': ActorEffectResult;
  'get-item-effects': ItemEffectsResult;
  'create-item-effect': ItemEffectResult;
  'update-item-effect': ItemEffectResult;
  'delete-item-effect': DeleteItemEffectResult;
  'preview-table-roll': PreviewTableRollResult;
  'normalize-roll-table': RollTableResult;
  'create-roll-table-from-folder': RollTableResult;
  'create-table-result': TableResultEntryResult;
  'update-table-result': TableResultEntryResult;
  'delete-table-result': DeleteTableResultResult;
  'create-playlist': PlaylistSnapshot;
  'update-playlist': PlaylistSnapshot;
  'delete-playlist': DeletePlaylistResult;
  'update-playlist-sound': PlaylistSoundResult;
  'delete-playlist-sound': DeletePlaylistSoundResult;
  'play-next-in-playlist': PlayNextInPlaylistResult;
  'import-playlist-sounds': ImportPlaylistSoundsResult;
  'get-hotbar': GetHotbarResult;
  'assign-hotbar-slot': AssignHotbarSlotResult;
  'move-hotbar-slot': MoveHotbarSlotResult;
  'clear-hotbar-slot': ClearHotbarSlotResult;
  'get-calendar': GetCalendarResult;
  'get-time-difference': GetTimeDifferenceResult;
  'create-progress-notification': CreateProgressNotificationResult;
  'update-progress-notification': UpdateProgressNotificationResult;
  'remove-notification': RemoveNotificationResult;
  'measure-grid-path': MeasureGridPathResult;
  'snap-to-grid': SnapToGridResult;
  'get-canvas-view': GetCanvasViewResult;
  'show-scrolling-text': ShowScrollingTextResult;
  'get-document-ownership': DocumentOwnershipResult;
  'set-document-ownership': DocumentOwnershipResult;
  'get-document-flags': GetDocumentFlagsResult;
  'set-document-flag': SetDocumentFlagResult;
  'unset-document-flag': UnsetDocumentFlagResult;
  'sort-document': SortDocumentResult;
  'search-documents': SearchDocumentsResult;
  'export-document': ExportDocumentResult;
  'import-document': ImportDocumentResult;
  'get-compendium-info': GetCompendiumInfoResult;
  'create-compendium': CreateCompendiumResult;
  'duplicate-compendium': DuplicateCompendiumResult;
  'configure-compendium': ConfigureCompendiumResult;
  'delete-compendium': DeleteCompendiumResult;
  'export-to-compendium': ExportToCompendiumResult;
  'export-folder-to-compendium': ExportFolderToCompendiumResult;
  'update-compendium-document': UpdateCompendiumDocumentResult;
  'delete-compendium-document': DeleteCompendiumDocumentResult;
  'import-compendium': ImportCompendiumResult;
  'import-compendium-folder': ImportCompendiumFolderResult;
  'get-adventure': GetAdventureResult;
  'import-adventure': ImportAdventureResult;
  'browse-files': BrowseFilesResult;
  'create-directory': CreateDirectoryResult;
  'upload-file': UploadFileResult;
  'ask-user': AskUserResult;
  'get-user-answer': GetUserAnswerResult;
  'cancel-user-question': CancelUserQuestionResult;
  'subscribe-events': EventSubscriptionResult;
  'unsubscribe-events': EventSubscriptionResult;
  'get-event-subscriptions': EventSubscriptionResult;
  'get-event-types': GetEventTypesResult;
}