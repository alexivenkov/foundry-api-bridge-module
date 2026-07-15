import { ValidationError } from '@/kernel/domain/errors';

export enum ActorType {
  Character = 'character',
  Npc = 'npc',
  Vehicle = 'vehicle',
  Group = 'group'
}

const KNOWN: ReadonlySet<string> = new Set<string>(Object.values(ActorType));

export function parseActorType(raw: string): ActorType {
  const normalized = raw.trim().toLowerCase();
  if (!KNOWN.has(normalized)) {
    throw new ValidationError(`unknown actorType: '${raw}'`);
  }
  return normalized as ActorType;
}
