export async function loadConfigFromUrl(url: string): Promise<unknown> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load config from ${url}: ${response.statusText}`);
  }

  const text = await response.text();

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`Invalid JSON in config file: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}
