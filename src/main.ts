import { ConfigManager } from '@/config/ConfigManager';
import { registerSettings, registerMenu, getWsUrl, getApiKey } from '@/settings/SettingsManager';
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
  captureSceneHandler,
  listRollTablesHandler,
  getRollTableHandler,
  rollOnTableHandler,
  resetTableHandler,
  createRollTableHandler,
  updateRollTableHandler,
  deleteRollTableHandler
} from '@/commands';

const MODULE_VERSION = '7.3.1';

let wsClient: WebSocketClient | null = null;
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
    const apiKey = getApiKey();

    if (!wsUrl || !apiKey) {
      console.log(`Foundry API Bridge | v${MODULE_VERSION} loaded. Configure WebSocket URL and API Key in module settings to connect.`);
      return;
    }

    initializeWebSocket(config.webSocket, wsUrl, apiKey);
    console.log(`Foundry API Bridge | v${MODULE_VERSION} initialized`);

  } catch (error: unknown) {
    console.error('Foundry API Bridge | Initialization failed:', error);
  }
}

function initializeWebSocket(wsConfig: { reconnectInterval: number; maxReconnectAttempts: number }, wsUrl: string, apiKey: string): void {
  commandRouter = new CommandRouter();

  // Pull queries
  commandRouter.register('get-world-info', getWorldInfoHandler);
  commandRouter.register('get-actors', getActorsHandler);
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

  // Dice & chat
  commandRouter.register('roll-dice', rollDiceHandler);
  commandRouter.register('send-chat-message', sendChatMessageHandler);
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

  const wsConnectUrl = `${wsUrl}?apiKey=${encodeURIComponent(apiKey)}`;
  wsClient = new WebSocketClient({
    url: wsConnectUrl,
    reconnectInterval: wsConfig.reconnectInterval,
    maxReconnectAttempts: wsConfig.maxReconnectAttempts
  });

  wsClient.onConnect(() => {
    console.log('Foundry API Bridge | WebSocket connected to server');
    if (ui.notifications) {
      ui.notifications.info('Foundry API Bridge | Connected to server');
    }
  });

  wsClient.onDisconnect(() => {
    console.log('Foundry API Bridge | WebSocket disconnected from server');
    if (ui.notifications) {
      ui.notifications.warn('Foundry API Bridge | Disconnected from server');
    }
  });

  wsClient.onMessage((command) => {
    if (!commandRouter || !wsClient) return;

    commandRouter.execute(command)
      .then(response => {
        wsClient?.send(response);
      })
      .catch((error: unknown) => {
        console.error('Foundry API Bridge | Command execution failed:', error);
      });
  });

  wsClient.connect();
}

export {};
