import {
  damageBonusTerm,
  weaponDamageFormula,
  type Coc7SkillRef,
  type Coc7WeaponDamageFormulas
} from '@/systems/coc7/shared/domain';
import type { FoundryCoc7Actor, FoundryCoc7Item } from './foundryCoc7Types';

export function skillRefOf(skill: FoundryCoc7Item | undefined): Coc7SkillRef | undefined {
  if (!skill) {
    return undefined;
  }
  return { id: skill.id, name: skill.name, value: skill.system.value ?? 0 };
}

export function weaponBonusTerm(actor: FoundryCoc7Actor, weapon: FoundryCoc7Item): string {
  const properties: Record<string, boolean> = weapon.system.properties ?? {};
  return damageBonusTerm(actor.system.attribs?.db.value, {
    addb: properties['addb'] === true,
    ahdb: properties['ahdb'] === true
  });
}

/** Damage formulas per range band with the damage bonus already applied; empty bands are left out. */
export function weaponDamageFormulas(actor: FoundryCoc7Actor, weapon: FoundryCoc7Item): Coc7WeaponDamageFormulas {
  const bonus = weaponBonusTerm(actor, weapon);
  const range = weapon.system.range;
  const formulas: { normal: string; long?: string; extreme?: string } = {
    normal: weaponDamageFormula(range?.normal.damage, bonus)
  };
  for (const band of ['long', 'extreme'] as const) {
    const damage = (range?.[band].damage ?? '').trim();
    if (damage !== '') {
      formulas[band] = weaponDamageFormula(damage, bonus);
    }
  }
  return formulas;
}

export function weaponPropertyKeys(weapon: FoundryCoc7Item): string[] {
  return Object.entries(weapon.system.properties ?? {})
    .filter(([, on]) => on)
    .map(([key]) => key);
}
