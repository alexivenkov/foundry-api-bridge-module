import { ConfigManager } from './config/ConfigManager';
import { ApiClient } from './api/ApiClient';
import { WorldDataCollector } from './collectors/WorldDataCollector';
import { CompendiumCollector } from './collectors/CompendiumCollector';
import { UpdateLoop } from './core/UpdateLoop';
import { registerSettings, registerMenu } from './settings/SettingsManager';
import type { WorldData, CompendiumData } from './types/foundry';

console.log('Foundry API Bridge | Loading module v3.0.0...');

let updateLoop: UpdateLoop | null = null;
let apiClient: ApiClient | null = null;
let worldCollector: WorldDataCollector | null = null;
let compendiumCollector: CompendiumCollector | null = null;

Hooks.once('init', () => {
  registerSettings();
  void registerMenu();
  console.log('Foundry API Bridge | Settings registered');
});

Hooks.once('ready', () => {
  console.log('Foundry API Bridge | Module initializing...');

  if (!game.user?.isGM) {
    console.log('Foundry API Bridge | Module disabled for non-GM users');
    return;
  }

  try {
    ConfigManager.initialize();
    const config = ConfigManager.getConfig();

    apiClient = new ApiClient(config.apiServer.url);
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

    console.log('Foundry API Bridge | Module initialized successfully');

    if (config.features.autoLoadCompendium && config.compendium.autoLoad.length > 0) {
      compendiumCollector.autoLoad(
        config.compendium.autoLoad,
        apiClient,
        config.apiServer.endpoints.compendium
      ).catch((error: unknown) => {
        console.error('Foundry API Bridge | Error during auto-load:', error);
      });
    }

  } catch (error: unknown) {
    console.error('Foundry API Bridge | Initialization failed:', error);
  }
});

Hooks.on('pauseGame', (paused: boolean) => {
  if (!updateLoop) return;

  if (paused) {
    updateLoop.stop();
  } else {
    updateLoop.start();
  }
});

window.FoundryAPIBridge = {
  collectWorldData: () => {
    if (!worldCollector) throw new Error('Module not initialized');
    return worldCollector.collect();
  },
  sendDataToServer: async (data: WorldData) => {
    if (!apiClient) throw new Error('Module not initialized');
    const config = ConfigManager.getConfig();
    await apiClient.sendWorldData(config.apiServer.endpoints.worldData, data);
  },
  startUpdateLoop: () => {
    if (!updateLoop) throw new Error('Update loop not initialized');
    updateLoop.start();
  },
  stopUpdateLoop: () => {
    if (!updateLoop) throw new Error('Update loop not initialized');
    updateLoop.stop();
  },
  collectCompendiumMetadata: () => {
    if (!compendiumCollector) throw new Error('Module not initialized');
    return compendiumCollector.collectMetadata();
  },
  loadCompendiumContents: async (packId: string) => {
    if (!compendiumCollector) throw new Error('Module not initialized');
    return compendiumCollector.loadContents(packId);
  },
  sendCompendiumToServer: async (packId: string, packData: CompendiumData) => {
    if (!apiClient) throw new Error('Module not initialized');
    const config = ConfigManager.getConfig();
    await apiClient.sendCompendium(config.apiServer.endpoints.compendium, packId, packData);
  },
  loadAndSendCompendium: async (packId: string) => {
    if (!compendiumCollector || !apiClient) throw new Error('Module not initialized');
    const config = ConfigManager.getConfig();
    const packData = await compendiumCollector.loadContents(packId);
    if (packData) {
      await apiClient.sendCompendium(config.apiServer.endpoints.compendium, packId, packData);
      console.log(`✓ Compendium ${packId} loaded and sent successfully`);
    }
  },
  autoLoadCompendium: async () => {
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
    get: () => ConfigManager.getConfig().apiServer.url
  },
  UPDATE_INTERVAL: {
    get: () => ConfigManager.getConfig().apiServer.updateInterval
  },
  AUTO_LOAD_COMPENDIUM: {
    get: () => ConfigManager.getConfig().compendium.autoLoad
  }
});

export {};
