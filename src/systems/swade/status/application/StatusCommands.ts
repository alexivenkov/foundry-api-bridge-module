import type { SwadeActorTarget } from '@/systems/swade/shared/domain';

export interface SetStatusCommand {
  readonly target: SwadeActorTarget;
  readonly status: string;
  readonly active: boolean;
  readonly overlay: boolean | undefined;
}
