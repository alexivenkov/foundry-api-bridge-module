// A bare "token" is not a marker: core and game systems have many ordinary token settings.
const CREDENTIAL_MARKERS = ['apikey', 'secret', 'password', 'passwd', 'credential', 'accesstoken', 'authtoken', 'privatekey'];

/** Case and separators are ignored: `apiKey`, `api-key`, `API_KEY` and `auth.token` all count. */
export function looksLikeCredential(name: string): boolean {
  const normalized = name.toLowerCase().replace(/[\s._-]/g, '');
  return CREDENTIAL_MARKERS.some((marker) => normalized.includes(marker));
}

/**
 * The dotted path of the first property inside a plain JSON value whose name
 * looks like a credential (e.g. `turn.password` in `core.rtcWorldSettings`),
 * or null. Only property names are inspected, never the strings themselves.
 */
export function findCredentialPath(value: unknown, path = ''): string | null {
  if (Array.isArray(value)) {
    for (const [index, element] of value.entries()) {
      const found = findCredentialPath(element, `${path}[${String(index)}]`);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  for (const [name, inner] of Object.entries(value)) {
    const innerPath = path === '' ? name : `${path}.${name}`;
    if (looksLikeCredential(name)) {
      return innerPath;
    }
    const found = findCredentialPath(inner, innerPath);
    if (found !== null) {
      return found;
    }
  }
  return null;
}
