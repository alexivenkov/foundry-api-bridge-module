import type { SwadeBennyAction } from './value-objects';

export interface SwadeBenniesOutcome {
  readonly owner: 'actor' | 'gm';
  readonly actorId?: string;
  readonly tokenId?: string;
  readonly action: SwadeBennyAction;
  readonly before: number;
  readonly after: number;
  readonly max?: number;
}
