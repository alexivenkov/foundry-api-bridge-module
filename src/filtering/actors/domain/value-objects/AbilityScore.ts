export enum AbilityKey {
  Str = 'str',
  Dex = 'dex',
  Con = 'con',
  Int = 'int',
  Wis = 'wis',
  Cha = 'cha'
}

export const ABILITY_KEYS: readonly AbilityKey[] = [
  AbilityKey.Str,
  AbilityKey.Dex,
  AbilityKey.Con,
  AbilityKey.Int,
  AbilityKey.Wis,
  AbilityKey.Cha
] as const;
