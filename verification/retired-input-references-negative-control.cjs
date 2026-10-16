'use strict';

// Healthy complete suite first. A negative is detected only when its exact named
// healthy case fails at the specified post-action invariant with ERR_ASSERTION.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const html = fs.readFileSync(source, 'utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sourceHashBefore = hash(html);
const suite = path.join(__dirname, 'retired-input-references.cjs');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'red-retired-input-negative-'));
const mutantSource = path.join(directory, 'index.html');
const mutations = [];
const helper = 'function retireCanceledCommandActivationReferences(){for(let a of [ordinaryCommandActivation,appendCommandActivation,factoryExitActivation])if(a?.canceled)a.battle=null;if(factoryExitActivation?.canceled){factoryExitActivation.factory=null;factoryExitActivation.order=null}}';
const resetCall = 'clearRepairWorkSnapshot();clearOrdinaryCommand();retireCanceledCommandActivationReferences();clearBattleReportExport();';
const spec = (name, fault, before, after, expected, stage, invariant) => ({name,fault,replacements:[[before,after]],expected,stage,invariant});
const specs = [
  spec('reset_cleanup_not_called', 'Reset retains every canceled token object reference.',
    resetCall, 'clearRepairWorkSnapshot();clearOrdinaryCommand();clearBattleReportExport();',
    'ordinary_pointer_pending_references_retired_on_start', 'after_start', 'obsolete_battle_reference_released'),
  spec('ordinary_token_omitted', 'Ordinary-command token retains its outgoing battle.',
    '[ordinaryCommandActivation,appendCommandActivation,factoryExitActivation])if(a?.canceled)a.battle=null',
    '[appendCommandActivation,factoryExitActivation])if(a?.canceled)a.battle=null',
    'ordinary_pointer_pending_references_retired_on_start', 'after_start', 'obsolete_battle_reference_released'),
  spec('append_token_omitted', 'Append-command token retains its outgoing battle.',
    '[ordinaryCommandActivation,appendCommandActivation,factoryExitActivation])if(a?.canceled)a.battle=null',
    '[ordinaryCommandActivation,factoryExitActivation])if(a?.canceled)a.battle=null',
    'append_pointer_pending_references_retired_on_start', 'after_start', 'obsolete_battle_reference_released'),
  spec('factory_battle_retained', 'Factory token loses entity/order edges but retains its outgoing battle.',
    '[ordinaryCommandActivation,appendCommandActivation,factoryExitActivation])if(a?.canceled)a.battle=null',
    '[ordinaryCommandActivation,appendCommandActivation])if(a?.canceled)a.battle=null',
    'factory_component_pointer_pending_references_retired_on_start', 'after_start', 'obsolete_battle_reference_released'),
  spec('factory_entity_retained', 'Factory token retains its obsolete factory entity.',
    'factoryExitActivation.factory=null;factoryExitActivation.order=null', 'factoryExitActivation.order=null',
    'factory_component_pointer_pending_references_retired_on_start', 'after_start', 'obsolete_factory_reference_released'),
  spec('factory_order_retained', 'Factory token retains its obsolete paid order.',
    'factoryExitActivation.factory=null;factoryExitActivation.order=null', 'factoryExitActivation.factory=null',
    'factory_component_pointer_pending_references_retired_on_start', 'after_start', 'obsolete_order_reference_released'),
  spec('ordinary_tombstone_erased', 'Erasing the ordinary token lets a stale click arm a new battle command.',
    helper, helper.replace('{for(let a', '{ordinaryCommandActivation=null;for(let a'),
    'ordinary_pointer_stale_input_rejected_fresh_input_works', 'after_stale_click', 'world_unchanged'),
  spec('append_tombstone_erased', 'Erasing the append token lets a stale click arm a new battle command.',
    helper, helper.replace('{for(let a', '{appendCommandActivation=null;for(let a'),
    'append_pointer_stale_input_rejected_fresh_input_works', 'after_stale_click', 'world_unchanged'),
  spec('factory_tombstone_erased', 'Erasing the factory token lets a stale click select replacement-battle occupants.',
    helper, helper.replace('{for(let a', '{factoryExitActivation=null;for(let a'),
    'factory_component_pointer_stale_input_rejected_fresh_input_works', 'after_stale_click', 'world_unchanged'),
  spec('token_identity_replaced', 'Cloning the ordinary token violates in-place tombstone preservation.',
    helper, helper.replace('{for(let a', '{if(ordinaryCommandActivation)ordinaryCommandActivation={...ordinaryCommandActivation};for(let a'),
    'ordinary_pointer_pending_references_retired_on_start', 'after_start', 'token_identity_preserved'),
  spec('pointer_identity_changed', 'Retirement rewrites a pointer identifier unrelated to obsolete object references.',
    'if(a?.canceled)a.battle=null;', 'if(a?.canceled){a.battle=null;if(a.kind===\'pointer\')a.pointerId=999;}',
    'ordinary_pointer_pending_references_retired_on_start', 'after_start', 'all_other_token_fields_preserved'),
  spec('key_identity_changed', 'Retirement rewrites the keyboard key that rejects late releases.',
    'if(a?.canceled)a.battle=null;', 'if(a?.canceled){a.battle=null;if(a.kind===\'key\')a.key=\'Escape\';}',
    'ordinary_enter_pending_references_retired_on_start', 'after_start', 'all_other_token_fields_preserved'),
  spec('consumed_flag_reset', 'Retirement clears a consumed activation flag.',
    'if(a?.canceled)a.battle=null;', 'if(a?.canceled){a.battle=null;a.consumed=false;}',
    'ordinary_pointer_consumed_references_retired_on_start', 'after_start', 'all_other_token_fields_preserved'),
  spec('released_flag_reset', 'Retirement clears the release state of an already released gesture.',
    'if(a?.canceled)a.battle=null;', 'if(a?.canceled){a.battle=null;a.released=false;}',
    'ordinary_pointer_released_references_retired_on_start', 'after_start', 'all_other_token_fields_preserved'),
  spec('canceled_flag_reset', 'Retirement clears the cancellation tombstone flag.',
    'if(a?.canceled)a.battle=null;', 'if(a?.canceled){a.battle=null;a.canceled=false;}',
    'ordinary_helper_preserves_canceled_tombstone_fields', 'after_retirement_helper', 'all_other_token_fields_preserved'),
  spec('factory_type_erased', 'Retirement erases the factory token model type even though it is a scalar.',
    'factoryExitActivation.factory=null;factoryExitActivation.order=null', 'factoryExitActivation.factory=null;factoryExitActivation.order=null;delete factoryExitActivation.type',
    'factory_component_pointer_pending_references_retired_on_start', 'after_start', 'all_other_token_fields_preserved'),
  spec('same_battle_cancel_clears_references', 'References are prematurely released on ordinary cancellation without a battle replacement.',
    'if(appendCommandActivation)appendCommandActivation.canceled=true;let pending=',
    'if(appendCommandActivation)appendCommandActivation.canceled=true;retireCanceledCommandActivationReferences();let pending=',
    'ordinary_pointer_pending_references_retired_on_start', 'after_restart_menu', 'same_battle_reference_retained'),
  spec('uncanceled_live_token_stripped', 'The helper drops a live, uncanceled token battle reference.',
    'if(a?.canceled)a.battle=null;', 'if(a)a.battle=null;',
    'ordinary_helper_preserves_uncanceled_live_token', 'after_live_helper', 'same_battle_reference_retained'),
  spec('fresh_pointer_cannot_replace_tombstone', 'A deliberate ordinary pointer press is rejected whenever an old canceled token exists.',
    "$('ordinaryCommand').onpointerdown=e=>{if(e.isPrimary===false||e.button!==0||ordinaryCommandReason())return;",
    "$('ordinaryCommand').onpointerdown=e=>{if(ordinaryCommandActivation?.canceled||e.isPrimary===false||e.button!==0||ordinaryCommandReason())return;",
    'ordinary_pointer_stale_input_rejected_fresh_input_works', 'after_fresh_activation', 'fresh_token_replaces_tombstone'),
  spec('fresh_key_cannot_replace_tombstone', 'A deliberate append key press is rejected whenever an old canceled token exists.',
    "$('appendCommand').onkeydown=e=>{if(e.isComposing||e.keyCode===229||!['Enter',' '].includes(e.key)||appendCommandReason())return;",
    "$('appendCommand').onkeydown=e=>{if(appendCommandActivation?.canceled||e.isComposing||e.keyCode===229||!['Enter',' '].includes(e.key)||appendCommandReason())return;",
    'append_enter_stale_input_rejected_fresh_input_works', 'after_fresh_activation', 'fresh_token_replaces_tombstone'),
  spec('outgoing_battle_cash_modified', 'Reference cleanup mutates the outgoing battle economy before resetting.',
    'if(a?.canceled)a.battle=null;', 'if(a?.canceled){if(a.battle)a.battle.cash++;a.battle=null;}',
    'ordinary_pointer_pending_references_retired_on_start', 'after_start', 'outgoing_world_not_mutated'),
  spec('obsolete_reference_moved_to_new_property', 'The nominal battle edge is cleared but the old graph is hidden on a new token property.',
    'if(a?.canceled)a.battle=null;', 'if(a?.canceled){a.previousBattle=a.battle;a.battle=null;}',
    'ordinary_pointer_pending_references_retired_on_start', 'after_start', 'all_other_token_fields_preserved')
];

function run(file) {
  const result = spawnSync(process.execPath, [suite,file], {encoding:'utf8', maxBuffer:32*1024*1024});
  assert.ifError(result.error);
  assert.equal(result.signal, null, 'focused suite must exit normally');
  assert.ok(result.stdout.trim(), 'focused suite must produce its structured report');
  return {status:result.status, report:JSON.parse(result.stdout)};
}
function failureAt(mutant, healthy, expected, stage, invariant) {
  assert.equal(healthy.report.tests.find(result => result.name === expected)?.passed, true, 'exact named healthy control must pass');
  const failure = mutant.report.tests.find(result => result.name === expected && !result.passed)?.failure;
  assert.ok(failure, `${expected}: exact target must fail`);
  assert.equal(failure.stage, stage, `${expected}: exact post-action stage`);
  assert.equal(failure.invariant, invariant, `${expected}: exact behavioral invariant`);
  assert.equal(failure.code, 'ERR_ASSERTION', `${expected}: assertion required, never setup error or runtime crash`);
  return failure;
}
function rejected(file, expectedHash, healthy) {
  const mutant = run(file);
  assert.equal(mutant.status, 1, 'suite must reject defective source');
  assert.equal(mutant.report.total, healthy.report.total, 'all cases must be attempted');
  assert.ok(mutant.report.failed > 0, 'behavioral failures required');
  assert.equal(mutant.report.sourceHashBefore, expectedHash);
  assert.equal(mutant.report.sourceHashAfter, expectedHash);
  return mutant;
}

try {
  const healthy = run(source);
  assert.equal(healthy.status, 0, 'unmodified source must pass before negative checks');
  assert.equal(healthy.report.failed, 0);
  assert.equal(healthy.report.total, 66, 'complete focused contract matrix');
  assert.equal(healthy.report.passed, healthy.report.total);
  assert.equal(healthy.report.sourceHashBefore, sourceHashBefore);
  assert.equal(healthy.report.sourceHashAfter, sourceHashBefore);

  // A byte-exact historical control directly demonstrates the previously
  // observed retention in all three slots. New-helper-only cases may be absent
  // there, but only these three existing, post-start reference assertions count.
  try {
    const baseline = require('./restore-v265.cjs')(html);
    const baselineHash = hash(baseline);
    assert.equal(baselineHash, '4681522a07855adca4e7baf9964175ebe1610461c9d10504d045d3c154745dd4');
    fs.writeFileSync(mutantSource, baseline);
    const old = rejected(mutantSource, baselineHash, healthy);
    const targets = ['ordinary','append','factory_component'].map(control => {
      const expected = `${control}_pointer_pending_references_retired_on_start`;
      return {expected,...failureAt(old, healthy, expected, 'after_start', 'obsolete_battle_reference_released')};
    });
    mutations.push({name:'exact_published_v265_retains_obsolete_references', passed:true, baselineHash, targets, failedCases:old.report.failed,
      scope:'Existing whole-source behavior; three precise post-start retention assertions, not missing helper crashes.'});
  } catch (error) {
    mutations.push({name:'exact_published_v265_retains_obsolete_references', passed:false, error:error.stack});
  }

  for (const specification of specs) {
    const {name,fault,replacements,expected,stage,invariant} = specification;
    try {
      let mutated = html;
      for (const [before,after] of replacements) {
        assert.equal(mutated.split(before).length - 1, 1, `${name}: unique mutation anchor required`);
        mutated = mutated.replace(before, after);
      }
      const mutantHash = hash(mutated);
      fs.writeFileSync(mutantSource, mutated);
      const mutant = rejected(mutantSource, mutantHash, healthy);
      const failure = failureAt(mutant, healthy, expected, stage, invariant);
      mutations.push({name, passed:true, fault, expected, stage, invariant, failure, failedCases:mutant.report.failed, mutantHash});
    } catch (error) {
      mutations.push({name, passed:false, fault, expected, stage, invariant, error:error.stack});
    }
  }
  const sourceHashAfter = hash(fs.readFileSync(source));
  assert.equal(sourceHashAfter, sourceHashBefore, 'input source remains untouched');
  const report = {
    passed:mutations.filter(result => result.passed).length,
    failed:mutations.filter(result => !result.passed).length,
    total:mutations.length, healthyCasesPassed:healthy.report.passed,
    source, sourceHashBefore, sourceHashAfter, mutations,
    scope:'Healthy 66-case focused suite first, exact published v265 negative control, and 22 deliberately corrupted temporary copies. Each target must fail at its named post-action stage and invariant with ERR_ASSERTION; setup failures, syntax errors and runtime crashes do not count. Factory coverage is explicitly component-fixture coverage. No production file mutation, save/import/export invocation, native browser, GC, heap or performance claims.'
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.failed) process.exitCode = 1;
} finally {
  fs.rmSync(directory, {recursive:true, force:true});
}
