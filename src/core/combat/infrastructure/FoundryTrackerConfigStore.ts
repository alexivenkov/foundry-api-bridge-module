import { foundryGeneration } from '@/compat/foundryVersion';
import type { CombatTrackerConfig, TrackerConfigStore } from '@/core/combat/domain';
import type { CombatWorldGameProvider } from './foundryEncounterTypes';
import {
  TRACKER_CONFIG_KEY,
  TRACKER_CONFIG_NAMESPACE,
  type CombatConfigurationProvider
} from './foundryTrackerConfigTypes';
import { toFoundryTrackerConfig, toTrackerConfig } from './trackerConfigMapper';

const TURN_MARKERS_SINCE = 13;

const configurationFromGlobalThis: CombatConfigurationProvider = () =>
  (globalThis as { CONFIG?: { Combat?: { settings?: ReturnType<CombatConfigurationProvider> } } }).CONFIG?.Combat
    ?.settings;

/** The core setting `combatTrackerConfig`, and nothing else. */
export class FoundryTrackerConfigStore implements TrackerConfigStore {
  constructor(
    private readonly worldProvider: CombatWorldGameProvider,
    private readonly configuration: CombatConfigurationProvider = configurationFromGlobalThis
  ) {}

  turnMarkersAvailable(): boolean {
    return foundryGeneration() >= TURN_MARKERS_SINCE;
  }

  readConfig(): CombatTrackerConfig {
    return toTrackerConfig(this.stored(), this.turnMarkersAvailable());
  }

  async writeConfig(config: CombatTrackerConfig): Promise<void> {
    await this.worldProvider
      .getGame()
      .settings.set(TRACKER_CONFIG_NAMESPACE, TRACKER_CONFIG_KEY, toFoundryTrackerConfig(this.stored(), config));
  }

  turnMarkerAnimations(): readonly string[] {
    const choices = this.configuration()?.turnMarkerAnimations;
    return Array.isArray(choices) ? choices.map((choice) => choice.value) : [];
  }

  private stored(): unknown {
    return this.worldProvider.getGame().settings.get(TRACKER_CONFIG_NAMESPACE, TRACKER_CONFIG_KEY);
  }
}
