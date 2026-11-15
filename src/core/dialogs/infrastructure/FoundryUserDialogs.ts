import { foundryGeneration } from '@/compat/foundryVersion';
import type {
  DialogOutcome,
  QuestionRecipient,
  QuestionSpec,
  UserDialogGateway
} from '@/core/dialogs/domain';
import { toDialogOutcome, toDialogQuery } from './dialogQueryMapper';
import type { DialogGlobalsProvider, FoundryDialogGlobals } from './foundryDialogTypes';

const fromGlobalThis: DialogGlobalsProvider = () => globalThis as unknown as FoundryDialogGlobals;

/** socket.io's acknowledgement timeout, which the server relays as the rejection reason. */
const QUERY_TIMEOUT_REASON = 'operation has timed out';
const MAX_REASON_LENGTH = 300;

/**
 * Anti-corruption layer over `User#query('dialog', …)` (Foundry 13+). The
 * server relays the query to the recipient's sockets, where
 * `CONFIG.queries.dialog` (`DialogV2._handleQuery`) opens the dialog. The core
 * has no message to close it again: after a timeout the dialog stays open on
 * the recipient's screen and their late answer is dropped by the server.
 */
export class FoundryUserDialogs implements UserDialogGateway {
  constructor(
    private readonly globals: DialogGlobalsProvider = fromGlobalThis,
    private readonly generation: () => number = foundryGeneration
  ) {}

  isAvailable(): boolean {
    const generation = this.generation();
    const handler = this.globals().CONFIG?.queries?.['dialog'];
    return (generation === 0 || generation >= 13) && typeof handler === 'function';
  }

  findRecipient(userId: string): QuestionRecipient | null {
    const user = this.globals().game.users.get(userId);
    return user !== undefined ? { id: user.id, name: user.name, active: user.active } : null;
  }

  async ask(userId: string, spec: QuestionSpec, timeoutMs: number): Promise<DialogOutcome> {
    const user = this.globals().game.users.get(userId);
    if (user === undefined) {
      return { type: 'failed', reason: `User not found: ${userId}` };
    }
    try {
      const reply = await user.query('dialog', toDialogQuery(spec), { timeout: timeoutMs });
      return toDialogOutcome(spec, reply);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (reason === QUERY_TIMEOUT_REASON) {
        return { type: 'timeout' };
      }
      return { type: 'failed', reason: reason.slice(0, MAX_REASON_LENGTH) };
    }
  }
}
