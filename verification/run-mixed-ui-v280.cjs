'use strict';
// Standalone evidence runner. It never rewrites bundled historical evidence.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'index.html');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'red-v280-mixed-'));
function run(script, args, filename) {
  const child = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    encoding: 'utf8', maxBuffer: 16 * 1024 * 1024
  });
  if (child.error) throw child.error;
  assert.equal(child.status, 0, script + '\n' + child.stderr);
  const data = JSON.parse(child.stdout);
  assert.equal(data.failed, 0);
  fs.writeFileSync(path.join(temporary, filename), child.stdout);
  return data;
}
try {
  const generated = run('mixed-ui.cjs', [source], 'generated.json');
  const replayed = run('mixed-ui.cjs', [source, '--replay', path.join(temporary, 'generated.json')], 'replayed.json');
  const negative = run('mixed-ui-negative-control.cjs', [source, path.join(temporary, 'generated.json')], 'negative.json');
  assert.deepEqual(generated.results, replayed.results);
  const bundled = JSON.parse(fs.readFileSync(path.join(__dirname, 'mixed-ui-v280-results.json'), 'utf8'));
  assert.deepEqual(generated.results, bundled.results, 'fresh execution matches bundled evidence');
  console.log(JSON.stringify({
    passed: true, sourceSha256: generated.sourceSha256,
    generation: {scenarios: generated.passed, assertions: generated.assertions, categories: generated.assertionsByCategory},
    independentProcessReplay: {scenarios: replayed.passed, assertions: replayed.assertions, categories: replayed.assertionsByCategory},
    rejectedTamperedLogs: negative.passed,
    queuesByBattle: generated.results.map(r => ({seed: r.seed, counts: r.queueCheckpointsByBattle})),
    scope: 'Synthetic VM/DOM evidence only. No browser, save/load, import/export, direct gameplay-state writes, network access, or product edits.'
  }, null, 2));
} finally {
  fs.rmSync(temporary, {recursive: true, force: true});
}
