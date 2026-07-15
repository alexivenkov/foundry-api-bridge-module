export { ActorType, parseActorType } from './ActorType';
export { CreatureType, parseCreatureType } from './CreatureType';
export { Size, parseSize } from './Size';
export { Disposition, parseDisposition } from './Disposition';
export { ChallengeRating } from './ChallengeRating';
export { AbilityKey, ABILITY_KEYS } from './AbilityScore';
// FolderReference now lives in the shared kernel; re-exported here for
// backwards compatibility with existing actor-context consumers.
export { FolderReference } from '@/kernel/domain/value-objects';
