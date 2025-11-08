export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidPackId(packId: string): boolean {
  return /^[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+$/.test(packId);
}
