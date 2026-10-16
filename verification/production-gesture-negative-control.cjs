'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const html = fs.readFileSync(source, 'utf8');
const hash = () => crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const sourceHashBefore = hash();
const natural = path.join(__dirname, 'production-gesture-natural.cjs');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'red-production-gesture-negative-'));
const mutantSource = path.join(directory, 'index.html');
const mutations = [];

function runNatural(file) {
  const result = spawnSync(process.execPath, [natural, file], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null, 'natural suite must exit normally');
  return {status: result.status, report: JSON.parse(result.stdout)};
}

const specifications = [
  {
    name: 'stale_cancel_falls_back_to_current_head',
    fault: 'A retired cancellation-row callback cancels the current queue head instead of ignoring the stale gesture.',
    before: 'node.onclick=event=>{if(!validProductionOrderRow(row))return;if(row.pointer',
    after: 'node.onclick=event=>{if(!validProductionOrderRow(row)){if(state.queue.length)cancelProduction(state.queue[0]);return}if(row.pointer',
    expected: 'cancel_completion_replacement_pointer',
    stage: 'after_stale_release',
    invariant: 'world_unchanged'
  },
  {
    name: 'cancel_targets_queue_head_instead_of_order',
    fault: 'Cancellation replaces its paid-order argument with the current queue head, losing identity after legal reprioritization.',
    before: 'function cancelProduction(q){if(!state.started',
    after: 'function cancelProduction(q){q=state.queue[0];if(!state.started',
    expected: 'cancel_same_order_reprioritized_pointer',
    stage: 'after_reordered_release',
    invariant: 'original_order_canceled'
  },
  {
    name: 'factory_selection_uses_stale_initial_identity',
    fault: 'Factory selection validates the currently assigned factory but writes the stale original factory ID 4 into selection after legal reassignment.',
    before: "function selectProductionFactory(q){if(commandBlocked()||!state.queue.includes(q))return;let factory=activeProductionFactory(q);if(!factory){tell('该订单尚未分配可用工厂，保留当前选择');return}resetSelectionClicks();selection=new Set([factory.id]);",
    after: "function selectProductionFactory(q){if(commandBlocked()||!state.queue.includes(q))return;let factory=activeProductionFactory(q);if(!factory){tell('该订单尚未分配可用工厂，保留当前选择');return}resetSelectionClicks();selection=new Set([4]);",
    expected: 'factory_same_order_salvage_reassigned_pointer',
    stage: 'after_reassigned_release',
    invariant: 'current_assigned_factory_selected'
  }
];

try {
  const healthy = runNatural(source);
  assert.equal(healthy.status, 0, 'unmodified source must pass before mutation checks');
  assert.equal(healthy.report.failed, 0);
  assert.equal(healthy.report.passed, 19);
  assert.equal(healthy.report.total, 19);
  assert.equal(healthy.report.sourceHashBefore, sourceHashBefore);
  assert.equal(healthy.report.sourceHashAfter, sourceHashBefore);

  for (const specification of specifications) {
    const {name, fault, before, after, expected, stage, invariant} = specification;
    try {
      assert.equal(healthy.report.tests.find(result => result.name === expected)?.passed, true, `${expected}: healthy control`);
      assert.equal(html.split(before).length - 1, 1, `${name}: mutation anchor must be unique`);
      fs.writeFileSync(mutantSource, html.replace(before, after));
      const mutantHash = crypto.createHash('sha256').update(fs.readFileSync(mutantSource)).digest('hex');
      const mutant = runNatural(mutantSource);
      assert.equal(mutant.status, 1, `${name}: suite must reject the mutant`);
      assert.equal(mutant.report.total, 19, `${name}: all natural cases must be attempted`);
      assert.ok(mutant.report.failed > 0, `${name}: behavioral failure required`);
      assert.equal(mutant.report.sourceHashBefore, mutantHash);
      assert.equal(mutant.report.sourceHashAfter, mutantHash);
      const failure = mutant.report.tests.find(result => result.name === expected && !result.passed)?.failure;
      assert.ok(failure, `${expected}: exact named target must fail`);
      assert.equal(failure.stage, stage, `${expected}: exact post-action phase`);
      assert.equal(failure.invariant, invariant, `${expected}: exact behavioral invariant`);
      assert.equal(failure.code, 'ERR_ASSERTION', `${expected}: assertion failure, not a crash or setup error`);
      mutations.push({name, passed: true, fault, expected, stage, invariant, failure, failedCases: mutant.report.failed, mutantHash});
    } catch (error) {
      mutations.push({name, passed: false, fault, expected, stage, invariant, error: error.stack});
    }
  }

  const sourceHashAfter = hash();
  assert.equal(sourceHashAfter, sourceHashBefore, 'production source must remain unchanged');
  const report = {
    passed: mutations.filter(result => result.passed).length,
    failed: mutations.filter(result => !result.passed).length,
    healthyCasesPassed: healthy.report.passed,
    source,
    sourceHashBefore,
    sourceHashAfter,
    mutations,
    scope: 'Three deliberately corrupted temporary source copies. Each exact named healthy case must fail at its intended post-action phase and invariant with ERR_ASSERTION. No production file changes.'
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.failed) process.exitCode = 1;
} finally {
  fs.rmSync(directory, {recursive: true, force: true});
}
