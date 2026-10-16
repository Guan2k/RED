'use strict';

// Legal UI gestures and natural simulation only; the VM does not model a native browser.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {loadGame} = require('./vm-environment.cjs');

const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const hash = () => crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const sourceHashBefore = hash();
const tests = [];
const gestures = [
  {name: 'pointer', key: null},
  {name: 'enter', key: 'Enter'},
  {name: 'space', key: ' '}
];

function test(name, run) {
  try {
    tests.push({name, passed: true, ...run()});
  } catch (error) {
    tests.push({
      name,
      passed: false,
      error: error.stack,
      failure: {
        stage: error.stage ?? null,
        invariant: error.invariant ?? null,
        code: error.code ?? null,
        actual: error.actual,
        expected: error.expected
      }
    });
  }
}

function check(stage, invariant, assertion) {
  try {
    assertion();
  } catch (error) {
    error.stage = stage;
    error.invariant = invariant;
    throw error;
  }
}

function world(g) {
  return g.run('JSON.stringify({state,uid,groups,selection:[...selection],placement,attackMode,ordinaryCommandMode,simulationRemainder})');
}

function fresh() {
  return loadGame(source, {seed: 265}).start();
}

function repeatingScout() {
  const g = fresh();
  const control = g.element('repeatProduction');
  assert.equal(control.disabled, false, 'repeat production must be enabled');
  control.value = 'scout';
  control.dispatchEvent({type: 'change'});
  g.step(.05);
  g.run('updateUI()');
  assert.equal(g.state.queue.length, 1, 'one naturally purchased repeat order');
  return g;
}

function row(g, q) {
  const result = [...g.run('productionOrderRows.values()')].find(candidate => candidate.q === q);
  assert.ok(result && result.live, 'the paid order has a live row');
  return result;
}

function press(node, key) {
  assert.equal(node.disabled, false, 'gesture starts on an enabled control');
  if (key) node.dispatchEvent({type: 'keydown', key, repeat: false});
  else node.dispatchEvent({type: 'pointerdown', button: 0, isPrimary: true, pointerId: 41});
}

function release(node, key) {
  if (key) node.dispatchEvent({type: 'keyup', key});
  else node.dispatchEvent({type: 'pointerup', button: 0, isPrimary: true, pointerId: 41});
  // Dispatch explicitly to probe delayed callbacks on a retired or disabled row.
  // This does not claim that a native browser emits click on disabled controls.
  node.dispatchEvent({type: 'click'});
}

function buyUnit(g, type) {
  const button = g.elements.find(element => element.dataset.unit === type);
  assert.ok(button && !button.disabled, `${type} purchase must be enabled`);
  button.click();
}

let mapPointerId = 100;
function mapClick(g, x, y) {
  const event = {
    pointerId: ++mapPointerId,
    pointerType: 'mouse',
    button: 0,
    isPrimary: true,
    clientX: x,
    clientY: y
  };
  for (const type of ['pointerdown', 'pointerup', 'click']) {
    g.element('map').dispatchEvent({type, ...event, detail: 1});
  }
}

function build(g, type, x, y) {
  assert.equal(g.run(`canPlace('${type}',{x:${x},y:${y}})`), true, 'legal construction position');
  const button = g.elements.find(element => element.dataset.build === type);
  assert.ok(button && !button.disabled, `${type} construction must be enabled`);
  button.click();
  mapClick(g, x, y);
}

// Six cases: the paid order completes and global repeat buys its replacement
// while a cancellation or factory-selection gesture is still in progress.
for (const kind of ['cancel', 'factory']) {
  for (const gesture of gestures) {
    test(`${kind}_completion_replacement_${gesture.name}`, () => {
      const g = repeatingScout();
      const original = g.state.queue[0];
      const originalRow = row(g, original);
      const node = kind === 'cancel' ? originalRow.node : originalRow.factoryNode;
      press(node, gesture.key);
      g.step(4.1);
      g.run('updateUI()');
      assert.ok(!g.state.queue.includes(original), 'original paid order completed naturally');
      assert.equal(g.state.queue.length, 1, 'repeat naturally bought one replacement');
      const replacement = g.state.queue[0];
      assert.notEqual(replacement, original, 'repeat bought a distinct replacement order');
      assert.equal(g.state.stats.produced[0], 1, 'one scout actually finished production');
      const before = world(g);

      release(node, gesture.key);
      check('after_stale_release', 'world_unchanged', () => assert.equal(world(g), before));
      check('after_stale_release', 'replacement_identity', () => assert.equal(g.state.queue[0], replacement));

      const nextRow = row(g, replacement);
      if (kind === 'cancel') {
        const refund = g.run('productionRefund(state.queue[0])');
        const cash = g.state.cash;
        nextRow.node.click();
        check('after_fresh_activation', 'replacement_refund', () => assert.equal(g.state.cash, cash + refund));
        check('after_fresh_activation', 'replacement_canceled', () => assert.equal(g.state.queue.length, 0));
      } else {
        nextRow.factoryNode.click();
        check('after_fresh_activation', 'assigned_factory_selected', () => {
          assert.equal(g.run('JSON.stringify([...selection])'), '[4]');
        });
      }
      return {kind, gesture: gesture.name, phase: 'natural completion and replacement'};
    });
  }
}

// Three cases: interrupted pointer gestures do not cancel their still-paid order.
for (const interruption of ['restart', 'blur', 'pointercancel']) {
  test(`cancel_interrupted_${interruption}`, () => {
    const g = repeatingScout();
    const original = g.state.queue[0];
    const node = row(g, original).node;
    press(node, null);
    if (interruption === 'restart') {
      g.click('restart');
      g.click('cancelRestart');
    } else if (interruption === 'blur') {
      g.dispatch('blur');
    } else {
      node.dispatchEvent({type: 'pointercancel', pointerId: 41});
    }
    const before = world(g);
    release(node, null);
    check('after_interrupted_release', 'world_unchanged', () => assert.equal(world(g), before));
    check('after_interrupted_release', 'paid_order_retained', () => assert.ok(g.state.queue.includes(original)));
    row(g, original).node.click();
    check('after_fresh_activation', 'paid_order_canceled', () => assert.ok(!g.state.queue.includes(original)));
    return {kind: 'cancel', gesture: 'pointer', phase: interruption};
  });
}

// One case: a live gesture follows the paid order's identity after legal reorder.
test('cancel_same_order_reprioritized_pointer', () => {
  const g = fresh();
  for (const type of ['tank', 'scout', 'artillery']) buyUnit(g, type);
  const original = g.state.queue[2];
  const originalRow = row(g, original);
  press(originalRow.node, null);
  originalRow.priorityNode.click();
  assert.equal(g.state.queue[1], original, 'the same paid artillery order moved to waiting head');
  const refund = g.run('productionRefund(state.queue[1])');
  const cash = g.state.cash;
  release(originalRow.node, null);
  check('after_reordered_release', 'original_order_canceled', () => assert.equal(g.state.queue.includes(original), false));
  check('after_reordered_release', 'original_order_refund', () => assert.equal(g.state.cash, cash + refund));
  check('after_reordered_release', 'other_waiting_order_retained', () => assert.equal(g.state.queue[1].type, 'scout'));
  return {kind: 'cancel', gesture: 'pointer', phase: 'same order after legal reprioritization'};
});

// Three cases: a waiting order becomes active before its priority gesture ends.
for (const gesture of gestures) {
  test(`priority_waiting_becomes_active_${gesture.name}`, () => {
    const g = fresh();
    for (const type of ['scout', 'scout', 'tank']) buyUnit(g, type);
    const original = g.state.queue[2];
    const node = row(g, original).priorityNode;
    press(node, gesture.key);
    g.step(8.1);
    g.run('updateUI()');
    assert.equal(g.state.queue[0], original, 'both preceding scouts completed naturally');
    assert.equal(original.factoryId, 4, 'the waiting tank is now assigned');
    assert.equal(g.state.stats.produced[0], 2, 'two scouts actually finished production');
    const before = world(g);
    release(node, gesture.key);
    check('after_active_priority_release', 'world_unchanged', () => assert.equal(world(g), before));
    return {kind: 'priority', gesture: gesture.name, phase: 'waiting order naturally becomes active before release'};
  });
}

// Six cases: legal salvage reassigns the same paid order during its gesture.
for (const kind of ['cancel', 'factory']) {
  for (const gesture of gestures) {
    test(`${kind}_same_order_salvage_reassigned_${gesture.name}`, () => {
      const g = fresh();
      build(g, 'factory', 50, 600);
      build(g, 'power', 50, 520);
      g.step(12.1);
      buyUnit(g, 'scout');
      g.step(.5);
      g.run('updateUI()');
      const original = g.state.queue[0];
      const originalRow = row(g, original);
      const node = kind === 'cancel' ? originalRow.node : originalRow.factoryNode;
      assert.equal(original.factoryId, 4, 'the original factory owns the paid scout');
      press(node, gesture.key);
      const factory = g.state.entities.find(entity => entity.id === 4);
      mapClick(g, factory.x, factory.y);
      assert.equal(g.element('salvage').disabled, false, 'selected factory permits salvage');
      g.click('salvage');
      assert.equal(original.factoryId, 19, 'legal salvage reassigned the same paid order');
      const cash = g.state.cash;
      const refund = g.run('productionRefund(state.queue[0])');
      const beforeQueue = JSON.stringify(g.state.queue);

      release(node, gesture.key);
      if (kind === 'cancel') {
        check('after_reassigned_release', 'paid_order_canceled', () => assert.equal(g.state.queue.length, 0));
        check('after_reassigned_release', 'paid_order_refund', () => assert.equal(g.state.cash, cash + refund));
      } else {
        check('after_reassigned_release', 'current_assigned_factory_selected', () => {
          assert.equal(g.run('JSON.stringify([...selection])'), '[19]');
        });
        check('after_reassigned_release', 'cash_unchanged', () => assert.equal(g.state.cash, cash));
        check('after_reassigned_release', 'paid_queue_unchanged', () => assert.equal(JSON.stringify(g.state.queue), beforeQueue));
      }
      const after = world(g);
      release(node, gesture.key);
      check('after_duplicate_release', 'world_unchanged', () => assert.equal(world(g), after));
      return {kind, gesture: gesture.name, phase: 'same paid order reassigned after legal factory salvage'};
    });
  }
}

const sourceHashAfter = hash();
assert.equal(sourceHashAfter, sourceHashBefore, 'source file was not modified');
const report = {
  passed: tests.filter(result => result.passed).length,
  failed: tests.filter(result => !result.passed).length,
  total: tests.length,
  source,
  sourceHashBefore,
  sourceHashAfter,
  scope: 'Node VM/DOM model only. UI events drive legal production, natural completion/repeat replacement, reprioritization, interruption, construction and factory salvage. No gameplay-state injection, save/import/export, browser use, or publication. Native event-dispatch, focus and layout fidelity are not asserted.',
  tests
};
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
