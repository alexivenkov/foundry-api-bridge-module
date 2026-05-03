import type { SetWorldTimeParams, SetWorldTimeResult } from '@/commands/types';
import { getGame } from './systemTypes';

export async function setWorldTimeHandler(params: SetWorldTimeParams): Promise<SetWorldTimeResult> {
  if (params.worldTime < 0) {
    throw new Error('worldTime must be >= 0');
  }
  const time = getGame().time;
  await time.set(params.worldTime);
  return { worldTime: time.worldTime };
}
