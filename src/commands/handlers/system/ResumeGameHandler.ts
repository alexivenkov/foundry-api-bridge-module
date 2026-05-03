import type { ResumeGameParams, ResumeGameResult } from '@/commands/types';
import { getGame } from './systemTypes';

export function resumeGameHandler(_params: ResumeGameParams): Promise<ResumeGameResult> {
  getGame().togglePause(false, { broadcast: true });
  return Promise.resolve({ paused: false });
}
