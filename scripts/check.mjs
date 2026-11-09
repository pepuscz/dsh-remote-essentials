import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const pins = JSON.parse(readFileSync(new URL('../plugins.json', import.meta.url)));
assert.equal(Object.keys(pins).length, 3);
for (const value of Object.values(pins)) assert.match(value, /^git\+https:\/\/github\.com\/pepuscz\/[a-z-]+\.git#[a-f0-9]{40}$/);
for (const dir of ['', 'host/']) {
  const pkg = JSON.parse(readFileSync(new URL('../' + dir + 'package.json', import.meta.url)));
  assert.equal(Object.keys(pkg.dependencies || {}).length, 0);
  for (const key of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(pkg.scripts?.[key], undefined);
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml');
  const patch = readFileSync(new URL('../' + dir + 'cordis.patch.yml', import.meta.url), 'utf8');
  assert.match(patch, /importSystemPrompt: false/);
  assert.match(patch, /injectTools: off/);
  assert.match(patch, dir ? /frontendOnly: false/ : /frontendOnly: true/);
  if (!dir) assert.match(patch, /hosts: \[\]/);
}
console.log('Pinned sources, no lifecycle hooks, and role defaults verified.');
