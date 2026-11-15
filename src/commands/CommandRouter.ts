import type {
  Command,
  CommandContext,
  CommandResponse,
  CommandType,
  CommandParamsMap,
  CommandResultMap
} from '@/commands/types';

type AnyHandler = (params: unknown, context?: CommandContext) => Promise<unknown>;

type HandlerRegistry = {
  [K in CommandType]?: AnyHandler;
};

export interface CommandRouterOptions {
  /** Checks every known command before its handler runs; a throw becomes the command's error response. */
  readonly guard?: (command: Command) => void;
}

export class CommandRouter {
  private handlers: HandlerRegistry = {};

  constructor(private readonly options: CommandRouterOptions = {}) {}

  /**
   * A handler may take the command context as an optional second argument;
   * one that takes only the params never sees it.
   */
  register<T extends CommandType>(
    type: T,
    handler: (params: CommandParamsMap[T], context?: CommandContext) => Promise<CommandResultMap[T]>
  ): void {
    this.handlers[type] = handler as AnyHandler;
  }

  async execute(command: Command, context?: CommandContext): Promise<CommandResponse> {
    const handler = this.handlers[command.type];

    if (!handler) {
      return {
        id: command.id,
        success: false,
        error: `Unknown command type: ${command.type}`
      };
    }

    try {
      this.options.guard?.(command);
      const result = await (context === undefined ? handler(command.params) : handler(command.params, context));
      return {
        id: command.id,
        success: true,
        data: result
      };
    } catch (error) {
      return {
        id: command.id,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  hasHandler(type: CommandType): boolean {
    return type in this.handlers;
  }
}
