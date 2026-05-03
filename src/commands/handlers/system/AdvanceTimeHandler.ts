import type { AdvanceTimeParams, AdvanceTimeResult } from '@/commands/types';
import { getGame } from './systemTypes';

export async function advanceTimeHandler(params: AdvanceTimeParams): Promise<AdvanceTimeResult> {
  const time = getGame().time;
  await time.advance(params.seconds);
  return { worldTime: time.worldTime, advancedBy: params.seconds };
}
