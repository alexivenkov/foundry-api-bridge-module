import type { GetWorldTimeParams, GetWorldTimeResult } from '@/commands/types';
import { getGame } from './systemTypes';

export function getWorldTimeHandler(_params: GetWorldTimeParams): Promise<GetWorldTimeResult> {
  return Promise.resolve({ worldTime: getGame().time.worldTime });
}
