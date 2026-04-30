import { ConfigManager } from '@/config/ConfigManager';
import { registerSettings, registerMenu, getWsUrl, getApiUrl, getApiKey } from '@/settings/SettingsManager';
import { WebSocketClient } from '@/transport';
import {
  CommandRouter,
  rollDiceHandler,
  sendChatMessageHandler,
  rollSkillHandler,
  rollSaveHandler,
  rollAbilityHandler,
  rollAttackHandler,
  rollDamageHandler,
  createActorHandler,
  createActorFromCompendiumHandler,
  updateActorHandler,
  deleteActorHandler,
  getActorsHandler,
  getActorHandler,
  filterActorsHandler,
  getWorldInfoHandler,
  getJournalsHandler,
  getJournalHandler,
  getItemsHandler,
  getItemHandler,
  getCompendiumsHandler,
  getCompendiumHandler,
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
  getSceneHandler,
  getScenesListHandler,
  activateSceneHandler,
  getActorItemsHandler,
  useItemHandler,
  activateItemHandler,
  addItemToActorHandler,
  addItemFromCompendiumHandler,
  updateActorItemHandler,
  deleteActorItemHandler,
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
  getChatMessagesHandler,
  deleteChatMessageHandler,
  updateChatMessageHandler,
  clearChatHandler,
  exportChatHandler
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
  commandRouter.register('get-actor', getActorHandler);
  commandRouter.register('get-journals', getJournalsHandler);
  commandRouter.register('get-journal', getJournalHandler);
  commandRouter.register('get-items', getItemsHandler);
  commandRouter.register('get-item', getItemHandler);
  commandRouter.register('get-compendiums', getCompendiumsHandler);
  commandRouter.register('get-compendium', getCompendiumHandler);
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
  commandRouter.register('roll-skill', rollSkillHandler);
  commandRouter.register('roll-save', rollSaveHandler);
  commandRouter.register('roll-ability', rollAbilityHandler);
  commandRouter.register('roll-attack', rollAttackHandler);
  commandRouter.register('roll-damage', rollDamageHandler);

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

  // Items
  commandRouter.register('use-item', useItemHandler);
  commandRouter.register('activate-item', activateItemHandler);
  commandRouter.register('add-item-to-actor', addItemToActorHandler);
  commandRouter.register('add-item-from-compendium', addItemFromCompendiumHandler);
  commandRouter.register('update-actor-item', updateActorItemHandler);
  commandRouter.register('delete-actor-item', deleteActorItemHandler);

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

  // Doors
  commandRouter.register('set-door-state', setDoorStateHandler);

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
