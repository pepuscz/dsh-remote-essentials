import { readFileSync, existsSync, mkdtempSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const role = process.argv[2];
if (!['client', 'host'].includes(role)) throw new Error('Usage: node scripts/install.mjs client|host [profile]');
const profile = process.argv[3] || (role === 'client' ? 'desktop' : 'web');
if (!/^[a-zA-Z0-9_-]+$/.test(profile)) throw new Error('Invalid profile name');
const pins = JSON.parse(readFileSync(join(root, 'plugins.json'), 'utf8'));
for (const spec of Object.values(pins)) if (!/^git\+https:\/\/github\.com\/pepuscz\/[a-z-]+\.git#[a-f0-9]{40}$/.test(spec)) throw new Error('Unpinned plugin source');
const manifest = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'profiles', profile, 'package.json');
const existing = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : {};
const managed = [...Object.keys(pins), '@pepuscz/dsh-remote-essentials', '@pepuscz/dsh-remote-essentials-host'];
if (managed.some(name => existing.dependencies?.[name] || existing.dsh?.profile?.bundles?.includes(name))) throw new Error('Existing setup detected. Back up and review this profile before changing its plugin composition.');
function run(command, args, cwd = root, capture = false) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed; inspect the profile before retrying`);
  return result.stdout;
}
run(process.execPath, [join(root, 'scripts/check.mjs')]);
const scratch = mkdtempSync(join(tmpdir(), 'dsh-essentials-'));
try {
  for (const [name, spec] of Object.entries(pins)) {
    if (role === 'host' && name === '@pepuscz/dsh-ssh-connector') continue;
    run('dsh', ['plugin', '--profile', profile, 'add', spec, '--ignore-scripts']);
  }
  const cwd = role === 'client' ? root : join(root, 'host');
  const packed = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', scratch], cwd, true));
  const artifact = resolve(scratch, packed[0].filename);
  const digest = createHash('sha256').update(readFileSync(artifact)).digest('hex');
  const cache = join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'bundle-artifacts');
  mkdirSync(cache, { recursive: true, mode: 0o700 });
  const retained = join(cache, `${digest}-${packed[0].filename}`);
  copyFileSync(artifact, retained);
  run('dsh', ['plugin', '--profile', profile, 'add', retained, '--ignore-scripts']);
  console.log(`Installed ${role} configuration in profile ${profile}. Configure your connection and provider login, then restart DSH.`);
} finally { rmSync(scratch, { recursive: true, force: true }); }
