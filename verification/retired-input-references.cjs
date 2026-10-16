'use strict';

// Complete product source in the shared simulated-DOM VM. Reference assertions
// prove application token edges only: no native browser, GC, heap or timing claim.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {loadGame} = require('./vm-environment.cjs');

const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const hash = () => crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const sourceHashBefore = hash();
const tests = [];
let assertions = 0;
const controls = [
  {name:'ordinary', id:'ordinaryCommand', token:'ordinaryCommandActivation', mode:'ordinaryCommandMode', valid:'validOrdinaryActivation'},
  {name:'append', id:'appendCommand', token:'appendCommandActivation', mode:'appendCommandMode', valid:'validAppendActivation'},
  {name:'factory_component', id:'selectFactoryExitOccupants', token:'factoryExitActivation', valid:'validFactoryExitActivation', factory:true}
];
const gestures = [
  {name:'pointer', pointerId:41},
  {name:'enter', key:'Enter'},
  {name:'space', key:' '}
];

function check(stage, invariant, assertion) {
  try { assertion(); assertions++; }
  catch (error) { error.stage = stage; error.invariant = invariant; throw error; }
}
function eq(stage, invariant, actual, expected) { check(stage, invariant, () => assert.equal(actual, expected)); }
function test(name, run) {
  try { tests.push({name, passed:true, ...run()}); }
  catch (error) {
    tests.push({name, passed:false, error:error.stack, failure:{
      stage:error.stage ?? null, invariant:error.invariant ?? null, code:error.code ?? null
    }});
  }
}
function fresh() { return loadGame(source, {seed:266}).start(); }
function token(g, control) { return g.run(control.token); }
function fire(g, control, type, extra = {}) {
  g.element(control.id).dispatchEvent({type, button:0, isPrimary:true, pointerId:41, ...extra});
}
function press(g, control, gesture) {
  assert.equal(g.element(control.id).disabled, false, 'gesture starts on an enabled actual control');
  if (gesture.key) fire(g, control, 'keydown', {key:gesture.key, repeat:false});
  else fire(g, control, 'pointerdown', {pointerId:gesture.pointerId});
}
function release(g, control, gesture) {
  if (gesture.key) fire(g, control, 'keyup', {key:gesture.key});
  else fire(g, control, 'pointerup', {pointerId:gesture.pointerId});
}
function activate(g, control, gesture) {
  press(g, control, gesture);
  // Enter's default click can precede keyup; Space's follows keyup.
  if (gesture.key === 'Enter') {
    fire(g, control, 'click'); release(g, control, gesture);
  } else {
    release(g, control, gesture); fire(g, control, 'click');
  }
}
function fields(a) {
  return Object.fromEntries(Object.entries(a).filter(([key]) => !['battle','factory','order'].includes(key)));
}
function world(g) {
  return g.run('JSON.stringify({state,uid,selection:[...selection],groups,placement,attackMode,ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,simulationRemainder,navigation:state.entities.map(e=>[e.id,navigationMemory.get(e)||null])})') + JSON.stringify([...g.storage]);
}
function refs(a) { return {battle:a.battle, factory:a.factory, order:a.order}; }
function retained(g, control, a, original, stage) {
  eq(stage, 'token_identity_preserved', token(g, control) === a, true);
  eq(stage, 'same_battle_reference_retained', a.battle === original.battle, true);
  if (control.factory) {
    eq(stage, 'same_factory_reference_retained', a.factory === original.factory, true);
    eq(stage, 'same_order_reference_retained', a.order === original.order, true);
  }
}
function cleared(g, control, a, before, keys, stage) {
  eq(stage, 'token_identity_preserved', token(g, control) === a, true);
  eq(stage, 'obsolete_battle_reference_released', a.battle, null);
  if (control.factory) {
    eq(stage, 'obsolete_factory_reference_released', a.factory, null);
    eq(stage, 'obsolete_order_reference_released', a.order, null);
  }
  check(stage, 'all_other_token_fields_preserved', () => assert.deepEqual(fields(a), {...before, canceled:true}));
  check(stage, 'token_keys_preserved', () => assert.deepEqual(Object.keys(a), keys));
  eq(stage, 'retired_token_invalid', g.run(`${control.valid}()`), false);
}
function openRestart(g) {
  g.click('restart');
  assert.equal(g.run('restartPrompt'), true, 'legal restart control opened menu');
}
function start(g) {
  const old = g.state;
  g.click('start');
  assert.equal(g.state.started, true, 'start control created an active battle');
  assert.notEqual(g.state, old, 'start created a distinct actual battle object');
}
function restart(g) { openRestart(g); start(g); }

// Explicit factory component fixture, NOT a naturally achieved blocked exit.
// Buy a real paid tank order, then set its work/wait flag and enlarge/reposition
// one starting friendly tank to cover every otherwise valid exit candidate.
// Product collision search, context, enabled button and all event handlers run
// unchanged. No state/damage/economy conclusions are drawn from this fixture.
function factoryFixture(g) {
  const purchase = g.elements.find(element => element.dataset.unit === 'tank');
  assert.ok(purchase && !purchase.disabled, 'real tank purchase enabled');
  purchase.click();
  assert.equal(g.state.queue.length, 1, 'one paid factory fixture order');
  g.run(`state.queue[0].left=0;state.queue[0].waitingForExit=true;
    get(6).x=get(4).x;get(6).y=get(4).y;get(6).r=500;
    selection=new Set([4]);updateUI()`);
  assert.equal(g.run('factoryExitSelectionView().reason'), '', 'actual geometry has eligible friendly occupancy');
  assert.equal(g.run('factoryExitSelectionView().open'), null, 'no open exit candidate in fixture');
  assert.equal(g.element('selectFactoryExitOccupants').disabled, false, 'actual factory button enabled in fixture');
}
function prepare(g, control) {
  if (control.factory) factoryFixture(g);
  else g.click('selectArmy');
  assert.equal(g.element(control.id).disabled, false, 'control enabled after preparation');
}
function freshEffect(g, control, gesture) {
  const previous = token(g, control), battle = g.state;
  activate(g, control, gesture);
  const a = token(g, control);
  eq('after_fresh_activation', 'fresh_token_replaces_tombstone', a !== previous && !!a, true);
  eq('after_fresh_activation', 'fresh_token_uses_current_battle', a.battle === battle, true);
  eq('after_fresh_activation', 'fresh_token_consumed', a.consumed, true);
  if (control.factory) {
    eq('after_fresh_activation', 'fresh_factory_selects_current_occupant', g.run('JSON.stringify([...selection])'), '[6]');
  } else {
    eq('after_fresh_activation', 'fresh_command_armed', g.run(control.mode), true);
    eq('after_fresh_activation', 'fresh_button_pressed', g.element(control.id).getAttribute('aria-pressed'), 'true');
  }
}
function staleSequence(g, control, gesture) {
  const before = world(g);
  release(g, control, gesture);
  eq('after_stale_release', 'world_unchanged', world(g), before);
  fire(g, control, 'click');
  eq('after_stale_click', 'world_unchanged', world(g), before);
  // Explicit queued/default callback probes; the VM does not model native event
  // synthesis, propagation or whether browsers deliver these on disabled nodes.
  for (const key of ['Enter',' ']) {
    fire(g, control, 'keydown', {key, repeat:true});
    fire(g, control, 'keyup', {key});
    fire(g, control, 'click');
    eq('after_stale_repeat', 'world_unchanged', world(g), before);
  }
  release(g, control, gesture); fire(g, control, 'click');
  eq('after_duplicate_stale_click', 'world_unchanged', world(g), before);
}

// Real enabled ordinary/append inputs and explicitly labeled factory fixtures.
// Pending, released-not-clicked and consumed tokens preserve every scalar field.
for (const control of controls) for (const gesture of gestures) for (const phase of ['pending','released','consumed']) {
  test(`${control.name}_${gesture.name}_${phase}_references_retired_on_start`, () => {
    const g = fresh(); prepare(g, control);
    if (phase === 'consumed') activate(g, control, gesture);
    else { press(g, control, gesture); if (phase === 'released') release(g, control, gesture); }
    const a = token(g, control), before = fields(a), original = refs(a), keys = Object.keys(a);
    assert.equal(a.battle, g.state, 'token references actual outgoing battle');
    if (control.factory) {
      assert.ok(g.state.entities.includes(a.factory), 'token factory is actual fixture entity');
      assert.ok(g.state.queue.includes(a.order), 'token order is actual paid fixture order');
    }
    openRestart(g);
    retained(g, control, a, original, 'after_restart_menu');
    eq('after_restart_menu', 'token_canceled', a.canceled, true);
    const oldWorld = JSON.stringify(g.state);
    start(g);
    cleared(g, control, a, before, keys, 'after_start');
    eq('after_start', 'outgoing_world_not_mutated', JSON.stringify(original.battle), oldWorld);
    eq('after_start', 'fresh_battle_has_no_orders', g.state.queue.length, 0);
    eq('after_start', 'no_persistence_writes', g.storage.size, 0);
    return {control:control.name, gesture:gesture.name, phase,
      setup:control.factory ? 'explicit blocked-exit component fixture' : 'legal UI and actual starting army'};
  });
}

// Separate behavioral cases deliberately test stale callbacks before reference
// assertions, so an erased tombstone is detected as rearming/selecting, not just
// as a structural mismatch. A fresh deliberate input must still work afterward.
for (const control of controls) for (const gesture of gestures) {
  test(`${control.name}_${gesture.name}_stale_input_rejected_fresh_input_works`, () => {
    const g = fresh(); prepare(g, control); press(g, control, gesture);
    restart(g); prepare(g, control);
    staleSequence(g, control, gesture);
    freshEffect(g, control, gesture);
    eq('after_fresh_activation', 'no_persistence_writes', g.storage.size, 0);
  });
}

// Same-battle cancellation deliberately does not release references. The fix
// belongs only to actual reset; returning from a restart menu keeps this battle.
for (const control of controls) for (const gesture of gestures) for (const interruption of ['restart_return','window_blur']) {
  test(`${control.name}_${gesture.name}_${interruption}_keeps_current_references`, () => {
    const g = fresh(); prepare(g, control); press(g, control, gesture);
    const a = token(g, control), original = refs(a), before = fields(a);
    if (interruption === 'restart_return') { openRestart(g); g.click('cancelRestart'); }
    else g.dispatch('blur');
    eq('after_same_battle_cancel', 'battle_identity_preserved', g.state === original.battle, true);
    retained(g, control, a, original, 'after_same_battle_cancel');
    eq('after_same_battle_cancel', 'token_canceled', a.canceled, true);
    check('after_same_battle_cancel', 'all_other_token_fields_preserved', () => assert.deepEqual(fields(a), {...before,canceled:true}));
    staleSequence(g, control, gesture);
    freshEffect(g, control, gesture);
  });
}

for (const control of controls) {
  test(`${control.name}_direct_terminal_lifecycle_releases_only_after_start`, () => {
    const g = fresh(); prepare(g, control); press(g, control, gestures[0]);
    const a = token(g, control), original = refs(a), before = fields(a), keys = Object.keys(a);
    g.run('finish(true)'); // Bounded lifecycle call, not a naturally played victory.
    eq('after_finish', 'terminal_state_entered', g.state.result, '胜利');
    retained(g, control, a, original, 'after_finish');
    eq('after_finish', 'token_canceled', a.canceled, true);
    start(g);
    cleared(g, control, a, before, keys, 'after_terminal_start');
    return {setup:'direct terminal-state lifecycle call; not played battle'};
  });
}

test('ordinary_append_distinct_old_battles_released_across_20_restarts', () => {
  const g = fresh(), ordinary = controls[0], append = controls[1];
  prepare(g, ordinary); activate(g, ordinary, gestures[1]);
  const a = token(g, ordinary), first = refs(a), aFields = fields(a), aKeys = Object.keys(a);
  restart(g);
  prepare(g, append); activate(g, append, gestures[0]);
  const b = token(g, append), second = refs(b), bFields = fields(b), bKeys = Object.keys(b);
  assert.notEqual(first.battle, second.battle, 'tokens originated in distinct actual battles');
  restart(g);
  for (let i = 0; i < 20; i++) {
    restart(g);
    cleared(g, ordinary, a, aFields, aKeys, 'after_repeated_start');
    cleared(g, append, b, bFields, bKeys, 'after_repeated_start');
    eq('after_repeated_start', 'point_gesture_cleared', g.run('ordinaryCommandGesture'), null);
    eq('after_repeated_start', 'empty_current_queue', g.state.queue.length, 0);
    eq('after_repeated_start', 'no_persistence_writes', g.storage.size, 0);
  }
  return {legalAdditionalRestartStartCycles:20, retainedTokenSlots:2, obsoleteBattleReferences:0};
});

test('factory_component_references_released_across_20_restarts', () => {
  const g = fresh(), control = controls[2]; prepare(g, control); press(g, control, gestures[2]);
  const a = token(g, control), before = fields(a), keys = Object.keys(a);
  for (let i = 0; i < 20; i++) {
    restart(g);
    cleared(g, control, a, before, keys, 'after_repeated_start');
    eq('after_repeated_start', 'no_persistence_writes', g.storage.size, 0);
  }
  return {setup:'explicit blocked-exit component fixture', legalRestartStartCycles:20, obsoleteObjectReferences:0};
});

// Direct helper-boundary fixtures check its guard independently of reset's
// preceding cancellation. A still-live token must never be stripped, and a
// cancellation tombstone has no additional application-specific fields erased.
for (const control of controls) {
  test(`${control.name}_helper_preserves_canceled_tombstone_fields`, () => {
    const g = fresh(); prepare(g, control); press(g, control, gestures[0]);
    const a = token(g, control);
    g.run('clearOrdinaryCommand()');
    assert.equal(a.canceled, true, 'existing cancellation produced a tombstone');
    const before = fields(a), keys = Object.keys(a), current = world(g);
    // Check the helper's exact boundary before later updateUI calls can mask a
    // wrongly reset cancellation flag by canceling the same token again.
    g.run('retireCanceledCommandActivationReferences()');
    cleared(g, control, a, before, keys, 'after_retirement_helper');
    eq('after_retirement_helper', 'world_unchanged', world(g), current);
    return {setup:'direct canceled-helper boundary component check'};
  });
  test(`${control.name}_helper_preserves_uncanceled_live_token`, () => {
    const g = fresh(); prepare(g, control); press(g, control, gestures[0]);
    const a = token(g, control), before = fields(a), original = refs(a), keys = Object.keys(a), current = world(g);
    assert.equal(a.canceled, false, 'actual token is live before helper boundary call');
    g.run('retireCanceledCommandActivationReferences()');
    retained(g, control, a, original, 'after_live_helper');
    check('after_live_helper', 'all_live_token_fields_preserved', () => assert.deepEqual(fields(a), before));
    check('after_live_helper', 'token_keys_preserved', () => assert.deepEqual(Object.keys(a), keys));
    eq('after_live_helper', 'world_unchanged', world(g), current);
    release(g, control, gestures[0]); fire(g, control, 'click');
    if (control.factory) eq('after_live_click', 'factory_occupant_selected', g.run('JSON.stringify([...selection])'), '[6]');
    else eq('after_live_click', 'live_command_armed', g.run(control.mode), true);
    return {setup:'direct helper boundary component check'};
  });
}

test('reset_without_tokens_preserves_null_slots', () => {
  const g = fresh();
  for (let i = 0; i < 3; i++) restart(g);
  for (const control of controls) eq('after_empty_reset', 'absent_token_remains_null', token(g, control), null);
  eq('after_empty_reset', 'no_persistence_writes', g.storage.size, 0);
});

const sourceHashAfter = hash();
eq('after_suite', 'source_unchanged', sourceHashAfter, sourceHashBefore);
const report = {
  passed:tests.filter(result => result.passed).length,
  failed:tests.filter(result => !result.passed).length,
  total:tests.length, assertions, source, sourceHashBefore, sourceHashAfter, tests,
  scope:'Complete-source Node VM / simulated DOM; legal enabled ordinary/append inputs and actual UI restart/start cycles. Factory tests explicitly inject blocked-exit component geometry and completed-order work flags; terminal cases call finish directly, not natural victory. Pointer, Enter, Space and late/default callbacks are dispatched explicitly, not native browser synthesis. Only reset/start retirement is covered; saved-game loading is not exercised. No save/import/export invocation or persistence writes. Reference edge release is not a native GC, heap size, timing, performance or collectability measurement. Paired gameplay/economy evidence belongs to the separate natural suite.'
};
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
