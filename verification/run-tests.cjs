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
  run('production-gesture-natural.cjs', [source], 'Current v0.263 natural production gesture identity');
  run('production-gesture-negative-control.cjs', [], 'Production gesture targeted mutation controls');
  run('production-mode-natural.cjs', [source], 'Current v0.263 legal paid-production mode matrix');
  run('production-mode-negative-control.cjs', [], 'Paid-production mode behavioral mutation controls');
  run('attack-tail.cjs', [source], 'Current v0.263 queued attack tail undo');
  run('attack-tail-negative-control.cjs', [], 'Exact v0.262 attack-tail negative controls');
  run('attack-tail-natural.cjs', [], 'Natural attack queue undo paired with v0.262');
  run('route-cancel.cjs', [source], 'Current v0.263 route cancellation arrival-hold explanation');
  run('route-cancel-negative-control.cjs', [], 'Exact v0.261 route cancellation negative controls');
  run('route-cancel-natural.cjs', [], 'Natural route cancellation and arrival paired with v0.261');
  run('escort-target.cjs', [source], 'Current v0.263 select escort or follow target');
  run('escort-target-negative-control.cjs', [], 'Exact v0.260 escort-target negative controls');
  run('escort-target-natural.cjs', [], 'Natural legal escort and repair follow paired with v0.260');
  run('factory-spawn-check.cjs', [source], 'Current v0.263 manual factory spawn check');
  run('factory-spawn-check-negative-control.cjs', [], 'Exact v0.259 spawn-check negative controls');
  run('factory-spawn-check-natural.cjs', [], 'Natural paid blocked-factory release paired with v0.259');
  run('ground-destination.cjs', [source], 'Current v0.263 single ground destination');
  run('ground-destination-negative-control.cjs', [], 'Exact v0.258 destination negative controls');
  run('ground-destination-natural.cjs', [], 'Natural ground destination and arrival paired with v0.258');
  run('mining-arrangement.cjs', [source], 'Current v0.263 single-miner arrangement');
  run('mining-arrangement-negative-control.cjs', [], 'Exact v0.257 mining-arrangement negative controls');
  run('mining-arrangement-natural.cjs', [], 'Natural mining-command matrix paired with v0.257');
  run('ground-orders.cjs', [source], 'Current v0.263 selected ground commands');
  run('ground-orders-negative-control.cjs', [], 'Exact v0.256 ground-summary negative controls');
  run('ground-orders-natural.cjs', [], 'Paired natural lost-point mixed commands');
  run('post-capture.cjs', [source], 'Current v0.263 capture feedback');
  run('post-capture-negative-control.cjs', [], 'Exact v0.255 capture negative controls');
  run('post-capture-natural.cjs', [], 'Paired natural enemy-point recapture');
  run('production-waiting.cjs', [source], 'Current v0.263 paid-order wait explanation');
  run('production-waiting-negative-control.cjs', [], 'Exact v0.254 wait-explanation negative controls');
  run('production-waiting-natural.cjs', [], 'Paired natural factory-loss transfer');
  run('weakest-selection.cjs', [source], 'Current v0.263 weakest damaged selection');
  run('weakest-selection-negative-control.cjs', [], 'Exact v0.253 weakest-selection negative controls');
  run('selection-health.cjs', [source], 'Current v0.263 selection health');
  run('selection-health-negative-control.cjs', [], 'Exact v0.252 health negative controls');
  run('all-damaged.cjs', [source], 'Current v0.263 all-damaged selection');
  run('all-damaged-negative-control.cjs', [], 'Exact v0.251 missing-feature negative control');
  run('pause-negative-control.cjs', [], 'Exact v0.250 pause regression negative control');
  run('pause-ui.cjs', [source], 'Current v0.263 immediate pause UI regression');
  run('repair-paused.cjs', [source], 'Current v0.263 inherited paused-repair regression');
  const baseline = require('./restore-v249.cjs')(require('./restore-v250.cjs')(require('./restore-v251.cjs')(require('./restore-v252.cjs')(require('./restore-v253.cjs')(fs.readFileSync(source, 'utf8'))))));
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
