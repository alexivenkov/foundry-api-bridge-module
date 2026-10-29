import type { SwadeActorTarget } from '@/systems/swade/shared/domain';
import type { SwadeSetStatusOutcome } from '@/systems/swade/status/domain/StatusOutcome';

export interface SetStatusOptions {
  readonly status: string;
  readonly active: boolean;
  readonly overlay: boolean | undefined;
}

/** Outbound port for SWADE statuses via the system's `actor.toggleActiveEffect`, which applies linked statuses itself. */
export interface SwadeStatusPort {
  setStatus(target: SwadeActorTarget, options: SetStatusOptions): Promise<SwadeSetStatusOutcome>;
}
