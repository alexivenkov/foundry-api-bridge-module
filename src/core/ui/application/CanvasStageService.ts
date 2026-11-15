import { CanvasNotReadyError, type CanvasStage, type CanvasViewState } from '@/core/ui/domain';
import type { ShowScrollingTextCommand } from './commands';

export interface CanvasStageServiceDependencies {
  readonly stage: CanvasStage;
}

export interface ScrollingTextShown {
  readonly shown: boolean;
  readonly sceneId: string;
}

/** Reads and decorates the GM's own canvas; nothing here reaches the players' screens. */
export class CanvasStageService {
  constructor(private readonly deps: CanvasStageServiceDependencies) {}

  getView(): CanvasViewState {
    this.requireReady();
    return this.deps.stage.view();
  }

  showScrollingText(command: ShowScrollingTextCommand): ScrollingTextShown {
    this.requireReady();
    const { sceneId } = this.deps.stage.view();
    return { shown: this.deps.stage.showScrollingText(command.text), sceneId };
  }

  private requireReady(): void {
    if (!this.deps.stage.isReady()) {
      throw new CanvasNotReadyError();
    }
  }
}
