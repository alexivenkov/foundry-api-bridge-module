import type { DialogWatch, DialogWatchPort, UserDialogKind } from '@/systems/dnd5e/item-actions/domain';
import { getHooks } from './foundryItemActionTypes';

/** Classes (dnd5e 5.3 / midi-qol 14 / core) whose render means a human is being asked. */
const DIALOG_CLASSES = new Set([
  'Dialog5e',
  'DialogV2',
  'Dialog',
  'ActivityChoiceDialog',
  'ActivityUsageDialog',
  'RollConfigurationDialog',
  'TargetConfirmationDialog'
]);

function classChainNames(app: unknown): string[] {
  const names: string[] = [];
  let ctor: unknown = (app as { constructor?: unknown } | null)?.constructor;
  while (typeof ctor === 'function') {
    const name = (ctor as { name?: string }).name;
    if (name) {
      names.push(name);
    }
    ctor = Object.getPrototypeOf(ctor) as unknown;
  }
  return names;
}

/**
 * Names the dialog a rendered application is, or undefined for any other
 * window (sheets re-render on every actor update, so only dialog classes
 * count). The specific names come first in the inheritance chain.
 */
export function classifyDialog(app: unknown): UserDialogKind | undefined {
  const chain = classChainNames(app);
  if (!chain.some((name) => DIALOG_CLASSES.has(name))) {
    return undefined;
  }
  if (chain.includes('AttackRollConfigurationDialog')) {
    return 'attack-roll';
  }
  if (chain.includes('DamageRollConfigurationDialog')) {
    return 'damage';
  }
  if (chain.includes('ActivityUsageDialog')) {
    return 'consume';
  }
  return 'other';
}

/**
 * Anti-corruption layer over Foundry's render hooks. ApplicationV2 fires
 * `render<ClassName>` for every class in a window's chain, so a single
 * `renderApplicationV2` listener sees every dnd5e and Midi-QOL dialog;
 * `renderDialog` covers the legacy V1 dialogs some modules still use.
 */
export class Dnd5eActivationDialogGateway implements DialogWatchPort {
  watch(): DialogWatch {
    const hooks = getHooks();
    let resolveDialog: ((kind: UserDialogKind) => void) | undefined;
    const promise = new Promise<UserDialogKind>((resolve) => {
      resolveDialog = resolve;
    });

    const onRender = (app: unknown): void => {
      const kind = classifyDialog(app);
      if (kind !== undefined) {
        resolveDialog?.(kind);
      }
    };
    const ids: Array<[string, number]> = [
      ['renderApplicationV2', hooks.on('renderApplicationV2', onRender)],
      ['renderDialog', hooks.on('renderDialog', onRender)]
    ];

    return {
      awaitDialog: (): Promise<UserDialogKind> => promise,
      cancel: (): void => {
        for (const [hook, id] of ids) {
          hooks.off(hook, id);
        }
      }
    };
  }
}
