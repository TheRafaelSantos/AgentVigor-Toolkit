const systems = ['windows', 'macos', 'linux', 'wsl'];
const clients = ['codex', 'claude'];

export async function reportInstallation({ consent, endpoint, version, system, agents }, send = fetch) {
  if (consent !== true) return 'disabled';
  if (!endpoint) return 'unconfigured';
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
        !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version) || !systems.includes(system) ||
        !Array.isArray(agents) || !agents.length || agents.some(agent => !clients.includes(agent))) return 'invalid';
    const response = await send(url, {
      method: 'POST',
      redirect: 'error',
      credentials: 'omit',
      headers: { 'content-type': 'application/json' },
      signal: AbortSignal.timeout(2000),
      body: JSON.stringify({ event: 'installation_completed', schemaVersion: 1, version, system,
        agents: [...new Set(agents)].sort() }),
    });
    await response.body?.cancel().catch(() => {});
    return response.ok ? 'sent' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}
