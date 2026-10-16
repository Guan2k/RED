'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const source = path.resolve(__dirname, '../index.html');
function run(script, args, label) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script), ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(label + ' failed:\n' + result.stdout + result.stderr);
  const report = JSON.parse(result.stdout);
  if (report.failed !== 0 || !Number.isInteger(report.passed)) throw new Error('Invalid report: ' + label);
  console.log(label + ': ' + report.passed + ' passed, 0 failed');
}
let temporary;
try {
  run('repair-paused.cjs', [source], 'Current v0.250 paused-repair regression');
  const baseline = require('./restore-v249.cjs')(fs.readFileSync(source, 'utf8'));
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'red-v249-baseline-'));
  const file = path.join(temporary, 'index.html');
  fs.writeFileSync(file, baseline);
  run('doubleclick-ui.cjs', [file], 'Restored exact v0.249 double-click baseline');
  console.log('Node VM / simulated DOM only; native browser not tested.');
} catch (error) {
  console.error(error.stack || String(error));
  process.exitCode = 1;
} finally {
  if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
}
