import { ConfigManager } from '@/config/ConfigManager';
import {
  registerSettings,
  registerMenu,
  getWsUrl,
  getApiUrl,
  getApiKey,
  setApiKey,
  reportInvalidApiKey,
  migrateLegacyApiKey
} from '@/settings/SettingsManager';
import { validateApiKey } from '@/settings/apiKeyFormat';
import { WebSocketClient, CLOSE_CODE_API_KEY_REJECTED, CLOSE_CODE_REPLACED } from '@/transport';
import { attachEventChannel, dropEventChannel } from '@/core/events';
import {
  CommandRouter,
  createScriptMarkerGuard,
  rollDiceHandler,
  sendChatMessageHandler,
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
  dnd5eApplyDamageHandler,
  dnd5eApplyHealingHandler,
  deleteActorHandler,
  getActorsHandler,
  getActorHandler,
  filterActorsHandler,
  filterItemsHandler,
  dnd5eFilterCompendiumActorsHandler,
  dnd5eFilterCompendiumItemsHandler,
  pf2eFilterCompendiumActorsHandler,
  pf2eFilterCompendiumItemsHandler,
  swadeRollAttributeHandler,
  swadeRollSkillHandler,
  swadeRollAttackHandler,
  swadeRollDamageHandler,
  swadeApplyDamageHandler,
  swadeSoakHandler,
  swadeBenniesHandler,
  swadeSetStatusHandler,
  swadeGetActorSummaryHandler,
  swadeGetActionCardsHandler,
  coc7RollSkillHandler,
  coc7RollCharacteristicHandler,
  coc7RollAttributeHandler,
  coc7RollAttackHandler,
  coc7RollDamageHandler,
  coc7ApplyDamageHandler,
  coc7SanityCheckHandler,
  coc7BoutOfMadnessHandler,
  coc7LuckHandler,
  coc7SetConditionHandler,
  coc7GetActorSummaryHandler,
  getWorldInfoHandler,
  getJournalsHandler,
  getJournalHandler,
  getItemsHandler,
  getItemHandler,
  getCompendiumsHandler,
  getCompendiumHandler,
  getCompendiumIndexHandler,
  searchCompendiumHandler,
  searchCompendiumsHandler,
  getCompendiumDocumentHandler,
  importFromCompendiumHandler,
  resolveUuidHandler,
  searchCompendiumPagesHandler,
  createJournalHandler,
  updateJournalHandler,
  deleteJournalHandler,
  createJournalPageHandler,
  updateJournalPageHandler,
  deleteJournalPageHandler,
  showJournalHandler,
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
  createTokenHandler,
  deleteTokenHandler,
  moveTokenHandler,
  updateTokenHandler,
  getSceneTokensHandler,
  getTokenHandler,
  getTokenByActorHandler,
  setTokenTargetHandler,
  clearTargetsHandler,
  getTokensInRangeHandler,
  getSceneHandler,
  getScenesListHandler,
  activateSceneHandler,
  createSceneHandler,
  updateSceneHandler,
  deleteSceneHandler,
  cloneSceneHandler,
  viewSceneHandler,
  getActorItemsHandler,
  useItemHandler,
  activateItemHandler,
  addItemToActorHandler,
  addItemFromCompendiumHandler,
  updateActorItemHandler,
  deleteActorItemHandler,
  createItemHandler,
  createItemFromCompendiumHandler,
  updateItemHandler,
  deleteItemHandler,
  getActorEffectsHandler,
  toggleActorStatusHandler,
  addActorEffectHandler,
  removeActorEffectHandler,
  updateActorEffectHandler,
  getCombatTurnContextHandler,
  captureSceneHandler,
  listRollTablesHandler,
  getRollTableHandler,
  rollOnTableHandler,
  resetTableHandler,
  createRollTableHandler,
  updateRollTableHandler,
  deleteRollTableHandler,
  setDoorStateHandler,
  getWallsHandler,
  createWallHandler,
  updateWallHandler,
  deleteWallHandler,
  getNotesHandler,
  createNoteHandler,
  updateNoteHandler,
  deleteNoteHandler,
  getChatMessagesHandler,
  deleteChatMessageHandler,
  updateChatMessageHandler,
  clearChatHandler,
  exportChatHandler,
  getFoldersHandler,
  getFolderHandler,
  createFolderHandler,
  updateFolderHandler,
  deleteFolderHandler,
  getMacrosHandler,
  getMacroHandler,
  createMacroHandler,
  updateMacroHandler,
  deleteMacroHandler,
  executeMacroHandler,
  getPlaylistsHandler,
  getPlaylistHandler,
  playPlaylistHandler,
  stopPlaylistHandler,
  playSoundInPlaylistHandler,
  stopSoundInPlaylistHandler,
  playSoundOnceHandler,
  addSoundToPlaylistHandler,
  getWorldTimeHandler,
  advanceTimeHandler,
  setWorldTimeHandler,
  pauseGameHandler,
  resumeGameHandler,
  getPauseStateHandler,
  notifyHandler,
  panCanvasHandler,
  pingLocationHandler,
  getWeatherEffectsHandler,
  pullUsersToSceneHandler,
  preloadSceneHandler,
  regenerateSceneThumbnailHandler,
  resetFogHandler,
  getSceneLevelsHandler,
  createSceneLevelHandler,
  updateSceneLevelHandler,
  deleteSceneLevelHandler,
  getCombatsHandler,
  activateCombatHandler,
  toggleCombatSceneLinkHandler,
  nextRoundHandler,
  previousRoundHandler,
  resetInitiativeHandler,
  getCombatantGroupsHandler,
  createCombatantGroupHandler,
  updateCombatantGroupHandler,
  deleteCombatantGroupHandler,
  getCombatTrackerConfigHandler,
  updateCombatTrackerConfigHandler,
  validateRollFormulaHandler,
  simulateRollHandler,
  createJournalCategoryHandler,
  updateJournalCategoryHandler,
  deleteJournalCategoryHandler,
  showImageHandler,
  panToNoteHandler,
  searchJournalsHandler,
  getLightsHandler,
  createLightHandler,
  updateLightHandler,
  deleteLightHandler,
  getAmbientSoundsHandler,
  createAmbientSoundHandler,
  updateAmbientSoundHandler,
  deleteAmbientSoundHandler,
  playSoundAtPositionHandler,
  preloadSoundHandler,
  getTilesHandler,
  createTileHandler,
  updateTileHandler,
  deleteTileHandler,
  getDrawingsHandler,
  createDrawingHandler,
  updateDrawingHandler,
  deleteDrawingHandler,
  getTemplatesHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
  getRegionsHandler,
  getRegionHandler,
  createRegionHandler,
  updateRegionHandler,
  deleteRegionHandler,
  createRegionBehaviorHandler,
  updateRegionBehaviorHandler,
  deleteRegionBehaviorHandler,
  getRegionTokensHandler,
  testRegionPointHandler,
  getCardStacksHandler,
  getCardStackHandler,
  createCardStackHandler,
  updateCardStackHandler,
  deleteCardStackHandler,
  createCardHandler,
  updateCardHandler,
  deleteCardHandler,
  shuffleCardsHandler,
  dealCardsHandler,
  drawCardsHandler,
  passCardsHandler,
  playCardHandler,
  discardCardHandler,
  recallCardsHandler,
  flipCardHandler,
  showCardHandler,
  getUsersHandler,
  getUserHandler,
  updateUserHandler,
  getSettingsHandler,
  getSettingHandler,
  setSettingHandler,
  getPrototypeTokenHandler,
  updatePrototypeTokenHandler,
  getActorTokensHandler,
  getTokenImagesHandler,
  moveTokenPathHandler,
  stopTokenMovementHandler,
  pauseTokenMovementHandler,
  resumeTokenMovementHandler,
  measureTokenPathHandler,
  findTokenPathHandler,
  getTokenMovementHistoryHandler,
  revertTokenMovementHandler,
  clearTokenMovementHistoryHandler,
  selectTokensHandler,
  getSelectedTokensHandler,
  setTargetsHandler,
  showSpeechBubbleHandler,
  getDoorSoundsHandler,
  getActorEffectHandler,
  getItemEffectsHandler,
  createItemEffectHandler,
  updateItemEffectHandler,
  deleteItemEffectHandler,
  previewTableRollHandler,
  normalizeRollTableHandler,
  createRollTableFromFolderHandler,
  createTableResultHandler,
  updateTableResultHandler,
  deleteTableResultHandler,
  createPlaylistHandler,
  updatePlaylistHandler,
  deletePlaylistHandler,
  updatePlaylistSoundHandler,
  deletePlaylistSoundHandler,
  playNextInPlaylistHandler,
  importPlaylistSoundsHandler,
  getHotbarHandler,
  assignHotbarSlotHandler,
  moveHotbarSlotHandler,
  clearHotbarSlotHandler,
  getCalendarHandler,
  getTimeDifferenceHandler,
  createProgressNotificationHandler,
  updateProgressNotificationHandler,
  removeNotificationHandler,
  measureGridPathHandler,
  snapToGridHandler,
  getCanvasViewHandler,
  showScrollingTextHandler,
  getDocumentOwnershipHandler,
  setDocumentOwnershipHandler,
  getDocumentFlagsHandler,
  setDocumentFlagHandler,
  unsetDocumentFlagHandler,
  sortDocumentHandler,
  searchDocumentsHandler,
  exportDocumentHandler,
  importDocumentHandler,
  getCompendiumInfoHandler,
  createCompendiumHandler,
  duplicateCompendiumHandler,
  configureCompendiumHandler,
  deleteCompendiumHandler,
  exportToCompendiumHandler,
  exportFolderToCompendiumHandler,
  updateCompendiumDocumentHandler,
  deleteCompendiumDocumentHandler,
  importCompendiumHandler,
  importCompendiumFolderHandler,
  getAdventureHandler,
  importAdventureHandler,
  browseFilesHandler,
  createDirectoryHandler,
  uploadFileHandler,
  askUserHandler,
  getUserAnswerHandler,
  cancelUserQuestionHandler,
  subscribeEventsHandler,
  unsubscribeEventsHandler,
  getEventSubscriptionsHandler,
  getEventTypesHandler,
  pf2eSetConditionHandler,
  pf2eRemoveConditionHandler,
  pf2eIncreaseConditionHandler,
  pf2eDecreaseConditionHandler,
  pf2eGetConditionsHandler,
  pf2eListStrikesHandler,
  pf2eRollStrikeHandler,
  pf2eRollStrikeDamageHandler,
  pf2eUseConsumableHandler,
  pf2eCastSpellHandler,
  pf2ePostItemHandler
} from '@/commands';

// Injected by Vite from package.json (see vite.config.ts `define`).
const MODULE_VERSION = __MODULE_VERSION__;

let mcpClient: WebSocketClient | null = null;
let apiClient: WebSocketClient | null = null;
let commandRouter: CommandRouter | null = null;

Hooks.once('init', () => {
  registerSettings();
  void registerMenu();
});

Hooks.on('renderSettingsConfig', (_app: unknown, html: unknown) => {
  const root = html instanceof HTMLElement ? html : (html as JQuery)[0];
  if (!root) return;

  const apiKeyInput = root.querySelector('input[name="foundry-api-bridge.apiKey"]');
  if (!apiKeyInput) return;

  const formGroup = apiKeyInput.closest('.form-group');
  if (!formGroup) return;

  // The key is client-scoped and only the GM's browser needs it; players get
  // nothing to fill in.
  if (!game.user?.isGM) {
    formGroup.remove();
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = '<i class="fas fa-key"></i> Get API Key';
  button.style.cssText = 'margin-top: 4px; padding: 4px 12px; cursor: pointer; font-size: 12px;';
  button.addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://foundry-mcp.com/auth/patreon', '_blank');
  });

  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Free account available — no subscription required';
  hint.style.cssText = 'margin-top: 2px; font-size: 11px; font-style: italic;';

  formGroup.appendChild(button);
  formGroup.appendChild(hint);
});

Hooks.once('ready', () => {
  if (!game.user?.isGM) {
    return;
  }

  void startModule();
});

async function startModule(): Promise<void> {
  try {
    const outcome = await migrateLegacyApiKey();
    if (outcome !== 'none') {
      console.log(`Foundry API Bridge | API key moved out of world settings into this browser (${outcome})`);
    }
  } catch (error: unknown) {
    console.warn('Foundry API Bridge | Could not migrate the API key setting:', error);
  }

  initializeModule();
}

function initializeModule(): void {
  try {
    ConfigManager.initialize();
    const config = ConfigManager.getConfig();

    const wsUrl = getWsUrl();
    const apiUrl = getApiUrl();
    const storedKey = getApiKey();
    const keyCheck = validateApiKey(storedKey);

    if (!keyCheck.ok) {
      if (keyCheck.reason === 'empty') {
        console.log(`Foundry API Bridge | v${MODULE_VERSION} loaded. Configure API Key in module settings to connect.`);
      } else {
        reportInvalidApiKey(keyCheck);
      }
      return;
    }

    const apiKey = keyCheck.key;
    if (apiKey !== storedKey) {
      // A line break or a stray space from the paste; the cleaned key is kept
      // so the next start reads a clean value. Client scope, no reload needed.
      setApiKey(apiKey)
        .then(() => {
          console.log('Foundry API Bridge | API key cleaned up: removed whitespace');
        })
        .catch((error: unknown) => {
          console.warn('Foundry API Bridge | Could not save the cleaned-up API key:', error);
        });
    }

    if (!wsUrl && !apiUrl) {
      console.warn(`Foundry API Bridge | v${MODULE_VERSION} loaded. Both MCP and API URLs are empty — nothing to connect to.`);
      return;
    }

    initializeWebSocket(config.webSocket, wsUrl, apiUrl, apiKey);
    console.log(`Foundry API Bridge | v${MODULE_VERSION} initialized`);

  } catch (error: unknown) {
    console.error('Foundry API Bridge | Initialization failed:', error);
  }
}

function initializeWebSocket(
  wsConfig: { reconnectInterval: number; maxReconnectAttempts: number },
  wsUrl: string,
  apiUrl: string,
  apiKey: string
): void {
  commandRouter = new CommandRouter({ guard: createScriptMarkerGuard() });

  // Pull queries
  commandRouter.register('get-world-info', getWorldInfoHandler);
  commandRouter.register('get-actors', getActorsHandler);
  commandRouter.register('filter-actors', filterActorsHandler);
  commandRouter.register('filter-items', filterItemsHandler);
  commandRouter.register('get-actor', getActorHandler);
  commandRouter.register('get-journals', getJournalsHandler);
  commandRouter.register('get-journal', getJournalHandler);
  commandRouter.register('get-items', getItemsHandler);
  commandRouter.register('get-item', getItemHandler);
  commandRouter.register('get-compendiums', getCompendiumsHandler);
  commandRouter.register('get-compendium', getCompendiumHandler);
  commandRouter.register('get-compendium-index', getCompendiumIndexHandler);
  commandRouter.register('search-compendium', searchCompendiumHandler);
  commandRouter.register('search-compendiums', searchCompendiumsHandler);
  commandRouter.register('get-compendium-document', getCompendiumDocumentHandler);
  commandRouter.register('import-from-compendium', importFromCompendiumHandler);
  commandRouter.register('resolve-uuid', resolveUuidHandler);
  commandRouter.register('search-compendium-pages', searchCompendiumPagesHandler);
  commandRouter.register('get-scene', getSceneHandler);
  commandRouter.register('get-scenes-list', getScenesListHandler);
  commandRouter.register('get-scene-tokens', getSceneTokensHandler);
  commandRouter.register('get-actor-items', getActorItemsHandler);
  commandRouter.register('get-actor-effects', getActorEffectsHandler);
  commandRouter.register('get-combat-state', getCombatStateHandler);
  commandRouter.register('get-combat-turn-context', getCombatTurnContextHandler);

  // Dice & chat
  commandRouter.register('roll-dice', rollDiceHandler);
  commandRouter.register('send-chat-message', sendChatMessageHandler);
  commandRouter.register('get-chat-messages', getChatMessagesHandler);
  commandRouter.register('delete-chat-message', deleteChatMessageHandler);
  commandRouter.register('update-chat-message', updateChatMessageHandler);
  commandRouter.register('clear-chat', clearChatHandler);
  commandRouter.register('export-chat', exportChatHandler);
  commandRouter.register('dnd5e/roll-skill', dnd5eRollSkillHandler);
  commandRouter.register('roll-skill', dnd5eRollSkillHandler); // @deprecated alias of 'dnd5e/roll-skill'
  commandRouter.register('dnd5e/roll-save', dnd5eRollSaveHandler);
  commandRouter.register('roll-save', dnd5eRollSaveHandler); // @deprecated alias of 'dnd5e/roll-save'
  commandRouter.register('dnd5e/roll-ability', dnd5eRollAbilityHandler);
  commandRouter.register('roll-ability', dnd5eRollAbilityHandler); // @deprecated alias of 'dnd5e/roll-ability'
  commandRouter.register('dnd5e/roll-perception', dnd5eRollPerceptionHandler);
  commandRouter.register('roll-perception', dnd5eRollPerceptionHandler); // @deprecated alias of 'dnd5e/roll-perception'
  commandRouter.register('dnd5e/filter-compendium-actors', dnd5eFilterCompendiumActorsHandler);
  commandRouter.register('dnd5e/filter-compendium-items', dnd5eFilterCompendiumItemsHandler);
  commandRouter.register('pf2e/filter-compendium-actors', pf2eFilterCompendiumActorsHandler);
  commandRouter.register('pf2e/filter-compendium-items', pf2eFilterCompendiumItemsHandler);
  commandRouter.register('pf2e/roll-skill', pf2eRollSkillHandler);
  commandRouter.register('pf2e/roll-save', pf2eRollSaveHandler);
  commandRouter.register('pf2e/roll-perception', pf2eRollPerceptionHandler);
  commandRouter.register('pf2e/set-condition', pf2eSetConditionHandler);
  commandRouter.register('pf2e/remove-condition', pf2eRemoveConditionHandler);
  commandRouter.register('pf2e/get-conditions', pf2eGetConditionsHandler);
  commandRouter.register('pf2e/increase-condition', pf2eIncreaseConditionHandler);
  commandRouter.register('pf2e/decrease-condition', pf2eDecreaseConditionHandler);
  commandRouter.register('pf2e/list-strikes', pf2eListStrikesHandler);
  commandRouter.register('pf2e/roll-strike', pf2eRollStrikeHandler);
  commandRouter.register('pf2e/roll-strike-damage', pf2eRollStrikeDamageHandler);
  commandRouter.register('pf2e/use-consumable', pf2eUseConsumableHandler);
  commandRouter.register('pf2e/cast-spell', pf2eCastSpellHandler);
  commandRouter.register('pf2e/post-item', pf2ePostItemHandler);
  commandRouter.register('swade/roll-attribute', swadeRollAttributeHandler);
  commandRouter.register('swade/roll-skill', swadeRollSkillHandler);
  commandRouter.register('swade/roll-attack', swadeRollAttackHandler);
  commandRouter.register('swade/roll-damage', swadeRollDamageHandler);
  commandRouter.register('swade/apply-damage', swadeApplyDamageHandler);
  commandRouter.register('swade/soak', swadeSoakHandler);
  commandRouter.register('swade/bennies', swadeBenniesHandler);
  commandRouter.register('swade/set-status', swadeSetStatusHandler);
  commandRouter.register('swade/get-actor-summary', swadeGetActorSummaryHandler);
  commandRouter.register('swade/get-action-cards', swadeGetActionCardsHandler);
  commandRouter.register('coc7/roll-skill', coc7RollSkillHandler);
  commandRouter.register('coc7/roll-characteristic', coc7RollCharacteristicHandler);
  commandRouter.register('coc7/roll-attribute', coc7RollAttributeHandler);
  commandRouter.register('coc7/roll-attack', coc7RollAttackHandler);
  commandRouter.register('coc7/roll-damage', coc7RollDamageHandler);
  commandRouter.register('coc7/apply-damage', coc7ApplyDamageHandler);
  commandRouter.register('coc7/sanity-check', coc7SanityCheckHandler);
  commandRouter.register('coc7/bout-of-madness', coc7BoutOfMadnessHandler);
  commandRouter.register('coc7/luck', coc7LuckHandler);
  commandRouter.register('coc7/set-condition', coc7SetConditionHandler);
  commandRouter.register('coc7/get-actor-summary', coc7GetActorSummaryHandler);
  commandRouter.register('dnd5e/roll-attack', rollAttackHandler);
  commandRouter.register('roll-attack', rollAttackHandler); // @deprecated alias of 'dnd5e/roll-attack'
  commandRouter.register('dnd5e/roll-damage', rollDamageHandler);
  commandRouter.register('roll-damage', rollDamageHandler); // @deprecated alias of 'dnd5e/roll-damage'

  // Actor CRUD
  commandRouter.register('create-actor', createActorHandler);
  commandRouter.register('create-actor-from-compendium', createActorFromCompendiumHandler);
  commandRouter.register('update-actor', updateActorHandler);
  commandRouter.register('dnd5e/apply-damage', dnd5eApplyDamageHandler);
  commandRouter.register('apply-damage', dnd5eApplyDamageHandler); // alias of 'dnd5e/apply-damage'
  commandRouter.register('dnd5e/apply-healing', dnd5eApplyHealingHandler);
  commandRouter.register('apply-healing', dnd5eApplyHealingHandler); // alias of 'dnd5e/apply-healing'
  commandRouter.register('delete-actor', deleteActorHandler);

  // Journal CRUD
  commandRouter.register('create-journal', createJournalHandler);
  commandRouter.register('update-journal', updateJournalHandler);
  commandRouter.register('delete-journal', deleteJournalHandler);
  commandRouter.register('create-journal-page', createJournalPageHandler);
  commandRouter.register('update-journal-page', updateJournalPageHandler);
  commandRouter.register('delete-journal-page', deleteJournalPageHandler);
  commandRouter.register('show-journal', showJournalHandler);

  // Combat
  commandRouter.register('create-combat', createCombatHandler);
  commandRouter.register('add-combatant', addCombatantHandler);
  commandRouter.register('remove-combatant', removeCombatantHandler);
  commandRouter.register('start-combat', startCombatHandler);
  commandRouter.register('end-combat', endCombatHandler);
  commandRouter.register('delete-combat', deleteCombatHandler);
  commandRouter.register('next-turn', nextTurnHandler);
  commandRouter.register('previous-turn', previousTurnHandler);
  commandRouter.register('set-turn', setTurnHandler);
  commandRouter.register('roll-initiative', rollInitiativeHandler);
  commandRouter.register('set-initiative', setInitiativeHandler);
  commandRouter.register('roll-all-initiative', rollAllInitiativeHandler);
  commandRouter.register('update-combatant', updateCombatantHandler);
  commandRouter.register('set-combatant-defeated', setCombatantDefeatedHandler);
  commandRouter.register('toggle-combatant-visibility', toggleCombatantVisibilityHandler);

  // Tokens
  commandRouter.register('create-token', createTokenHandler);
  commandRouter.register('delete-token', deleteTokenHandler);
  commandRouter.register('move-token', moveTokenHandler);
  commandRouter.register('update-token', updateTokenHandler);
  commandRouter.register('get-token', getTokenHandler);
  commandRouter.register('get-token-by-actor', getTokenByActorHandler);
  commandRouter.register('set-token-target', setTokenTargetHandler);
  commandRouter.register('clear-targets', clearTargetsHandler);
  commandRouter.register('get-tokens-in-range', getTokensInRangeHandler);

  // Items
  commandRouter.register('dnd5e/use-item', useItemHandler);
  commandRouter.register('use-item', useItemHandler); // @deprecated alias of 'dnd5e/use-item'
  commandRouter.register('dnd5e/activate-item', activateItemHandler);
  commandRouter.register('activate-item', activateItemHandler); // @deprecated alias of 'dnd5e/activate-item'
  commandRouter.register('add-item-to-actor', addItemToActorHandler);
  commandRouter.register('add-item-from-compendium', addItemFromCompendiumHandler);
  commandRouter.register('update-actor-item', updateActorItemHandler);
  commandRouter.register('delete-actor-item', deleteActorItemHandler);

  // Item world-level CRUD
  commandRouter.register('create-item', createItemHandler);
  commandRouter.register('create-item-from-compendium', createItemFromCompendiumHandler);
  commandRouter.register('update-item', updateItemHandler);
  commandRouter.register('delete-item', deleteItemHandler);

  // Effects
  commandRouter.register('toggle-actor-status', toggleActorStatusHandler);
  commandRouter.register('add-actor-effect', addActorEffectHandler);
  commandRouter.register('remove-actor-effect', removeActorEffectHandler);
  commandRouter.register('update-actor-effect', updateActorEffectHandler);

  // Tables
  commandRouter.register('list-roll-tables', listRollTablesHandler);
  commandRouter.register('get-roll-table', getRollTableHandler);
  commandRouter.register('roll-on-table', rollOnTableHandler);
  commandRouter.register('reset-table', resetTableHandler);
  commandRouter.register('create-roll-table', createRollTableHandler);
  commandRouter.register('update-roll-table', updateRollTableHandler);
  commandRouter.register('delete-roll-table', deleteRollTableHandler);

  // Scene actions
  commandRouter.register('activate-scene', activateSceneHandler);
  commandRouter.register('capture-scene', captureSceneHandler);

  // Scene CRUD
  commandRouter.register('create-scene', createSceneHandler);
  commandRouter.register('update-scene', updateSceneHandler);
  commandRouter.register('delete-scene', deleteSceneHandler);
  commandRouter.register('clone-scene', cloneSceneHandler);
  commandRouter.register('view-scene', viewSceneHandler);

  // Doors
  commandRouter.register('set-door-state', setDoorStateHandler);

  // Walls
  commandRouter.register('get-walls', getWallsHandler);
  commandRouter.register('create-wall', createWallHandler);
  commandRouter.register('update-wall', updateWallHandler);
  commandRouter.register('delete-wall', deleteWallHandler);

  // Notes
  commandRouter.register('get-notes', getNotesHandler);
  commandRouter.register('create-note', createNoteHandler);
  commandRouter.register('update-note', updateNoteHandler);
  commandRouter.register('delete-note', deleteNoteHandler);

  // Folders
  commandRouter.register('get-folders', getFoldersHandler);
  commandRouter.register('get-folder', getFolderHandler);
  commandRouter.register('create-folder', createFolderHandler);
  commandRouter.register('update-folder', updateFolderHandler);
  commandRouter.register('delete-folder', deleteFolderHandler);

  // Macros
  commandRouter.register('get-macros', getMacrosHandler);
  commandRouter.register('get-macro', getMacroHandler);
  commandRouter.register('create-macro', createMacroHandler);
  commandRouter.register('update-macro', updateMacroHandler);
  commandRouter.register('delete-macro', deleteMacroHandler);
  commandRouter.register('execute-macro', executeMacroHandler);

  // Playlists
  commandRouter.register('get-playlists', getPlaylistsHandler);
  commandRouter.register('get-playlist', getPlaylistHandler);
  commandRouter.register('play-playlist', playPlaylistHandler);
  commandRouter.register('stop-playlist', stopPlaylistHandler);
  commandRouter.register('play-sound-in-playlist', playSoundInPlaylistHandler);
  commandRouter.register('stop-sound-in-playlist', stopSoundInPlaylistHandler);
  commandRouter.register('play-sound-once', playSoundOnceHandler);
  commandRouter.register('add-sound-to-playlist', addSoundToPlaylistHandler);

  // World time
  commandRouter.register('get-world-time', getWorldTimeHandler);
  commandRouter.register('advance-time', advanceTimeHandler);
  commandRouter.register('set-world-time', setWorldTimeHandler);

  // Pause/Resume
  commandRouter.register('pause-game', pauseGameHandler);
  commandRouter.register('resume-game', resumeGameHandler);
  commandRouter.register('get-pause-state', getPauseStateHandler);

  // UI helpers
  commandRouter.register('notify', notifyHandler);
  commandRouter.register('pan-canvas', panCanvasHandler);
  commandRouter.register('ping-location', pingLocationHandler);

  // Scene settings, table controls and levels
  commandRouter.register('get-weather-effects', getWeatherEffectsHandler);
  commandRouter.register('pull-users-to-scene', pullUsersToSceneHandler);
  commandRouter.register('preload-scene', preloadSceneHandler);
  commandRouter.register('regenerate-scene-thumbnail', regenerateSceneThumbnailHandler);
  commandRouter.register('reset-fog', resetFogHandler);
  commandRouter.register('get-scene-levels', getSceneLevelsHandler);
  commandRouter.register('create-scene-level', createSceneLevelHandler);
  commandRouter.register('update-scene-level', updateSceneLevelHandler);
  commandRouter.register('delete-scene-level', deleteSceneLevelHandler);

  // Combat encounters, rounds, combatant groups, tracker configuration
  commandRouter.register('get-combats', getCombatsHandler);
  commandRouter.register('activate-combat', activateCombatHandler);
  commandRouter.register('toggle-combat-scene-link', toggleCombatSceneLinkHandler);
  commandRouter.register('next-round', nextRoundHandler);
  commandRouter.register('previous-round', previousRoundHandler);
  commandRouter.register('reset-initiative', resetInitiativeHandler);
  commandRouter.register('get-combatant-groups', getCombatantGroupsHandler);
  commandRouter.register('create-combatant-group', createCombatantGroupHandler);
  commandRouter.register('update-combatant-group', updateCombatantGroupHandler);
  commandRouter.register('delete-combatant-group', deleteCombatantGroupHandler);
  commandRouter.register('get-combat-tracker-config', getCombatTrackerConfigHandler);
  commandRouter.register('update-combat-tracker-config', updateCombatTrackerConfigHandler);

  // Dice formulas
  commandRouter.register('validate-roll-formula', validateRollFormulaHandler);
  commandRouter.register('simulate-roll', simulateRollHandler);

  // Journals: categories, sharing, navigation, search
  commandRouter.register('create-journal-category', createJournalCategoryHandler);
  commandRouter.register('update-journal-category', updateJournalCategoryHandler);
  commandRouter.register('delete-journal-category', deleteJournalCategoryHandler);
  commandRouter.register('show-image', showImageHandler);
  commandRouter.register('pan-to-note', panToNoteHandler);
  commandRouter.register('search-journals', searchJournalsHandler);

  // Ambient lights
  commandRouter.register('get-lights', getLightsHandler);
  commandRouter.register('create-light', createLightHandler);
  commandRouter.register('update-light', updateLightHandler);
  commandRouter.register('delete-light', deleteLightHandler);

  // Ambient sounds
  commandRouter.register('get-ambient-sounds', getAmbientSoundsHandler);
  commandRouter.register('create-ambient-sound', createAmbientSoundHandler);
  commandRouter.register('update-ambient-sound', updateAmbientSoundHandler);
  commandRouter.register('delete-ambient-sound', deleteAmbientSoundHandler);
  commandRouter.register('play-sound-at-position', playSoundAtPositionHandler);
  commandRouter.register('preload-sound', preloadSoundHandler);

  // Tiles
  commandRouter.register('get-tiles', getTilesHandler);
  commandRouter.register('create-tile', createTileHandler);
  commandRouter.register('update-tile', updateTileHandler);
  commandRouter.register('delete-tile', deleteTileHandler);

  // Drawings
  commandRouter.register('get-drawings', getDrawingsHandler);
  commandRouter.register('create-drawing', createDrawingHandler);
  commandRouter.register('update-drawing', updateDrawingHandler);
  commandRouter.register('delete-drawing', deleteDrawingHandler);

  // Measured templates
  commandRouter.register('get-templates', getTemplatesHandler);
  commandRouter.register('create-template', createTemplateHandler);
  commandRouter.register('update-template', updateTemplateHandler);
  commandRouter.register('delete-template', deleteTemplateHandler);

  // Regions
  commandRouter.register('get-regions', getRegionsHandler);
  commandRouter.register('get-region', getRegionHandler);
  commandRouter.register('create-region', createRegionHandler);
  commandRouter.register('update-region', updateRegionHandler);
  commandRouter.register('delete-region', deleteRegionHandler);
  commandRouter.register('create-region-behavior', createRegionBehaviorHandler);
  commandRouter.register('update-region-behavior', updateRegionBehaviorHandler);
  commandRouter.register('delete-region-behavior', deleteRegionBehaviorHandler);
  commandRouter.register('get-region-tokens', getRegionTokensHandler);
  commandRouter.register('test-region-point', testRegionPointHandler);

  // Cards
  commandRouter.register('get-card-stacks', getCardStacksHandler);
  commandRouter.register('get-card-stack', getCardStackHandler);
  commandRouter.register('create-card-stack', createCardStackHandler);
  commandRouter.register('update-card-stack', updateCardStackHandler);
  commandRouter.register('delete-card-stack', deleteCardStackHandler);
  commandRouter.register('create-card', createCardHandler);
  commandRouter.register('update-card', updateCardHandler);
  commandRouter.register('delete-card', deleteCardHandler);
  commandRouter.register('shuffle-cards', shuffleCardsHandler);
  commandRouter.register('deal-cards', dealCardsHandler);
  commandRouter.register('draw-cards', drawCardsHandler);
  commandRouter.register('pass-cards', passCardsHandler);
  commandRouter.register('play-card', playCardHandler);
  commandRouter.register('discard-card', discardCardHandler);
  commandRouter.register('recall-cards', recallCardsHandler);
  commandRouter.register('flip-card', flipCardHandler);
  commandRouter.register('show-card', showCardHandler);

  // Users
  commandRouter.register('get-users', getUsersHandler);
  commandRouter.register('get-user', getUserHandler);
  commandRouter.register('update-user', updateUserHandler);

  // Settings
  commandRouter.register('get-settings', getSettingsHandler);
  commandRouter.register('get-setting', getSettingHandler);
  commandRouter.register('set-setting', setSettingHandler);

  // Prototype tokens, actor tokens, core token movement
  commandRouter.register('get-prototype-token', getPrototypeTokenHandler);
  commandRouter.register('update-prototype-token', updatePrototypeTokenHandler);
  commandRouter.register('get-actor-tokens', getActorTokensHandler);
  commandRouter.register('get-token-images', getTokenImagesHandler);
  commandRouter.register('move-token-path', moveTokenPathHandler);
  commandRouter.register('stop-token-movement', stopTokenMovementHandler);
  commandRouter.register('pause-token-movement', pauseTokenMovementHandler);
  commandRouter.register('resume-token-movement', resumeTokenMovementHandler);
  commandRouter.register('measure-token-path', measureTokenPathHandler);
  commandRouter.register('find-token-path', findTokenPathHandler);
  commandRouter.register('get-token-movement-history', getTokenMovementHistoryHandler);
  commandRouter.register('revert-token-movement', revertTokenMovementHandler);
  commandRouter.register('clear-token-movement-history', clearTokenMovementHistoryHandler);
  commandRouter.register('select-tokens', selectTokensHandler);
  commandRouter.register('get-selected-tokens', getSelectedTokensHandler);
  commandRouter.register('set-targets', setTargetsHandler);
  commandRouter.register('show-speech-bubble', showSpeechBubbleHandler);

  // Doors
  commandRouter.register('get-door-sounds', getDoorSoundsHandler);

  // Effects (full snapshots, item effects)
  commandRouter.register('get-actor-effect', getActorEffectHandler);
  commandRouter.register('get-item-effects', getItemEffectsHandler);
  commandRouter.register('create-item-effect', createItemEffectHandler);
  commandRouter.register('update-item-effect', updateItemEffectHandler);
  commandRouter.register('delete-item-effect', deleteItemEffectHandler);

  // Roll tables (previews, results, folders)
  commandRouter.register('preview-table-roll', previewTableRollHandler);
  commandRouter.register('normalize-roll-table', normalizeRollTableHandler);
  commandRouter.register('create-roll-table-from-folder', createRollTableFromFolderHandler);
  commandRouter.register('create-table-result', createTableResultHandler);
  commandRouter.register('update-table-result', updateTableResultHandler);
  commandRouter.register('delete-table-result', deleteTableResultHandler);

  // Playlists (management)
  commandRouter.register('create-playlist', createPlaylistHandler);
  commandRouter.register('update-playlist', updatePlaylistHandler);
  commandRouter.register('delete-playlist', deletePlaylistHandler);
  commandRouter.register('update-playlist-sound', updatePlaylistSoundHandler);
  commandRouter.register('delete-playlist-sound', deletePlaylistSoundHandler);
  commandRouter.register('play-next-in-playlist', playNextInPlaylistHandler);
  commandRouter.register('import-playlist-sounds', importPlaylistSoundsHandler);

  // Hotbar
  commandRouter.register('get-hotbar', getHotbarHandler);
  commandRouter.register('assign-hotbar-slot', assignHotbarSlotHandler);
  commandRouter.register('move-hotbar-slot', moveHotbarSlotHandler);
  commandRouter.register('clear-hotbar-slot', clearHotbarSlotHandler);

  // Calendar
  commandRouter.register('get-calendar', getCalendarHandler);
  commandRouter.register('get-time-difference', getTimeDifferenceHandler);

  // Notifications and canvas helpers
  commandRouter.register('create-progress-notification', createProgressNotificationHandler);
  commandRouter.register('update-progress-notification', updateProgressNotificationHandler);
  commandRouter.register('remove-notification', removeNotificationHandler);
  commandRouter.register('measure-grid-path', measureGridPathHandler);
  commandRouter.register('snap-to-grid', snapToGridHandler);
  commandRouter.register('get-canvas-view', getCanvasViewHandler);
  commandRouter.register('show-scrolling-text', showScrollingTextHandler);

  // Documents
  commandRouter.register('get-document-ownership', getDocumentOwnershipHandler);
  commandRouter.register('set-document-ownership', setDocumentOwnershipHandler);
  commandRouter.register('get-document-flags', getDocumentFlagsHandler);
  commandRouter.register('set-document-flag', setDocumentFlagHandler);
  commandRouter.register('unset-document-flag', unsetDocumentFlagHandler);
  commandRouter.register('sort-document', sortDocumentHandler);
  commandRouter.register('search-documents', searchDocumentsHandler);
  commandRouter.register('export-document', exportDocumentHandler);
  commandRouter.register('import-document', importDocumentHandler);

  // Compendium management
  commandRouter.register('get-compendium-info', getCompendiumInfoHandler);
  commandRouter.register('create-compendium', createCompendiumHandler);
  commandRouter.register('duplicate-compendium', duplicateCompendiumHandler);
  commandRouter.register('configure-compendium', configureCompendiumHandler);
  commandRouter.register('delete-compendium', deleteCompendiumHandler);
  commandRouter.register('export-to-compendium', exportToCompendiumHandler);
  commandRouter.register('export-folder-to-compendium', exportFolderToCompendiumHandler);
  commandRouter.register('update-compendium-document', updateCompendiumDocumentHandler);
  commandRouter.register('delete-compendium-document', deleteCompendiumDocumentHandler);
  commandRouter.register('import-compendium', importCompendiumHandler);
  commandRouter.register('import-compendium-folder', importCompendiumFolderHandler);
  commandRouter.register('get-adventure', getAdventureHandler);
  commandRouter.register('import-adventure', importAdventureHandler);

  // Files
  commandRouter.register('browse-files', browseFilesHandler);
  commandRouter.register('create-directory', createDirectoryHandler);
  commandRouter.register('upload-file', uploadFileHandler);

  // Player dialogs
  commandRouter.register('ask-user', askUserHandler);
  commandRouter.register('get-user-answer', getUserAnswerHandler);
  commandRouter.register('cancel-user-question', cancelUserQuestionHandler);

  // Event push
  commandRouter.register('subscribe-events', subscribeEventsHandler);
  commandRouter.register('unsubscribe-events', unsubscribeEventsHandler);
  commandRouter.register('get-event-subscriptions', getEventSubscriptionsHandler);
  commandRouter.register('get-event-types', getEventTypesHandler);

  if (wsUrl) {
    mcpClient = createChannel('MCP', wsUrl, apiKey, wsConfig);
    mcpClient.connect();
  }

  if (apiUrl) {
    apiClient = createChannel('API', apiUrl, apiKey, wsConfig);
    apiClient.connect();
  }

  // A socket that died while the laptop slept or the network was down looks
  // open until a ping goes unanswered. Check right away when the browser says
  // it is back online or the tab becomes visible, and skip any backoff wait.
  window.addEventListener('online', wakeChannels);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      wakeChannels();
    }
  });
}

function wakeChannels(): void {
  for (const client of [mcpClient, apiClient]) {
    client?.pingNow();
    client?.reconnectNow();
  }
}

function createChannel(
  label: string,
  baseUrl: string,
  apiKey: string,
  wsConfig: { reconnectInterval: number; maxReconnectAttempts: number }
): WebSocketClient {
  const url = `${baseUrl}?apiKey=${encodeURIComponent(apiKey)}`;
  const client = new WebSocketClient({
    url,
    reconnectInterval: wsConfig.reconnectInterval,
    maxReconnectAttempts: wsConfig.maxReconnectAttempts,
    logPrefix: label
  });
  attachEventChannel(label, client);

  client.onConnect(() => {
    if (ui.notifications) {
      ui.notifications.info(`Foundry API Bridge | [${label}] Connected to server`);
    }
  });

  // 4001 and 4002 get their own notification below; the generic one would
  // only add noise right after it. onClose always runs before onDisconnect.
  let explainedByCloseCode = false;

  client.onClose((code) => {
    explainedByCloseCode = code === CLOSE_CODE_API_KEY_REJECTED || code === CLOSE_CODE_REPLACED;
    if (!ui.notifications) return;

    if (code === CLOSE_CODE_API_KEY_REJECTED) {
      ui.notifications.error(
        `Foundry API Bridge | [${label}] The server rejected the API key. Open Module Settings, paste the key again (use the Copy button on foundry-mcp.com) and reload the world.`,
        { permanent: true }
      );
    } else if (code === CLOSE_CODE_REPLACED) {
      ui.notifications.warn(
        `Foundry API Bridge | [${label}] Another Foundry client is connected with this API key (another browser, device or your host's own GM session). This one retries in 2 minutes.`
      );
    }
  });

  client.onDisconnect(() => {
    // Event subscriptions live as long as the connection; a server that reconnects subscribes again.
    dropEventChannel(label);
    if (explainedByCloseCode) {
      explainedByCloseCode = false;
      return;
    }
    if (ui.notifications) {
      ui.notifications.warn(`Foundry API Bridge | [${label}] Disconnected from server`);
    }
  });

  client.onMessage((command) => {
    if (!commandRouter) return;

    commandRouter.execute(command, { channel: label })
      .then(response => {
        client.send(response);
      })
      .catch((error: unknown) => {
        console.error(`Foundry API Bridge | [${label}] Command execution failed:`, error);
      });
  });

  return client;
}

export {};
