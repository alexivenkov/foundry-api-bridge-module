import { DomainError } from '../errors/DomainError';
import { findScriptCarriers, introducedScriptCarriers, type ScriptCarrier } from './findScriptCarriers';

/** The REST server maps the "Script macros are disabled" prefix; every context words the refusal this way. */
export function scriptCarrierRefusal(carrier: ScriptCarrier): string {
  return (
    `Script macros are disabled: ${carrier.path} makes ${carrier.module} run ${carrier.runs}. ` +
    'Enable "Allow Script Macros" in module settings to write it via API.'
  );
}

export class ScriptCarrierRefusedError extends DomainError {
  constructor(public readonly carriers: readonly [ScriptCarrier, ...ScriptCarrier[]]) {
    super(scriptCarrierRefusal(carriers[0]));
    this.name = 'ScriptCarrierRefusedError';
    Object.setPrototypeOf(this, ScriptCarrierRefusedError.prototype);
  }
}

/**
 * Data that automation modules would run needs the same opt-in as a script macro. The opt-in is read only when the
 * write carries something, so an ordinary write never depends on the setting.
 */
export function refuseScriptCarriers(carriers: readonly ScriptCarrier[], allowsScripts: () => boolean): void {
  const [first, ...rest] = carriers;
  if (first !== undefined && !allowsScripts()) {
    throw new ScriptCarrierRefusedError([first, ...rest]);
  }
}

/**
 * The whole rule for one write of `documentType` data: refused without the opt-in when it adds or changes a
 * carrier. `readStored` (the document as stored) is read only when the write carries something.
 */
export function refuseNewScriptCarriers(
  documentType: string,
  write: unknown,
  allowsScripts: () => boolean,
  readStored?: () => unknown
): void {
  const found = findScriptCarriers(documentType, write);
  if (found.length === 0) {
    return;
  }
  const stored = readStored === undefined ? [] : findScriptCarriers(documentType, readStored());
  refuseScriptCarriers(introducedScriptCarriers(found, stored), allowsScripts);
}
