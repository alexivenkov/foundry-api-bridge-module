/** Runs a synchronous use case as a command handler: a throw becomes a rejection. */
export function runSync<T>(work: () => T): Promise<T> {
  return new Promise<T>((resolve) => {
    resolve(work());
  });
}
