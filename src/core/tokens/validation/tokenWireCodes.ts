import { ValidationError } from '@/kernel';
import type { TokenDisposition, TokenNameDisplay } from '@/core/tokens/domain';

// `update-token` takes numbers for `disposition` and `displayName`, and token
// results report `disposition` as a number. These numbers are part of the wire
// contract and are kept apart from the codes the core stores, which may drift.

const DISPOSITION_BY_WIRE_CODE: Readonly<Record<number, TokenDisposition>> = {
  [-2]: 'secret',
  [-1]: 'hostile',
  0: 'neutral',
  1: 'friendly'
};

const DISPOSITION_WIRE_CODE: Readonly<Record<TokenDisposition, number>> = {
  secret: -2,
  hostile: -1,
  neutral: 0,
  friendly: 1
};

const NAME_DISPLAY_BY_WIRE_CODE: Readonly<Record<number, TokenNameDisplay>> = {
  0: 'none',
  10: 'control',
  20: 'owner-hover',
  30: 'hover',
  40: 'owner',
  50: 'always'
};

export function dispositionFromWireCode(code: number): TokenDisposition {
  const disposition = DISPOSITION_BY_WIRE_CODE[code];
  if (disposition === undefined) {
    throw new ValidationError(
      `Invalid disposition: ${String(code)}. Must be -2 (secret), -1 (hostile), 0 (neutral) or 1 (friendly)`
    );
  }
  return disposition;
}

export function dispositionToWireCode(disposition: TokenDisposition): number {
  return DISPOSITION_WIRE_CODE[disposition];
}

export function nameDisplayFromWireCode(code: number): TokenNameDisplay {
  const display = NAME_DISPLAY_BY_WIRE_CODE[code];
  if (display === undefined) {
    throw new ValidationError(`Invalid displayName: ${String(code)}. Must be 0, 10, 20, 30, 40 or 50`);
  }
  return display;
}
