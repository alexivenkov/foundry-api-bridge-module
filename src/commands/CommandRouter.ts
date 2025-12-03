import type {
  Command,
  CommandResponse,
  CommandType,
  CommandParamsMap,
  CommandResultMap
} from '@/commands/types';

type AnyHandler = (params: unknown) => Promise<unknown>;

type HandlerRegistry = {
  [K in CommandType]?: AnyHandler;
};

export class CommandRouter {
  private handlers: HandlerRegistry = {};

  register<T extends CommandType>(
    type: T,
    handler: (params: CommandParamsMap[T]) => Promise<CommandResultMap[T]>
  ): void {
    this.handlers[type] = handler as AnyHandler;
  }

  async execute(command: Command): Promise<CommandResponse> {
    const handler = this.handlers[command.type];

    if (!handler) {
      return {
        id: command.id,
        success: false,
        error: `Unknown command type: ${command.type}`
      };
    }

    try {
      const result = await handler(command.params);
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