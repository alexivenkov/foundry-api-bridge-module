import { UserQuestionService } from './application';
import type { Clock, QuestionRegistry, RequestIdGenerator } from './domain';
import {
  FoundryUserDialogs,
  InMemoryQuestionRegistry,
  randomRequestIds,
  systemClock,
  type DialogGlobalsProvider
} from './infrastructure';

export interface DialogWiring {
  readonly globals?: DialogGlobalsProvider | undefined;
  readonly generation?: (() => number) | undefined;
  readonly registry?: QuestionRegistry | undefined;
  readonly clock?: Clock | undefined;
  readonly ids?: RequestIdGenerator | undefined;
}

// One registry for the page: ask-user, get-user-answer and cancel-user-question
// are separate handlers and must see the same questions.
const pageRegistry = new InMemoryQuestionRegistry();

// Composition root of the context. Handlers pass custom wiring only in tests.
export function createFoundryUserQuestionService(wiring: DialogWiring = {}): UserQuestionService {
  return new UserQuestionService({
    dialogs: new FoundryUserDialogs(wiring.globals, wiring.generation),
    registry: wiring.registry ?? pageRegistry,
    clock: wiring.clock ?? systemClock,
    ids: wiring.ids ?? randomRequestIds
  });
}
