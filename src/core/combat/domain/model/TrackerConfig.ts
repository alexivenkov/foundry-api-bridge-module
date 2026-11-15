/** Foundry 13+: how tokens show whose turn it is. */
export interface TurnMarkerConfig {
  readonly enabled: boolean;
  readonly animation: string;
  /** Null: the core's default marker. */
  readonly src: string | null;
  readonly disposition: boolean;
}

/** The world's combat tracker configuration. */
export interface CombatTrackerConfig {
  /** Attribute path inside the actor's system data; null when no resource is tracked. */
  readonly resource: string | null;
  readonly skipDefeated: boolean;
  /** Absent on cores without turn markers. */
  readonly turnMarker?: TurnMarkerConfig;
}

export interface TurnMarkerChanges {
  readonly enabled?: boolean | undefined;
  readonly animation?: string | undefined;
  readonly src?: string | null | undefined;
  readonly disposition?: boolean | undefined;
}

/** An omitted attribute is left untouched; a null resource or marker source clears it. */
export interface CombatTrackerConfigChanges {
  readonly resource?: string | null | undefined;
  readonly skipDefeated?: boolean | undefined;
  readonly turnMarker?: TurnMarkerChanges | undefined;
}

function definedValues(changes: object): unknown[] {
  return Object.values(changes).filter((value) => value !== undefined);
}

export function hasTrackerConfigChanges(changes: CombatTrackerConfigChanges): boolean {
  const { turnMarker, ...rest } = changes;
  return definedValues(rest).length > 0 || (turnMarker !== undefined && definedValues(turnMarker).length > 0);
}

function pick<T>(change: T | undefined, current: T): T {
  return change !== undefined ? change : current;
}

function applyTurnMarkerChanges(current: TurnMarkerConfig, changes: TurnMarkerChanges): TurnMarkerConfig {
  return {
    enabled: pick(changes.enabled, current.enabled),
    animation: pick(changes.animation, current.animation),
    src: pick(changes.src, current.src),
    disposition: pick(changes.disposition, current.disposition)
  };
}

/** The core stores the configuration as one whole value, so a partial change is merged into the current one. */
export function applyTrackerConfigChanges(
  current: CombatTrackerConfig,
  changes: CombatTrackerConfigChanges
): CombatTrackerConfig {
  const next: CombatTrackerConfig = {
    resource: pick(changes.resource, current.resource),
    skipDefeated: pick(changes.skipDefeated, current.skipDefeated)
  };
  if (current.turnMarker === undefined) {
    return next;
  }
  return {
    ...next,
    turnMarker: changes.turnMarker ? applyTurnMarkerChanges(current.turnMarker, changes.turnMarker) : current.turnMarker
  };
}
