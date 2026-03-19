import { ConfigManager } from '@/config/ConfigManager';
import { ApiClient } from '@/api/ApiClient';
import { WorldDataCollector } from '@/collectors/WorldDataCollector';
import { CompendiumCollector } from '@/collectors/CompendiumCollector';
import { UpdateLoop } from '@/core/UpdateLoop';
import { registerSettings, registerMenu, getServerUrl, getWsUrl, getApiKey } from '@/settings/SettingsManager';
import { WebSocketClient } from '@/transport';
import {
  CommandRouter,
  rollDiceHandler,
  rollSkillHandler,
  rollSaveHandler,
  rollAbilityHandler,
  rollAttackHandler,
  rollDamageHandler,
  createActorHandler,
  createActorFromCompendiumHandler,
  updateActorHandler,
  deleteActorHandler,
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
  getActorItemsHandler,
  useItemHandler,
  addItemToActorHandler,
  addItemFromCompendiumHandler,
  updateActorItemHandler,
  deleteActorItemHandler,
  getActorEffectsHandler,
  toggleActorStatusHandler,
  addActorEffectHandler,
  removeActorEffectHandler,
  updateActorEffectHandler
} from '@/commands';
import type { WorldData, CompendiumData, CompendiumMetadata } from '@/types/foundry';
import { isDefaultOrEmptySettings } from '@/utils/validation';

const MODULE_VERSION = '6.1.0';

let updateLoop: UpdateLoop | null = null;
let apiClient: ApiClient | null = null;
let worldCollector: WorldDataCollector | null = null;
let compendiumCollector: CompendiumCollector | null = null;
let wsClient: WebSocketClient | null = null;
let commandRouter: CommandRouter | null = null;

Hooks.once('init', () => {
  registerSettings();
  void registerMenu();
});

Hooks.on('renderSettingsConfig', (_app: unknown, html: JQuery) => {
  const apiKeyInput = html.find('input[name="foundry-api-bridge.apiKey"]');
  if (!apiKeyInput.length) return;

  const formGroup = apiKeyInput.closest('.form-group');
  if (!formGroup.length) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = '<i class="fas fa-key"></i> Get API Key';
  button.style.cssText = 'margin-top: 4px; padding: 4px 12px; cursor: pointer; font-size: 12px;';
  button.addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://foundry-mcp.com/auth/patreon', '_blank');
  });

  const hint = document.createElement('p');
  hint.className = 'notes';
  hint.textContent = 'Free account available — no subscription required';
  hint.style.cssText = 'margin-top: 2px; font-size: 11px; font-style: italic;';

  formGroup.append(button);
  formGroup.append(hint);
});

Hooks.once('ready', () => {
  if (!game.user?.isGM) {
    return;
  }

  try {
    ConfigManager.initialize();
    const config = ConfigManager.getConfig();

    const serverUrl = getServerUrl();
    const wsUrl = getWsUrl();
    const apiKey = getApiKey();

    if (isDefaultOrEmptySettings(serverUrl, wsUrl, apiKey)) {
      console.log(`Foundry API Bridge | v${MODULE_VERSION} loaded. Configure Server URL, WebSocket URL, and API Key in module settings to connect.`);
      return;
    }

    apiClient = new ApiClient(serverUrl, apiKey);
    worldCollector = new WorldDataCollector();
    compendiumCollector = new CompendiumCollector();

    if (config.features.periodicUpdates && config.features.collectWorldData) {
      updateLoop = new UpdateLoop(
        config.apiServer.updateInterval,
        worldCollector,
        apiClient,
        config.apiServer.endpoints.worldData
      );
      updateLoop.start();
    }

    console.log(`Foundry API Bridge | v${MODULE_VERSION} initialized`);

    if (config.features.autoLoadCompendium && config.compendium.autoLoad.length > 0) {
      compendiumCollector.autoLoad(
        config.compendium.autoLoad,
        apiClient,
        config.apiServer.endpoints.compendium
      ).catch((error: unknown) => {
        console.error('Foundry API Bridge | Error during auto-load:', error);
      });
    }

    if (config.webSocket.enabled) {
      initializeWebSocket(config.webSocket, wsUrl, apiKey);
    }

  } catch (error: unknown) {
    console.error('Foundry API Bridge | Initialization failed:', error);
  }
});

function initializeWebSocket(wsConfig: { reconnectInterval: number; maxReconnectAttempts: number }, wsUrl: string, apiKey: string): void {
  commandRouter = new CommandRouter();
  commandRouter.register('roll-dice', rollDiceHandler);
  commandRouter.register('roll-skill', rollSkillHandler);
  commandRouter.register('roll-save', rollSaveHandler);
  commandRouter.register('roll-ability', rollAbilityHandler);
  commandRouter.register('roll-attack', rollAttackHandler);
  commandRouter.register('roll-damage', rollDamageHandler);
  commandRouter.register('create-actor', createActorHandler);
  commandRouter.register('create-actor-from-compendium', createActorFromCompendiumHandler);
  commandRouter.register('update-actor', updateActorHandler);
  commandRouter.register('delete-actor', deleteActorHandler);
  commandRouter.register('create-journal', createJournalHandler);
  commandRouter.register('update-journal', updateJournalHandler);
  commandRouter.register('delete-journal', deleteJournalHandler);
  commandRouter.register('create-journal-page', createJournalPageHandler);
  commandRouter.register('update-journal-page', updateJournalPageHandler);
  commandRouter.register('delete-journal-page', deleteJournalPageHandler);
  commandRouter.register('create-combat', createCombatHandler);
  commandRouter.register('add-combatant', addCombatantHandler);
  commandRouter.register('remove-combatant', removeCombatantHandler);
  commandRouter.register('start-combat', startCombatHandler);
  commandRouter.register('end-combat', endCombatHandler);
  commandRouter.register('delete-combat', deleteCombatHandler);
  commandRouter.register('next-turn', nextTurnHandler);
  commandRouter.register('previous-turn', previousTurnHandler);
  commandRouter.register('get-combat-state', getCombatStateHandler);
  commandRouter.register('roll-initiative', rollInitiativeHandler);
  commandRouter.register('set-initiative', setInitiativeHandler);
  commandRouter.register('roll-all-initiative', rollAllInitiativeHandler);
  commandRouter.register('update-combatant', updateCombatantHandler);
  commandRouter.register('set-combatant-defeated', setCombatantDefeatedHandler);
  commandRouter.register('toggle-combatant-visibility', toggleCombatantVisibilityHandler);
  commandRouter.register('create-token', createTokenHandler);
  commandRouter.register('delete-token', deleteTokenHandler);
  commandRouter.register('move-token', moveTokenHandler);
  commandRouter.register('update-token', updateTokenHandler);
  commandRouter.register('get-scene-tokens', getSceneTokensHandler);
  commandRouter.register('get-actor-items', getActorItemsHandler);
  commandRouter.register('use-item', useItemHandler);
  commandRouter.register('add-item-to-actor', addItemToActorHandler);
  commandRouter.register('add-item-from-compendium', addItemFromCompendiumHandler);
  commandRouter.register('update-actor-item', updateActorItemHandler);
  commandRouter.register('delete-actor-item', deleteActorItemHandler);
  commandRouter.register('get-actor-effects', getActorEffectsHandler);
  commandRouter.register('toggle-actor-status', toggleActorStatusHandler);
  commandRouter.register('add-actor-effect', addActorEffectHandler);
  commandRouter.register('remove-actor-effect', removeActorEffectHandler);
  commandRouter.register('update-actor-effect', updateActorEffectHandler);

  const wsConnectUrl = apiKey ? `${wsUrl}?apiKey=${encodeURIComponent(apiKey)}` : wsUrl;
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

Hooks.on('pauseGame', (paused: boolean) => {
  if (!updateLoop) return;

  if (paused) {
    updateLoop.stop();
  } else {
    updateLoop.start();
  }
});

window.FoundryAPIBridge = {
  collectWorldData: (): WorldData => {
    if (!worldCollector) throw new Error('Module not initialized');
    return worldCollector.collect();
  },
  sendDataToServer: async (data: WorldData): Promise<void> => {
    if (!apiClient) throw new Error('Module not initialized');
    const config = ConfigManager.getConfig();
    await apiClient.sendWorldData(config.apiServer.endpoints.worldData, data);
  },
  startUpdateLoop: (): void => {
    if (!updateLoop) throw new Error('Update loop not initialized');
    updateLoop.start();
  },
  stopUpdateLoop: (): void => {
    if (!updateLoop) throw new Error('Update loop not initialized');
    updateLoop.stop();
  },
  collectCompendiumMetadata: (): CompendiumMetadata[] => {
    if (!compendiumCollector) throw new Error('Module not initialized');
    return compendiumCollector.collectMetadata();
  },
  loadCompendiumContents: async (packId: string): Promise<CompendiumData | null> => {
    if (!compendiumCollector) throw new Error('Module not initialized');
    return compendiumCollector.loadContents(packId);
  },
  sendCompendiumToServer: async (packId: string, packData: CompendiumData): Promise<void> => {
    if (!apiClient) throw new Error('Module not initialized');
    const config = ConfigManager.getConfig();
    await apiClient.sendCompendium(config.apiServer.endpoints.compendium, packId, packData);
  },
  loadAndSendCompendium: async (packId: string): Promise<void> => {
    if (!compendiumCollector || !apiClient) throw new Error('Module not initialized');
    const config = ConfigManager.getConfig();
    const packData = await compendiumCollector.loadContents(packId);
    if (packData) {
      await apiClient.sendCompendium(config.apiServer.endpoints.compendium, packId, packData);
      console.log(`Foundry API Bridge | Compendium ${packId} sent successfully`);
    }
  },
  autoLoadCompendium: async (): Promise<void> => {
    if (!compendiumCollector || !apiClient) throw new Error('Module not initialized');
    const config = ConfigManager.getConfig();
    await compendiumCollector.autoLoad(
      config.compendium.autoLoad,
      apiClient,
      config.apiServer.endpoints.compendium
    );
  },
  API_SERVER_URL: '',
  UPDATE_INTERVAL: 0,
  AUTO_LOAD_COMPENDIUM: []
};

Object.defineProperties(window.FoundryAPIBridge, {
  API_SERVER_URL: {
    get: () => getServerUrl()
  },
  UPDATE_INTERVAL: {
    get: () => ConfigManager.getConfig().apiServer.updateInterval
  },
  AUTO_LOAD_COMPENDIUM: {
    get: () => ConfigManager.getConfig().compendium.autoLoad
  }
});

export {};
