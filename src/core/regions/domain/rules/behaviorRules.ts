import { ValidationError } from '@/kernel';
import { CoreFeatureUnavailableError } from '@/core/shared/domain';
import {
  RegionMacroNotFoundError,
  ScriptBehaviorsDisabledError,
  ScriptMacroTargetDisabledError,
  UnregisteredBehaviorTypeError
} from '@/core/regions/domain/errors/regionErrors';
import type { RegionBehavior, RegionBehaviorConfigInput } from '@/core/regions/domain/model/RegionBehavior';
import type {
  RegionBehaviorCatalog,
  RegionMacroResolver,
  ScriptBehaviorPolicy
} from '@/core/regions/domain/ports/ports';
import { SCRIPT_BEHAVIOR_TYPE } from '@/core/regions/domain/value-objects';

const EXTENDED_TELEPORT_OPTIONS = ['placement', 'snap', 'revealed', 'dialog', 'transition'] as const;

export function assertBehaviorTypeRegistered(type: string, catalog: RegionBehaviorCatalog): void {
  const registered = catalog.registeredTypes();
  if (registered !== null && !registered.includes(type)) {
    throw new UnregisteredBehaviorTypeError(type, registered);
  }
}

/** Script behaviors carry JavaScript that runs in the clients: they need the world's script-macro consent. */
export function assertScriptBehaviorAllowed(type: string | undefined, policy: ScriptBehaviorPolicy): void {
  if (type === SCRIPT_BEHAVIOR_TYPE && !policy.allowsScripts()) {
    throw new ScriptBehaviorsDisabledError();
  }
}

function assertEventsAvailable(events: readonly string[] | undefined, catalog: RegionBehaviorCatalog): void {
  const available = catalog.regionEvents();
  if (events === undefined || available === null) {
    return;
  }
  const missing = events.filter((event) => !available.includes(event));
  if (missing.length > 0) {
    throw new CoreFeatureUnavailableError(`Region event ${missing.join(', ')} is not available in this Foundry version`);
  }
}

/** Refuses settings the world cannot store, where the core would silently drop them. */
export function assertBehaviorConfigSupported(config: RegionBehaviorConfigInput, catalog: RegionBehaviorCatalog): void {
  switch (config.kind) {
    case 'displayScrollingText':
    case 'executeMacro':
    case 'executeScript':
    case 'toggleBehavior':
      assertEventsAvailable(config.settings.events, catalog);
      return;
    case 'modifyMovementCost': {
      const actions = catalog.movementCostActions();
      const keys = Object.keys(config.settings.difficulties ?? {});
      const unknown = actions === null ? [] : keys.filter((key) => !actions.includes(key));
      if (actions !== null && unknown.length > 0) {
        throw new ValidationError(
          `modifyMovementCost has no difficulty for movement action ${unknown.join(', ')} (actions: ${actions.join(', ')})`
        );
      }
      return;
    }
    case 'teleportToken': {
      if (catalog.extendedTeleport()) {
        return;
      }
      if ((config.settings.destinationUuids?.length ?? 0) > 1) {
        throw new CoreFeatureUnavailableError('Teleporting to several destination regions requires Foundry 14 or newer');
      }
      const options = EXTENDED_TELEPORT_OPTIONS.filter((option) => config.settings[option] !== undefined);
      if (options.length > 0) {
        throw new CoreFeatureUnavailableError(`Teleport option ${options.join(', ')} requires Foundry 14 or newer`);
      }
      return;
    }
    default:
      return;
  }
}

const MACRO_BEHAVIOR_TYPE = 'executeMacro';

/**
 * The macro an executeMacro behavior will newly point at: on create, on a switch to
 * executeMacro, or when its `macroUuid` changes. An unchanged target (a name or
 * `disabled` edit) is not checked again, so a GM-made behavior stays editable.
 */
export function macroTargetToCheck(
  current: RegionBehavior | undefined,
  type: string,
  config: RegionBehaviorConfigInput | undefined
): string | null {
  if (type !== MACRO_BEHAVIOR_TYPE) {
    return null;
  }
  const requested = config?.kind === MACRO_BEHAVIOR_TYPE ? config.settings.macroUuid : undefined;
  if (current?.config.kind !== MACRO_BEHAVIOR_TYPE) {
    return requested ?? null;
  }
  return requested !== undefined && requested !== current.config.settings.macroUuid ? requested : null;
}

/**
 * Running a script macro needs the world's script-macro consent, and an executeMacro
 * behavior runs its macro on token events: it may not point at a script macro without
 * that consent. A target that names no Macro is refused instead of stored dangling.
 */
export async function assertMacroTargetAllowed(
  macroUuid: string,
  macros: RegionMacroResolver,
  policy: ScriptBehaviorPolicy
): Promise<void> {
  const type = await macros.findMacroType(macroUuid);
  if (type === null) {
    throw new RegionMacroNotFoundError(macroUuid);
  }
  if (type === 'script' && !policy.allowsScripts()) {
    throw new ScriptMacroTargetDisabledError();
  }
}
