import {
  CanvasTokensUnavailableError,
  TokenNotOnCanvasError,
  type TokenTargeting
} from '@/core/tokens/domain';
import type { SetTokenTargetCommand } from './commands';

export interface TokenTargetingServiceDependencies {
  readonly targeting: TokenTargeting;
}

export class TokenTargetingService {
  constructor(private readonly deps: TokenTargetingServiceDependencies) {}

  setTarget(command: SetTokenTargetCommand): void {
    if (!this.deps.targeting.isAvailable()) {
      throw new CanvasTokensUnavailableError();
    }
    if (!this.deps.targeting.setTarget(command.tokenId, command.targeted, command.releaseOthers)) {
      throw new TokenNotOnCanvasError(command.tokenId);
    }
  }

  /** Releases every target of the current user; returns how many there were. */
  clearTargets(): number {
    return this.deps.targeting.clearTargets();
  }
}
