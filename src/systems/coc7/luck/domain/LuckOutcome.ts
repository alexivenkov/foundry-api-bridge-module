import type { Coc7LuckAction } from '@/systems/coc7/shared/domain';

export interface Coc7LuckOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly action: Coc7LuckAction;
  readonly before: number;
  readonly after: number;
}
