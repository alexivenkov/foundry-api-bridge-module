import { ValidationError } from '@/kernel';
import type { DoorState, DoorType } from '@/core/walls/domain';

// `set-door-state` speaks numbers on the wire. They are part of the wire
// contract and are kept apart from the codes the core stores, which may drift.

const DOOR_STATE_BY_WIRE_CODE: Readonly<Record<number, DoorState>> = { 0: 'closed', 1: 'open', 2: 'locked' };
const DOOR_STATE_WIRE_CODE: Readonly<Record<DoorState, number>> = { closed: 0, open: 1, locked: 2 };
const DOOR_TYPE_WIRE_CODE: Readonly<Record<DoorType, number>> = { none: 0, door: 1, secret: 2 };

export function doorStateFromWireCode(code: number): DoorState {
  const state = DOOR_STATE_BY_WIRE_CODE[code];
  if (state === undefined) {
    throw new ValidationError(
      `Invalid door state: ${String(code)}. Must be 0 (closed), 1 (open), or 2 (locked)`
    );
  }
  return state;
}

export function doorStateToWireCode(state: DoorState): number {
  return DOOR_STATE_WIRE_CODE[state];
}

export function doorTypeToWireCode(type: DoorType): number {
  return DOOR_TYPE_WIRE_CODE[type];
}
