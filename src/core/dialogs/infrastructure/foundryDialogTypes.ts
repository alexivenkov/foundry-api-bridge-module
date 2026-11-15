/** The dialog types `DialogV2._handleQuery` dispatches on (Foundry 13.351 / 14.368). */
export type FoundryDialogType = 'confirm' | 'input' | 'prompt' | 'wait';

/** The data of a `dialog` user query: `DialogV2[type](config)` runs on the recipient's client. */
export interface FoundryDialogQuery {
  type: FoundryDialogType;
  /** JSON only: callbacks cannot cross the socket. */
  config: Record<string, unknown>;
}

/** The parts of the client `User` document the context uses (Foundry 13+). */
export interface FoundryDialogUser {
  id: string;
  name: string;
  active: boolean;
  /**
   * Relays the query through the server to every socket of the user and
   * resolves with the handler's value; throws the reason of a rejected query
   * (`operation has timed out` after `timeout` ms, `User [id] is not active`, …).
   */
  query(queryName: string, queryData: FoundryDialogQuery, queryOptions?: { timeout?: number }): Promise<unknown>;
}

export interface FoundryDialogGlobals {
  game: { users: { get(id: string): FoundryDialogUser | undefined } };
  /** `CONFIG.queries` exists from Foundry 13. */
  CONFIG?: { queries?: Record<string, unknown> | undefined } | undefined;
}

export type DialogGlobalsProvider = () => FoundryDialogGlobals;
