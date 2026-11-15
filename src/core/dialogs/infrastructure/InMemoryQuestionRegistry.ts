import type { QuestionRegistry, UserQuestion } from '@/core/dialogs/domain';

/** Bounded by the service's admission rule, not by the map itself. */
export class InMemoryQuestionRegistry implements QuestionRegistry {
  private readonly questions = new Map<string, UserQuestion>();

  list(): readonly UserQuestion[] {
    return [...this.questions.values()];
  }

  find(requestId: string): UserQuestion | null {
    return this.questions.get(requestId) ?? null;
  }

  save(question: UserQuestion): void {
    this.questions.set(question.requestId, question);
  }

  remove(requestId: string): void {
    this.questions.delete(requestId);
  }
}
