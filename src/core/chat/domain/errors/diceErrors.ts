import { ValidationError } from '@/kernel';

export class RollFormulaRequiredError extends ValidationError {
  constructor() {
    super('Roll formula is required');
    this.name = 'RollFormulaRequiredError';
    Object.setPrototypeOf(this, RollFormulaRequiredError.prototype);
  }
}

export class RollFormulaTooLongError extends ValidationError {
  constructor(
    public readonly length: number,
    public readonly limit: number
  ) {
    super(`Roll formula is too long (${String(length)} > ${String(limit)} characters)`);
    this.name = 'RollFormulaTooLongError';
    Object.setPrototypeOf(this, RollFormulaTooLongError.prototype);
  }
}

export class UnresolvedRollDataError extends ValidationError {
  constructor(public readonly references: readonly string[]) {
    super(`Roll formula references data that is not set: ${references.join(', ')}`);
    this.name = 'UnresolvedRollDataError';
    Object.setPrototypeOf(this, UnresolvedRollDataError.prototype);
  }
}

export class TooManySimulatedDiceError extends ValidationError {
  constructor(
    public readonly count: number,
    public readonly limit: number
  ) {
    super(`Simulation asks for too many dice (${String(count)} > ${String(limit)}); lower the iterations`);
    this.name = 'TooManySimulatedDiceError';
    Object.setPrototypeOf(this, TooManySimulatedDiceError.prototype);
  }
}

export class TooManyDiceError extends ValidationError {
  constructor(
    public readonly count: number,
    public readonly limit: number
  ) {
    super(`Roll formula asks for too many dice (${String(count)} > ${String(limit)})`);
    this.name = 'TooManyDiceError';
    Object.setPrototypeOf(this, TooManyDiceError.prototype);
  }
}
