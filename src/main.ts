import { ConfigManager } from '@/config/ConfigManager';
import { registerSettings, registerMenu, getWsUrl, getApiUrl, getApiKey } from '@/settings/SettingsManager';
import { WebSocketClient } from '@/transport';
import {
  CommandRouter,
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
  deleteActorHandler,
  getActorsHandler,
  getActorHandler,
  filterActorsHandler,
  filterItemsHandler,
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

const MODULE_VERSION = '8.2.0';

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

  initializeModule();
});

function initializeModule(): void {
  try {
    ConfigManager.initialize();
    const config = ConfigManager.getConfig();

    const wsUrl = getWsUrl();
    const apiUrl = getApiUrl();
    const apiKey = getApiKey();

    if (!apiKey) {
      console.log(`Foundry API Bridge | v${MODULE_VERSION} loaded. Configure API Key in module settings to connect.`);
      return;
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
  commandRouter = new CommandRouter();

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
  commandRouter.register('dnd5e/roll-attack', rollAttackHandler);
  commandRouter.register('roll-attack', rollAttackHandler); // @deprecated alias of 'dnd5e/roll-attack'
  commandRouter.register('dnd5e/roll-damage', rollDamageHandler);
  commandRouter.register('roll-damage', rollDamageHandler); // @deprecated alias of 'dnd5e/roll-damage'

  // Actor CRUD
  commandRouter.register('create-actor', createActorHandler);
  commandRouter.register('create-actor-from-compendium', createActorFromCompendiumHandler);
  commandRouter.register('update-actor', updateActorHandler);
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

  if (wsUrl) {
    mcpClient = createChannel('MCP', wsUrl, apiKey, wsConfig);
    mcpClient.connect();
  }

  if (apiUrl) {
    apiClient = createChannel('API', apiUrl, apiKey, wsConfig);
    apiClient.connect();
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

  client.onConnect(() => {
    if (ui.notifications) {
      ui.notifications.info(`Foundry API Bridge | [${label}] Connected to server`);
    }
  });

  client.onDisconnect(() => {
    if (ui.notifications) {
      ui.notifications.warn(`Foundry API Bridge | [${label}] Disconnected from server`);
    }
  });

  client.onMessage((command) => {
    if (!commandRouter) return;

    commandRouter.execute(command)
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
