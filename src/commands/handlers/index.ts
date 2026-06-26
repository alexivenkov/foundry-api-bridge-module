export { rollDiceHandler } from '@/commands/handlers/RollDiceHandler';
export { sendChatMessageHandler } from '@/commands/handlers/SendChatMessageHandler';

// Actor handlers
export {
  dnd5eRollSkillHandler,
  dnd5eRollSaveHandler,
  dnd5eRollAbilityHandler,
  dnd5eRollPerceptionHandler,
  pf2eRollSkillHandler,
  pf2eRollSaveHandler,
  pf2eRollPerceptionHandler,
  rollAttackHandler,
  rollDamageHandler,
  createActorHandler,
  createActorFromCompendiumHandler,
  updateActorHandler,
  deleteActorHandler,
  getActorsHandler,
  getActorHandler,
  filterActorsHandler,
  createFilterActorsHandler
} from '@/commands/handlers/actor';

// Journal handlers
export {
  createJournalHandler,
  updateJournalHandler,
  deleteJournalHandler,
  createJournalPageHandler,
  updateJournalPageHandler,
  deleteJournalPageHandler,
  getJournalsHandler,
  getJournalHandler,
  showJournalHandler
} from '@/commands/handlers/journal';

// Combat handlers
export {
  createCombatHandler,
  addCombatantHandler,
  removeCombatantHandler,
  startCombatHandler,
  endCombatHandler,
  deleteCombatHandler,
  nextTurnHandler,
  previousTurnHandler,
  getCombatStateHandler,
  setTurnHandler,
  rollInitiativeHandler,
  setInitiativeHandler,
  rollAllInitiativeHandler,
  updateCombatantHandler,
  setCombatantDefeatedHandler,
  toggleCombatantVisibilityHandler,
  getCombatTurnContextHandler
} from '@/commands/handlers/combat';

// Token handlers
export {
  createTokenHandler,
  deleteTokenHandler,
  moveTokenHandler,
  updateTokenHandler,
  getSceneTokensHandler,
  getTokenHandler,
  getTokenByActorHandler,
  setTokenTargetHandler,
  clearTargetsHandler,
  getTokensInRangeHandler
} from '@/commands/handlers/token';

// Item handlers
export {
  getActorItemsHandler,
  useItemHandler,
  activateItemHandler,
  addItemToActorHandler,
  addItemFromCompendiumHandler,
  updateActorItemHandler,
  deleteActorItemHandler,
  getItemsHandler,
  getItemHandler,
  createItemHandler,
  createItemFromCompendiumHandler,
  updateItemHandler,
  deleteItemHandler,
  filterItemsHandler,
  createFilterItemsHandler
} from '@/commands/handlers/item';

// Scene handlers
export {
  getSceneHandler,
  getScenesListHandler,
  activateSceneHandler,
  captureSceneHandler,
  createSceneHandler,
  updateSceneHandler,
  deleteSceneHandler,
  cloneSceneHandler,
  viewSceneHandler
} from '@/commands/handlers/scene';

// World handlers
export {
  getWorldInfoHandler,
  getCompendiumsHandler,
  getCompendiumHandler,
  getCompendiumIndexHandler,
  searchCompendiumHandler,
  getCompendiumDocumentHandler,
  importFromCompendiumHandler
} from '@/commands/handlers/world';

// Table handlers
export {
  listRollTablesHandler,
  getRollTableHandler,
  rollOnTableHandler,
  resetTableHandler,
  createRollTableHandler,
  updateRollTableHandler,
  deleteRollTableHandler
} from '@/commands/handlers/table';

// Door handlers
export {
  setDoorStateHandler
} from '@/commands/handlers/door';

// Wall handlers
export {
  getWallsHandler,
  createWallHandler,
  updateWallHandler,
  deleteWallHandler
} from '@/commands/handlers/wall';

// Note handlers
export {
  getNotesHandler,
  createNoteHandler,
  updateNoteHandler,
  deleteNoteHandler
} from '@/commands/handlers/note';

// Chat handlers
export {
  getChatMessagesHandler,
  deleteChatMessageHandler,
  updateChatMessageHandler,
  clearChatHandler,
  exportChatHandler
} from '@/commands/handlers/chat';

// Effect handlers
export {
  getActorEffectsHandler,
  toggleActorStatusHandler,
  addActorEffectHandler,
  removeActorEffectHandler,
  updateActorEffectHandler
} from '@/commands/handlers/effect';

// Folder handlers
export {
  getFoldersHandler,
  getFolderHandler,
  createFolderHandler,
  updateFolderHandler,
  deleteFolderHandler
} from '@/commands/handlers/folder';

// Macro handlers
export {
  getMacrosHandler,
  getMacroHandler,
  createMacroHandler,
  updateMacroHandler,
  deleteMacroHandler,
  executeMacroHandler
} from '@/commands/handlers/macro';

// Playlist handlers
export {
  getPlaylistsHandler,
  getPlaylistHandler,
  playPlaylistHandler,
  stopPlaylistHandler,
  playSoundInPlaylistHandler,
  stopSoundInPlaylistHandler,
  playSoundOnceHandler,
  addSoundToPlaylistHandler
} from '@/commands/handlers/playlist';

// System runtime handlers (world time, pause/resume, UI helpers)
export {
  getWorldTimeHandler,
  advanceTimeHandler,
  setWorldTimeHandler,
  pauseGameHandler,
  resumeGameHandler,
  getPauseStateHandler,
  notifyHandler,
  panCanvasHandler,
  pingLocationHandler
} from '@/commands/handlers/system';
// PF2e condition handlers
export {
  pf2eSetConditionHandler,
  pf2eRemoveConditionHandler,
  pf2eIncreaseConditionHandler,
  pf2eDecreaseConditionHandler,
  pf2eGetConditionsHandler
} from '@/commands/handlers/condition';

// PF2e strike handlers
export {
  pf2eListStrikesHandler,
  pf2eRollStrikeHandler,
  pf2eRollStrikeDamageHandler
} from '@/commands/handlers/strike';

// PF2e item-use handlers
export {
  pf2eUseConsumableHandler,
  pf2eCastSpellHandler,
  pf2ePostItemHandler
} from '@/commands/handlers/item-use';
