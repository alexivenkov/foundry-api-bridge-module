/** HP of one actor before and after a damage or healing application. */
export interface HitPointsChangeOutcome {
  readonly actorId: string;
  readonly tokenId?: string;
  readonly hpBefore: number;
  readonly hpAfter: number;
  readonly tempBefore: number;
  readonly tempAfter: number;
  readonly maxHp: number;
}
