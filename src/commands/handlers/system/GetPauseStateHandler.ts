import type { GetPauseStateParams, GetPauseStateResult } from '@/commands/types';
import { getGame } from './systemTypes';

export function getPauseStateHandler(_params: GetPauseStateParams): Promise<GetPauseStateResult> {
  return Promise.resolve({ paused: getGame().paused });
}
