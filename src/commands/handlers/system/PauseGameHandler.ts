import type { PauseGameParams, PauseGameResult } from '@/commands/types';
import { getGame } from './systemTypes';

export function pauseGameHandler(_params: PauseGameParams): Promise<PauseGameResult> {
  getGame().togglePause(true, { broadcast: true });
  return Promise.resolve({ paused: true });
}
