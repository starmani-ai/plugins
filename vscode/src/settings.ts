export const DEFAULT_ENDPOINT = 'https://api.starmani.com/mcp';

export function normalizeEndpoint(value: string): string {
  let url: URL;
  try { url = new URL(value.trim()); }
  catch { throw new Error('Set StarMani: Mcp Url to a valid HTTPS URL ending in /mcp.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/mcp') {
    throw new Error('The StarMani endpoint must use HTTPS, end in /mcp, and contain no credentials, query, or fragment.');
  }
  return url.toString();
}

export function secretId(endpoint: string): string {
  return `starmani.apiKey:${encodeURIComponent(normalizeEndpoint(endpoint))}`;
}

export function keyProblem(value: string): string | undefined {
  return /^sm_live_[A-Za-z0-9_-]{16,}$/.test(value.trim())
    ? undefined
    : 'Paste the complete StarMani API key beginning with sm_live_.';
}
