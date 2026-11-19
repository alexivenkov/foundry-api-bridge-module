import type { FoundryPf1Actor } from './foundryPf1Types';

const queues = new Map<string, Promise<unknown>>();

/**
 * Runs `task` after every earlier task for the same actor has settled.
 *
 * The router runs commands concurrently, and pf1's mutators read the actor and
 * then write it (`applyDamage` computes the new HP from the current one), so
 * five parallel hits on one actor were all computed from the same HP and only
 * one landed (seen live on pf1 11.11). Tasks for different actors still run in
 * parallel. The key is the uuid so an unlinked token's actor has its own queue.
 * Only the pf1/* mutators use this queue: core commands that write the same
 * actor (`update-actor`, effects, items) are not ordered against them.
 */
export async function runForActor<T>(actor: FoundryPf1Actor, task: () => Promise<T>): Promise<T> {
  const key = actor.uuid ?? actor.id;
  const previous = queues.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const settled = run.then(
    () => undefined,
    () => undefined
  );
  queues.set(key, settled);
  try {
    return await run;
  } finally {
    if (queues.get(key) === settled) {
      queues.delete(key);
    }
  }
}
