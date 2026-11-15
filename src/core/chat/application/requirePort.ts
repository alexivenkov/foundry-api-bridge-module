/**
 * The ports a chat service takes for its newer use cases are optional, so a
 * service built for the older ones alone still composes; a use case that
 * reaches a missing one is a composition bug.
 */
export function requirePort<TPort>(port: TPort | undefined, name: string): TPort {
  if (port === undefined) {
    throw new Error(`The chat context was composed without its ${name} port`);
  }
  return port;
}
