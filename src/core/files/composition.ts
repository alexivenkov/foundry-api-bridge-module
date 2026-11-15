import { FileService } from './application';
import { FoundryFileStorage, type FileGlobalsProvider } from './infrastructure';

export interface FileWiring {
  readonly globals?: FileGlobalsProvider | undefined;
}

// Composition root of the context. Handlers pass custom wiring only in tests.
export function createFoundryFileService(wiring: FileWiring = {}): FileService {
  return new FileService({ storage: new FoundryFileStorage(wiring.globals) });
}
