import { FileTooLargeError, InvalidFileContentError } from '@/core/files/domain/errors/fileErrors';

/**
 * The decoded size cap of an upload. The core sets no limit of its own, and
 * the whole file travels as base64 text (4/3 of its size) inside one command
 * message, held in the GM browser's memory while it is decoded.
 */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export interface Base64Payload {
  /** Without whitespace, ready for `atob`. */
  readonly base64: string;
  readonly byteLength: number;
}

export function parseBase64Payload(raw: string, maxBytes: number = MAX_UPLOAD_BYTES): Base64Payload {
  const base64 = raw.replace(/\s+/g, '');
  if (base64.length > Math.ceil(maxBytes / 3) * 4 + 4) {
    throw new FileTooLargeError(decodedLength(base64), maxBytes);
  }
  const padded = base64.includes('=');
  if (base64 !== '' && (!BASE64.test(base64) || (padded ? base64.length % 4 !== 0 : base64.length % 4 === 1))) {
    throw new InvalidFileContentError('not valid base64');
  }
  const byteLength = decodedLength(base64);
  if (byteLength === 0) {
    throw new InvalidFileContentError('the file is empty');
  }
  if (byteLength > maxBytes) {
    throw new FileTooLargeError(byteLength, maxBytes);
  }
  return { base64, byteLength };
}

function decodedLength(base64: string): number {
  return Math.floor((base64.replace(/=+$/, '').length * 3) / 4);
}
