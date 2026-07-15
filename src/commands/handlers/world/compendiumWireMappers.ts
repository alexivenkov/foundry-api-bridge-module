import type { CompendiumIndexEntry } from '@/commands/types';
import type { PackIndexEntry } from '@/compendiums';

export function toWireIndexEntry(entry: PackIndexEntry): CompendiumIndexEntry {
  const wireEntry: CompendiumIndexEntry = {
    id: entry.id,
    name: entry.name,
    img: entry.img,
    type: entry.type
  };
  if (entry.fields !== undefined) {
    wireEntry.fields = { ...entry.fields };
  }
  return wireEntry;
}
