import type {
  Clock,
  DialogOutcome,
  QuestionRecipient,
  QuestionSpec,
  RequestIdGenerator,
  UserDialogGateway
} from '../../domain';

interface PendingAsk {
  readonly userId: string;
  readonly spec: QuestionSpec;
  readonly timeoutMs: number;
  resolve(outcome: DialogOutcome): void;
  reject(error: unknown): void;
}

/** Each `ask` stays open until the test resolves it, like a player taking their time. */
export class FakeUserDialogs implements UserDialogGateway {
  available = true;
  readonly asks: PendingAsk[] = [];

  constructor(private readonly recipients: readonly QuestionRecipient[]) {}

  isAvailable(): boolean {
    return this.available;
  }

  findRecipient(userId: string): QuestionRecipient | null {
    return this.recipients.find((recipient) => recipient.id === userId) ?? null;
  }

  ask(userId: string, spec: QuestionSpec, timeoutMs: number): Promise<DialogOutcome> {
    return new Promise<DialogOutcome>((resolve, reject) => {
      this.asks.push({ userId, spec, timeoutMs, resolve, reject });
    });
  }

  answer(index: number, outcome: DialogOutcome): Promise<void> {
    this.asks[index]?.resolve(outcome);
    return flush();
  }

  fail(index: number, error: unknown): Promise<void> {
    this.asks[index]?.reject(error);
    return flush();
  }
}

export class FakeClock implements Clock {
  constructor(public time = 1_000_000) {}

  now(): number {
    return this.time;
  }
}

export class SequentialIds implements RequestIdGenerator {
  private count = 0;

  constructor(private readonly preset: string[] = []) {}

  next(): string {
    this.count += 1;
    return this.preset.shift() ?? `q${String(this.count)}`;
  }
}

export function flush(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

export const confirmSpec: QuestionSpec = {
  kind: 'confirm',
  title: 'The door',
  content: 'Do you open it?',
  yesLabel: null,
  noLabel: null
};
