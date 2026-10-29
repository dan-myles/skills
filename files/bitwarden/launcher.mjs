import { spawn, spawnSync } from 'node:child_process';
import { constants, closeSync, fstatSync, openSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const endpoint = 'https://archie.tail156535.ts.net:8443';
const mode = process.argv[2];
const fail = (message) => { console.error(message); process.exit(1); };
if (!['configure', 'mcp'].includes(mode) || process.argv.length !== 3) {
  fail('Usage: bitwarden-local configure|mcp');
}
if (Number(process.versions.node.split('.')[0]) < 22) fail('Bitwarden MCP requires Node 22+.');

function bw(args) {
  const result = spawnSync(process.env.BW_CLI_PATH || 'bw', args, {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000,
  });
  if (result.error || result.status !== 0) fail('Bitwarden CLI check failed; inspect bw status privately.');
  return result.stdout;
}
function status() {
  let value;
  try { value = JSON.parse(bw(['status'])); }
  catch { fail('Bitwarden CLI returned invalid status; no configuration changed.'); }
  if (!['unauthenticated', 'locked', 'unlocked'].includes(value.status)) {
    fail('Unknown Bitwarden CLI status; no configuration changed.');
  }
  return value;
}

let current = status();
if (current.serverUrl?.replace(/\/$/, '') !== endpoint) {
  if (current.status !== 'unauthenticated') {
    fail('An authenticated vault uses another server. Refusing to change it or start the Archie MCP.');
  }
  bw(['config', 'server', endpoint]);
  current = status();
  if (current.serverUrl?.replace(/\/$/, '') !== endpoint) fail('Vault server configuration did not persist.');
}
if (mode === 'configure') {
  console.log(`Bitwarden server: ${endpoint}; status: ${current.status}`);
  process.exit(0);
}

// Optional per-machine secret, never created or distributed by Loadout.
if (!process.env.BW_SESSION) {
  const path = join(homedir(), '.local/state/bitwarden-mcp/session');
  let fd;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const info = fstatSync(fd);
    if (!info.isFile() || info.uid !== process.getuid() || (info.mode & 0o777) !== 0o600 || info.size > 8192) {
      fail('The local Bitwarden session file must be an owned regular file with mode 0600.');
    }
    const session = readFileSync(fd, 'utf8').trim();
    if (!session || /\s/.test(session)) fail('Invalid local Bitwarden session file; unlock again privately.');
    process.env.BW_SESSION = session;
  } catch (error) {
    if (error.code !== 'ENOENT') fail('Cannot safely read the local Bitwarden session file.');
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

process.env.BW_API_BASE_URL = `${endpoint}/api`;
process.env.BW_IDENTITY_URL = `${endpoint}/identity`;
const child = spawn('mcp-server-bitwarden', [], { stdio: 'inherit' });
child.on('error', () => fail('Cannot start the official Bitwarden MCP; sync its npm package first.'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
