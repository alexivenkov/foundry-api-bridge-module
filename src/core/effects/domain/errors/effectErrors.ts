import { DomainError } from '@/kernel';

export class EffectNotFoundError extends DomainError {
  constructor(public readonly effectId: string) {
    super(`Effect not found: ${effectId}`);
    this.name = 'EffectNotFoundError';
    Object.setPrototypeOf(this, EffectNotFoundError.prototype);
  }
}

export class EffectCreationFailedError extends DomainError {
  constructor() {
    super('Failed to create effect');
    this.name = 'EffectCreationFailedError';
    Object.setPrototypeOf(this, EffectCreationFailedError.prototype);
  }
}

/** The item an item-effect command names is not there: in the world, or on the actor. */
export class EffectItemNotFoundError extends DomainError {
  constructor(public readonly itemId: string) {
    super(`Item not found: ${itemId}`);
    this.name = 'EffectItemNotFoundError';
    Object.setPrototypeOf(this, EffectItemNotFoundError.prototype);
  }
}

function listing(known: readonly string[]): string {
  return known.length > 0 ? known.join(', ') : 'none';
}

/** An id the world does not register: the core would reject it, or silently ignore it. */
export class UnknownEffectRegistryIdError extends DomainError {
  constructor(
    public readonly what: string,
    public readonly id: string,
    public readonly known: readonly string[]
  ) {
    super(`Unknown effect ${what}: ${id} (valid: ${listing(known)})`);
    this.name = 'UnknownEffectRegistryIdError';
    Object.setPrototypeOf(this, UnknownEffectRegistryIdError.prototype);
  }
}

/** Foundry 14 turns an origin it cannot parse into null without a word, so it is refused here. */
export class InvalidEffectOriginError extends DomainError {
  constructor(
    public readonly origin: string,
    public readonly reason: string
  ) {
    super(`Invalid effect origin: ${origin} (${reason})`);
    this.name = 'InvalidEffectOriginError';
    Object.setPrototypeOf(this, InvalidEffectOriginError.prototype);
  }
}
