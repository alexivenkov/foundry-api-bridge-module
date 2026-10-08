import type {
  AppliedHitPoints,
  HitPointsDelta,
  MidiCaptureResult,
  MidiWorkflowCapture,
  MidiWorkflowOutcome,
  MidiWorkflowPort
} from '@/systems/dnd5e/item-actions/domain';
import {
  getFromUuidSync,
  getHooks,
  isMidiQolActive,
  type FoundryChatMessage,
  type MidiDamageListEntry,
  type MidiWorkflow
} from './foundryItemActionTypes';

/**
 * Below the platform's 30 s command gate, so a stuck workflow is reported as a
 * timeout instead of the gateway cutting the command off.
 */
export const MIDI_WORKFLOW_TIMEOUT = 25000;

function tokenIdFromUuid(uuid: string | undefined): string | undefined {
  if (!uuid) return undefined;
  const parts = uuid.split('.');
  const tokenIndex = parts.lastIndexOf('Token');
  return tokenIndex >= 0 ? parts[tokenIndex + 1] : undefined;
}

function toHitPointsDelta(entry: MidiDamageListEntry): HitPointsDelta | undefined {
  if (entry.oldHP === undefined || entry.newHP === undefined) {
    return undefined;
  }
  const oldTemp = entry.oldTempHP ?? 0;
  const newTemp = entry.newTempHP ?? 0;
  const expectedChange = entry.oldHP !== entry.newHP || oldTemp !== newTemp;

  // damageList is computed before the HP update lands: compare with the actor now.
  let applied = !expectedChange;
  const uuid = entry.targetUuid ?? entry.tokenUuid;
  const current = uuid ? getFromUuidSync()?.(uuid)?.actor?.system?.attributes?.hp : undefined;
  if (expectedChange && current) {
    applied = current.value === entry.newHP && (current.temp ?? 0) === newTemp;
  }

  const delta: { applied: boolean; hpBefore: number; hpAfter: number; tempBefore?: number; tempAfter?: number } = {
    applied,
    hpBefore: entry.oldHP,
    hpAfter: entry.newHP
  };
  if (entry.oldTempHP !== undefined || entry.newTempHP !== undefined) {
    delta.tempBefore = oldTemp;
    delta.tempAfter = newTemp;
  }
  return delta;
}

function splitDamageList(list: MidiDamageListEntry[] | undefined): {
  appliedDamage?: AppliedHitPoints;
  appliedHealing?: AppliedHitPoints;
} {
  const damage: Record<string, HitPointsDelta> = {};
  const healing: Record<string, HitPointsDelta> = {};
  for (const entry of list ?? []) {
    const delta = toHitPointsDelta(entry);
    if (!delta) continue;
    const key = tokenIdFromUuid(entry.targetUuid ?? entry.tokenUuid) ?? entry.actorId;
    if (!key) continue;
    if (delta.hpAfter > delta.hpBefore || (entry.hpDamage ?? 0) < 0) {
      healing[key] = delta;
    } else {
      damage[key] = delta;
    }
  }
  const result: { appliedDamage?: AppliedHitPoints; appliedHealing?: AppliedHitPoints } = {};
  if (Object.keys(damage).length > 0) result.appliedDamage = damage;
  if (Object.keys(healing).length > 0) result.appliedHealing = healing;
  return result;
}

export function toMidiWorkflowOutcome(workflow: MidiWorkflow): MidiWorkflowOutcome {
  return {
    attackTotal: workflow.attackTotal,
    damageTotal: workflow.damageTotal,
    isCritical: workflow.isCritical ?? false,
    isFumble: workflow.isFumble ?? false,
    hitTargetIds: [...(workflow.hitTargets ?? [])].map((t) => t.id),
    saveTargetIds: [...(workflow.saves ?? [])].map((t) => t.id),
    failedSaveTargetIds: [...(workflow.failedSaves ?? [])].map((t) => t.id),
    ...splitDamageList(workflow.damageList)
  };
}

/**
 * Anti-corruption layer over the Midi-QOL hooks. `captureNext()` arms the
 * `midi-qol.RollComplete` listener (racing a timeout) immediately, so the
 * caller must arm it BEFORE triggering the item use. An aborted workflow never
 * reaches RollComplete; Midi deletes the usage card instead, which
 * `trackCard()` turns into an `aborted` result.
 */
export class Dnd5eMidiWorkflowGateway implements MidiWorkflowPort {
  constructor(private readonly timeoutMs: number = MIDI_WORKFLOW_TIMEOUT) {}

  isActive(): boolean {
    return isMidiQolActive();
  }

  captureNext(): MidiWorkflowCapture {
    const hooks = getHooks();
    let trackedCardId: string | undefined;
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let resolveResult: ((result: MidiCaptureResult) => void) | undefined;

    const promise = new Promise<MidiCaptureResult>((resolve) => {
      resolveResult = resolve;
    });
    const settle = (result: MidiCaptureResult): void => {
      if (settled) return;
      settled = true;
      resolveResult?.(result);
    };

    const completeId = hooks.once('midi-qol.RollComplete', (workflow: MidiWorkflow) => {
      settle({ kind: 'completed', workflow: toMidiWorkflowOutcome(workflow) });
    });
    const deleteId = hooks.on('deleteChatMessage', (message: FoundryChatMessage) => {
      if (trackedCardId !== undefined && message.id === trackedCardId) {
        settle({ kind: 'aborted' });
      }
    });
    timer = setTimeout(() => {
      settle({ kind: 'timeout' });
    }, this.timeoutMs);

    const cleanup = (): void => {
      hooks.off('midi-qol.RollComplete', completeId);
      hooks.off('deleteChatMessage', deleteId);
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    return {
      async await(): Promise<MidiCaptureResult> {
        const result = await promise;
        cleanup();
        return result;
      },
      trackCard(chatMessageId: string): void {
        trackedCardId = chatMessageId;
      },
      cancel: cleanup
    };
  }
}
