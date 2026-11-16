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

const index = JSON.parse(readFileSync(new URL('../index.json', import.meta.url)));
assert.equal(index.format, 1);
assert.deepEqual(index.plugins.map(p => p.name).sort(), Object.keys(pins).sort());
for (const plugin of index.plugins) {
  const seen = new Set();
  for (const release of plugin.versions) {
    assert.match(release.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
    assert.ok(!seen.has(release.version), 'duplicate release version');
    seen.add(release.version);
    assert.ok(Number.isInteger(release.publishTimestamp) && release.publishTimestamp > 0);
    assert.equal(release.source.type, 'git');
    assert.match(release.source.commit, /^[a-f0-9]{40}$/);
    const url = new URL(release.source.url);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'github.com');
    assert.equal(url.username + url.password + url.search + url.hash, '');
  }
  const current = plugin.versions[0].source;
  assert.equal(`git+${current.url}#${current.commit}`, pins[plugin.name], 'index must match reviewed pins');
}
console.log('Native index sources and release pins verified.');
