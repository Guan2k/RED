'use strict';

// New natural regression: legal UI gestures, purchases and uninterrupted simulation.
// This harness executes the whole source in Node's VM; it is not a native browser.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {loadGame} = require('./vm-environment.cjs');

const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const baselineHash = '4c6fa123b3134f694fddcd79ebfe7dbfaae83a86f60943bc71e1344373ef9e03';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const sourceBefore = fs.readFileSync(source);
const sourceHashBefore = digest(sourceBefore);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'red-queued-point-natural-'));
const baseline = path.join(temporary, 'index.html');
const tests = [];
let pointerId = 1000;
let comparisons = 0;
let simulationSteps = 0;
let committedCheckpoints = 0;
let transientCheckpoints = 0;

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function snapshot(g) {
  return JSON.parse(g.run(`JSON.stringify({
    state,uid,groups,selection:[...selection],placement,attackMode,
    ordinaryCommandMode,
    appendCommandMode:typeof appendCommandMode==='undefined'?false:appendCommandMode,
    simulationRemainder,last,uiClock,restartPrompt,resumeAfterCancel,
    selectedDeathUiDirty,lastBaseAlert,harvesterAlert,lastHarvesterAlert,
    battleAlerts,objectiveAlert,objectiveAlertSeen,economyAlert,economyAlertSeen,
    finishedBattleNarrative,savedBattleSignature,savedBattleSource,savedBattleTime,
    pocketRouteBudget
  })`));
}

function button(g, id) {
  const node = g.element(id);
  assert.ok(node, `button #${id} exists`);
  assert.equal(node.disabled, false, `button #${id} is enabled`);
  const event = {pointerId: ++pointerId, pointerType: 'mouse', button: 0, isPrimary: true};
  node.dispatchEvent({type: 'pointerdown', ...event});
  node.dispatchEvent({type: 'pointerup', ...event});
  g.dispatch('pointerup', {...event, target: node});
  node.click({...event, detail: 1});
}

function mapEvent(g, type, point, details = {}) {
  const node = g.element('map');
  const event = {
    pointerId: details.pointerId ?? ++pointerId,
    pointerType: 'mouse', button: 0, isPrimary: true,
    clientX: point.x, clientY: point.y, shiftKey: false, detail: 1,
    ...details
  };
  node.dispatchEvent({type, ...event});
  if (type === 'pointerup') g.dispatch(type, {...event, target: node});
  return event;
}

function mapClick(g, point, details = {}) {
  const event = mapEvent(g, 'pointerdown', point, details);
  mapEvent(g, 'pointerup', point, event);
  mapEvent(g, 'click', point, event);
}

function rightClick(g, point, append = false) {
  const event = mapEvent(g, 'pointerdown', point, {button: 2, shiftKey: append});
  mapEvent(g, 'pointerup', point, event);
  mapEvent(g, 'contextmenu', point, event);
}

function test(name, action) {
  const counts = {comparisons, simulationSteps, committedCheckpoints, transientCheckpoints};
  try {
    const evidence = action();
    tests.push({name, passed: true, ...evidence,
      comparisons: comparisons - counts.comparisons,
      simulationSteps: simulationSteps - counts.simulationSteps,
      committedCheckpoints: committedCheckpoints - counts.committedCheckpoints,
      transientCheckpoints: transientCheckpoints - counts.transientCheckpoints});
  } catch (error) {
    tests.push({name, passed: false, error: error.stack,
      comparisons: comparisons - counts.comparisons,
      simulationSteps: simulationSteps - counts.simulationSteps,
      committedCheckpoints: committedCheckpoints - counts.committedCheckpoints,
      transientCheckpoints: transientCheckpoints - counts.transientCheckpoints});
  }
}

function pair(seed) {
  const games = [baseline, source].map(file => loadGame(file, {seed}).start());
  const old = games[0], current = games[1];
  let localSteps = 0;

  function compare(stage, transientAppend = false, step = false) {
    const expected = snapshot(old), actual = snapshot(current);
    if (transientAppend) {
      assert.equal(expected.appendCommandMode, false, stage + ': baseline has no new input mode');
      assert.equal(actual.appendCommandMode, true, stage + ': candidate awaits append point');
      actual.appendCommandMode = false;
      transientCheckpoints++;
    } else {
      assert.equal(actual.appendCommandMode, false, stage + ': append mode consumed');
      assert.equal(actual.ordinaryCommandMode, false, stage + ': ordinary mode inactive');
      if (!step) committedCheckpoints++;
    }
    assert.deepEqual(actual, expected, stage + ': full state and protected context equality');
    comparisons++;
  }

  function both(stage, action) {
    games.forEach(action);
    games.forEach(g => g.run('updateUI()'));
    compare(stage);
  }

  function step() {
    for (const g of games) {
      g.step(1 / 60, 1 / 60);
      g.run('updateUI()');
    }
    simulationSteps++;
    localSteps++;
    compare('simulation step ' + localSteps, false, true);
  }

  function append(point, label) {
    const before = snapshot(current);
    button(current, 'appendCommand');
    compare(label + ': button armed', true);
    const armed = snapshot(current);
    armed.appendCommandMode = false;
    assert.deepEqual(armed, before, label + ': arming changes no protected gameplay state');

    const event = mapEvent(current, 'pointerdown', point);
    compare(label + ': primary press before release', true);
    mapEvent(current, 'pointerup', point, event);
    rightClick(old, point, true);
    games.forEach(g => g.run('updateUI()'));
    compare(label + ': primary release equals old Shift-right-click');
    assert.equal(current.element('mapCommandReceipt').textContent,
      old.element('mapCommandReceipt').textContent, label + ': exact command receipt');

    const committed = snapshot(current);
    mapEvent(current, 'click', point, event);
    assert.deepEqual(snapshot(current), committed, label + ': compatibility click does not add another command');
    compare(label + ': after compatibility click');
  }

  compare('natural game start');
  return {games, old, current, compare, both, step, append};
}

try {
  const restored = (sourceText=>require('./restore-v263.cjs')(sourceText.includes('ORIGINAL RTS / v0.271')?require('./restore-v270.cjs')(sourceText):sourceText))(sourceBefore.toString('utf8'));
  assert.equal(digest(restored), baselineHash, 'restored baseline is exact shipped v263');
  fs.writeFileSync(baseline, restored);

  test('ground_route_appends_and_reaches_final_destination', () => {
    const p = pair(264), g = p.current;
    const waypoints = [{x: 450, y: 540}, {x: 500, y: 620}, {x: 480, y: 700}];
    const ownerId = 6;
    const start = plain(g.state.entities.find(e => e.id === ownerId));
    p.both('select tank using primary map click', game => mapClick(game, start));
    assert.deepEqual(plain(g.run('[...selection]')), [ownerId]);
    p.both('initial ordinary ground command', game => rightClick(game, waypoints[0]));
    assert.deepEqual(plain(g.run('get(6).goal')), waypoints[0]);
    p.append(waypoints[1], 'append second ground waypoint');
    p.append(waypoints[2], 'append final ground waypoint');
    assert.deepEqual(plain(g.run('get(6).moveQueue')), waypoints, 'all three legal waypoints retained in order');
    const routeAtCommit = plain(g.run('({goal:get(6).goal,moveQueue:get(6).moveQueue})'));
    const transitions = [];
    let previous = JSON.stringify(routeAtCommit);
    // The route's natural completion is the observation endpoint. The fixed
    // upper bound makes failure explicit; it never turns an incomplete route into a pass.
    while (g.state.t < 30 && !g.state.result && g.run('!!get(6)&&!!(get(6).goal||get(6).moveQueue)')) {
      p.step();
      const now = g.run('JSON.stringify({goal:get(6)?.goal,moveQueue:get(6)?.moveQueue})');
      if (now !== previous) {
        transitions.push({t: g.state.t, order: JSON.parse(now)});
        previous = now;
      }
    }
    assert.equal(g.state.result, null, 'game remains active at arrival');
    const arrived = plain(g.run('get(6)'));
    assert.ok(arrived, 'routed tank survives');
    assert.equal(arrived.goal, null, 'final waypoint naturally reached');
    assert.equal(arrived.moveQueue, undefined, 'completed route naturally removed');
    const finalDistance = Math.hypot(arrived.x - waypoints[2].x, arrived.y - waypoints[2].y);
    assert.ok(finalDistance <= 5, 'actual final position is within the single-unit arrival radius');
    assert.ok(transitions.some(e => e.order.goal?.x === 500 && e.order.goal?.y === 620), 'second waypoint became current');
    assert.ok(transitions.some(e => e.order.goal?.x === 480 && e.order.goal?.y === 700), 'final waypoint became current');
    const arrivalTime = g.state.t;
    for (let n = 0; n < 30; n++) p.step();
    assert.equal(g.run('get(6).goal'), null, 'no deferred duplicate goal after arrival');
    assert.equal(g.run('get(6).moveQueue'), undefined, 'no deferred duplicate waypoint after arrival');
    return {kind: 'natural movement', seed: 264, selectedUnit: ownerId,
      initialPosition: {x: start.x, y: start.y}, waypoints, routeAtCommit, transitions,
      arrivalTime, finalPosition: {x: arrived.x, y: arrived.y}, finalDistance,
      finalWorldSha256: digest(JSON.stringify(snapshot(g)))};
  });

  test('purchased_army_attack_queue_advances_after_natural_target_deaths', () => {
    const p = pair(264), g = p.current;
    const startingCash = g.state.cash;
    for (let n = 1; n <= 4; n++) {
      p.both('legal tank purchase ' + n, game => {
        const node = game.elements.find(e => e.dataset.unit === 'tank');
        assert.ok(node && !node.disabled, 'tank purchase is available with actual funds');
        node.click();
      });
    }
    assert.equal(startingCash - g.state.cash, 1400, 'four real 350-cost tank purchases deducted');
    assert.equal(g.state.queue.length, 4, 'four paid production orders queued');
    for (let n = 0; n < 1500; n++) p.step();
    assert.equal(g.state.stats.produced[0], 4, 'all four purchased tanks completed naturally');
    assert.equal(g.state.queue.length, 0, 'paid production queue completed');
    p.both('select army through the real control', game => button(game, 'selectArmy'));
    const selected = plain(g.run('[...selection]'));
    assert.equal(selected.length, 7, 'initial three combat units plus four purchased tanks selected');
    const targetIds = [17, 18, 15];
    const targetPositions = targetIds.map(id => {
      const target = g.state.entities.find(e => e.id === id);
      assert.ok(target && target.hp > 0 && target.team === 1, 'queued target is actually alive');
      return {id, type: target.type, x: target.x, y: target.y, hp: target.hp};
    });
    p.both('initial enemy target through right-click', game => rightClick(game, targetPositions[0]));
    p.append(targetPositions[1], 'append second live enemy target');
    p.append(targetPositions[2], 'append third live enemy target');
    for (const id of selected) {
      assert.deepEqual(plain(g.run(`get(${id}).attackQueue`)), targetIds, 'selected army member has exact attack queue');
      assert.equal(g.run(`get(${id}).target`), targetIds[0]);
    }
    const queueCommittedAt = g.state.t;
    const deaths = [], advances = [];
    const seenDeaths = new Set(), seenAdvances = new Set();
    while (g.state.t < 150 && !g.state.result && seenDeaths.size < 2) {
      p.step();
      for (let i = 0; i < 2; i++) {
        const id = targetIds[i];
        if (!g.run(`!!get(${id})`) && !seenDeaths.has(id)) {
          seenDeaths.add(id);
          deaths.push({id, t: g.state.t, ownKills: g.state.stats.kills[0], enemyLosses: g.state.stats.losses[1]});
        }
      }
      for (let i = 0; i < 2; i++) {
        const oldTarget = targetIds[i], nextTarget = targetIds[i + 1];
        if (!seenDeaths.has(oldTarget) || seenAdvances.has(oldTarget)) continue;
        const survivors = plain(g.run(`state.entities.filter(e=>${JSON.stringify(selected)}.includes(e.id)&&e.hp>0&&e.target===${nextTarget}&&e.attackQueue?.[0]===${nextTarget}).map(e=>({id:e.id,hp:e.hp,target:e.target,attackQueue:e.attackQueue}))`));
        if (survivors.length) {
          seenAdvances.add(oldTarget);
          advances.push({deadTarget: oldTarget, nextTarget, t: g.state.t, survivors});
        }
      }
    }
    // Death filtering and queued-target advancement may occur on adjacent
    // engine updates; allow the still-running battle to process that transition.
    for (let n = 0; n < 2 && seenDeaths.size === 2 && seenAdvances.size < 2 && !g.state.result; n++) {
      p.step();
      const survivors = plain(g.run(`state.entities.filter(e=>${JSON.stringify(selected)}.includes(e.id)&&e.hp>0&&e.target===15&&e.attackQueue?.[0]===15).map(e=>({id:e.id,hp:e.hp,target:e.target,attackQueue:e.attackQueue}))`));
      if (survivors.length && !seenAdvances.has(18)) {
        seenAdvances.add(18);
        advances.push({deadTarget: 18, nextTarget: 15, t: g.state.t, survivors});
      }
    }
    assert.equal(g.state.result, null, 'natural target-death observation precedes battle termination');
    assert.deepEqual([...seenDeaths], [17, 18], 'both queued enemy tanks died naturally');
    assert.deepEqual([...seenAdvances], [17, 18], 'survivors actually advanced current target after each death');
    assert.ok(g.state.stats.kills[0] >= 2, 'natural combat registered at least two friendly kills');
    assert.ok(g.run('!!get(15)'), 'next queued turret remains alive at observation endpoint');
    const continuing = plain(g.run(`state.entities.filter(e=>${JSON.stringify(selected)}.includes(e.id)&&e.hp>0&&e.target===15).map(e=>({id:e.id,hp:e.hp,target:e.target,attackQueue:e.attackQueue}))`));
    assert.ok(continuing.length > 0, 'live purchased-army survivors continue attacking the third target');
    return {kind: 'natural purchased-army combat', seed: 264, purchases: {type: 'tank', count: 4, unitCost: 350, totalPaid: 1400, naturallyProduced: 4},
      selected, targetIds, targetPositions, queueCommittedAt, deaths, advances, continuing,
      finalTime: g.state.t, finalStats: plain(g.state.stats),
      finalWorldSha256: digest(JSON.stringify(snapshot(g)))};
  });
} catch (error) {
  tests.push({name: 'portable_exact_baseline_setup', passed: false, error: error.stack});
} finally {
  fs.rmSync(temporary, {recursive: true, force: true});
}

const sourceHashAfter = digest(fs.readFileSync(source));
if (sourceHashAfter !== sourceHashBefore) {
  tests.push({name: 'source_unchanged_hash_guard', passed: false,
    error: `Source changed during verification: ${sourceHashBefore} -> ${sourceHashAfter}`});
}
const report = {
  passed: tests.filter(t => t.passed).length,
  failed: tests.filter(t => !t.passed).length,
  total: tests.length,
  comparisons, simulationSteps, committedCheckpoints, transientCheckpoints,
  source, sourceHashBefore, sourceHashAfter, baselineHash,
  compared: 'Entire state including entities, queues, shots, effects, cash, statistics and logs; uid, groups, selection, placement, attack mode, ordinary mode, simulation remainder, timing/menu flags and alert/save context. Exact equality at each 1/60 simulation step and every committed action. While the new control is armed, only its explicit append mode is normalized.',
  scope: 'Two natural whole-source seeded VM/DOM scenarios: route completion and legal paid-production combat with actual target deaths/current-target advancement. Actual UI purchase/selection buttons and map event handlers only; candidate append-button primary-release commands are paired with exact v263 Shift-right-click commands. No cash, HP, entity, goal, target or queue injection. No save/import/export, native browser, focus/layout fidelity, publication or win-rate claim. Transient pointer/activation/hover state and presentation DOM are intentionally not whole-world equality fields; command receipts are compared after each append.',
  tests
};
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
