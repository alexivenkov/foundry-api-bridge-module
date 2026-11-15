import { CoreFeatureUnavailableError } from '@/core/shared';
import {
  UnknownTurnMarkerAnimationError,
  applyTrackerConfigChanges,
  hasTrackerConfigChanges,
  type CombatTrackerConfig,
  type TrackerConfigStore
} from '@/core/combat/domain';
import type { UpdateTrackerConfigCommand } from './commands';

export interface TrackerConfigServiceDependencies {
  readonly config: TrackerConfigStore;
}

export interface TrackerConfigView {
  readonly config: CombatTrackerConfig;
  /** Null on cores without turn markers. */
  readonly turnMarkerAnimations: readonly string[] | null;
}

/** The one core setting the combat tracker is configured by. */
export class TrackerConfigService {
  constructor(private readonly deps: TrackerConfigServiceDependencies) {}

  getConfig(): TrackerConfigView {
    return this.view(this.deps.config.readConfig());
  }

  /** A partial change is merged into the stored configuration; one that names nothing is not sent. */
  async updateConfig(command: UpdateTrackerConfigCommand): Promise<TrackerConfigView> {
    const { changes } = command;
    if (changes.turnMarker !== undefined && !this.deps.config.turnMarkersAvailable()) {
      throw new CoreFeatureUnavailableError('Turn markers require Foundry 13 or newer');
    }
    const animation = changes.turnMarker?.animation;
    if (animation !== undefined) {
      this.requireKnownAnimation(animation);
    }

    const current = this.deps.config.readConfig();
    if (!hasTrackerConfigChanges(changes)) {
      return this.view(current);
    }
    await this.deps.config.writeConfig(applyTrackerConfigChanges(current, changes));
    return this.getConfig();
  }

  /** An unknown animation would be stored, and leave the markers without one. */
  private requireKnownAnimation(animation: string): void {
    const known = this.deps.config.turnMarkerAnimations();
    if (known.length > 0 && !known.includes(animation)) {
      throw new UnknownTurnMarkerAnimationError(animation, known);
    }
  }

  private view(config: CombatTrackerConfig): TrackerConfigView {
    return {
      config,
      turnMarkerAnimations: this.deps.config.turnMarkersAvailable() ? this.deps.config.turnMarkerAnimations() : null
    };
  }
}
