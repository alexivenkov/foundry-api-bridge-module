import type { Pf1HealthState } from '@/systems/pf1/shared/domain';
import type { FoundryPf1Actor, FoundryPf1Game, FoundryPf1HealthConfig, FoundryPf1HealthData } from './foundryPf1Types';

function num(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function pool(data: FoundryPf1HealthData): { value: number; max: number; temp: number } {
  return { value: num(data.value), max: num(data.max), temp: num(data.temp) };
}

/**
 * Whether the Wounds & Vigor variant tracks this actor, asked the way
 * `ActorPF#applyDamage` asks it. Vigor and wounds are prepared for every actor,
 * so their values alone do not tell.
 */
export function usesWoundsAndVigor(game: FoundryPf1Game, actor: FoundryPf1Actor): boolean {
  try {
    const config = game.settings?.get('pf1', 'healthConfig') as FoundryPf1HealthConfig | undefined;
    return config?.getActorConfig(actor)?.rules?.useWoundsAndVigor === true;
  } catch {
    return false;
  }
}

/** A snapshot copied out of the live document, so the "before" state survives the update. */
export function readPf1Health(actor: FoundryPf1Actor, woundsAndVigor: boolean): Pf1HealthState {
  const attributes = actor.system.attributes ?? {};
  const hp = attributes.hp ?? {};
  const state: { -readonly [K in keyof Pf1HealthState]: Pf1HealthState[K] } = {
    hp: { ...pool(hp), nonlethal: num(hp.nonlethal) }
  };
  if (woundsAndVigor) {
    state.vigor = pool(attributes.vigor ?? {});
    state.wounds = { value: num(attributes.wounds?.value), max: num(attributes.wounds?.max) };
  }
  return state;
}
