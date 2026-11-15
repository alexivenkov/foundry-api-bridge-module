import { refuseNewScriptCarriers } from '@/kernel';
import {
  DocumentHasNoFlagsError,
  DocumentNotFoundError,
  FLAG_VALUE_MAX_BYTES,
  readFlag,
  requireActiveFlagScope,
  requireFlagKey,
  requireJsonSize,
  requireWorldDocument,
  type DocumentFlagRemoval,
  type DocumentFlagStore,
  type DocumentFlagValue,
  type DocumentFlags,
  type DocumentReference,
  type ScriptContentPolicy
} from '@/core/documents/domain';
import type { GetFlagsQuery, SetFlagCommand, UnsetFlagCommand } from './commands';

export interface DocumentFlagServiceDependencies {
  readonly documents: DocumentFlagStore;
  /** Absent: flags that automation modules run are refused. */
  readonly scripts?: ScriptContentPolicy | undefined;
}

const NO_SCRIPTS: ScriptContentPolicy = { allowsScripts: () => false };

interface Flagged {
  readonly document: DocumentReference;
  readonly flags: Readonly<Record<string, unknown>>;
}

export class DocumentFlagService {
  constructor(private readonly deps: DocumentFlagServiceDependencies) {}

  async getFlags(query: GetFlagsQuery): Promise<DocumentFlags> {
    const { document, flags } = await this.requireFlagged(query.uuid);
    if (query.scope === undefined) {
      return { document, scope: null, flags };
    }
    const scoped = flags[query.scope];
    const scopeFlags = scoped !== null && typeof scoped === 'object' ? (scoped as Record<string, unknown>) : {};
    return { document, scope: query.scope, flags: scopeFlags };
  }

  async setFlag(command: SetFlagCommand): Promise<DocumentFlagValue> {
    requireFlagKey(command.key);
    requireJsonSize('The flag value', command.value, FLAG_VALUE_MAX_BYTES);
    const { document, flags } = await this.requireWritable(command.uuid, command.scope);
    const scripts = this.deps.scripts ?? NO_SCRIPTS;
    refuseNewScriptCarriers(
      document.documentType,
      { flags: { [command.scope]: { [command.key]: command.value } } },
      () => scripts.allowsScripts(),
      () => ({ flags })
    );
    const updated = await this.deps.documents.setFlag(command.uuid, command.scope, command.key, command.value);
    if (updated === null || updated.flags === null) {
      throw new DocumentNotFoundError(command.uuid);
    }
    const stored = readFlag(updated.flags, command.scope, command.key);
    return { document: updated.document, scope: command.scope, key: command.key, value: stored.value };
  }

  async unsetFlag(command: UnsetFlagCommand): Promise<DocumentFlagRemoval> {
    requireFlagKey(command.key);
    const { document, flags } = await this.requireWritable(command.uuid, command.scope);
    const existed = readFlag(flags, command.scope, command.key).found;
    if (existed && (await this.deps.documents.unsetFlag(command.uuid, command.scope, command.key)) === null) {
      throw new DocumentNotFoundError(command.uuid);
    }
    return { document, scope: command.scope, key: command.key, existed };
  }

  private async requireWritable(uuid: string, scope: string): Promise<Flagged> {
    const flagged = await this.requireFlagged(uuid);
    requireWorldDocument(flagged.document);
    requireActiveFlagScope(scope, this.deps.documents.activeScopes());
    return flagged;
  }

  private async requireFlagged(uuid: string): Promise<Flagged> {
    const found = await this.deps.documents.findDocument(uuid);
    if (found === null) {
      throw new DocumentNotFoundError(uuid);
    }
    if (found.flags === null) {
      throw new DocumentHasNoFlagsError(found.document.documentType, uuid);
    }
    return { document: found.document, flags: found.flags };
  }
}
