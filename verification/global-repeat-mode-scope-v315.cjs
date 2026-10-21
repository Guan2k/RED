'use strict';

// Current v315 mode-selector coverage. Existing vehicle-type scope suites are separate.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { loadGame } = require('./building-independent-v295/no-persistence-vm.cjs');
const contracts = require('./global-repeat-mode-scope-v299/contracts.cjs');
const restoreV298 = require('./restore-v298-from-v315.cjs');

const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const html = fs.readFileSync(source, 'utf8');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sourceSha256 = hash(html);
const expectedSourceSha256 = '3956a8f7f751949b226fc4cdd91dfe8abd7b4eadd79f83ee02a0df794e08acb6';
const expectedBaselineSha256 = 'd03faa6beca0518edea4d5b07fbf8f6940ae2faba257af9b65d81690be998107';
const results = [], events = [], scenarios = [], globalModes = [], negativeControls = [];
let assertions = 0, worldComparisons = 0, longRunComparisons = 0, baseline, temporary;

function check(condition, message) { assert.ok(condition, message); assertions++; }
function equal(actual, expected, message) { assert.deepEqual(actual, expected, message); assertions++; }
function test(name, operation) {
  try { operation(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, code: error.code || null, error: error.stack }); }
}
function reject(name, operation, code) {
  let rejected;
  try { operation(); } catch (error) { rejected = error; }
  check(!!rejected, name + ' must be rejected');
  equal(rejected.code, code, name + ' must fail for its specific intended reason');
  negativeControls.push({ name, rejected: true, code, diagnostic: rejected.message.split('\n')[0] });
}
function replaceOnce(text, before, after) {
  equal(text.split(before).length - 1, 1, 'unique mutation anchor: ' + before);
  return text.replace(before, after);
}
function change(game, id, value) {
  check(!game.element(id).disabled, id + ' remains enabled');
  game.element(id).value = value;
  game.element(id).dispatchEvent({ type: 'change' });
}
function read(game, expression) { return JSON.parse(game.run('JSON.stringify(' + expression + ')')); }
function snapshot(game) {
  // Every state field and log is retained; pending modes and durable state are also compared.
  return read(game, '{state,uid,groups,selection:[...selection],placement,attackMode,ordinaryCommandMode,appendCommandMode,drag,restartPrompt,resumeAfterCancel,simulationRemainder,finishedBattleNarrative,durable:durableBattleSignature()}');
}
function compare(previous, current) {
  contracts.assertSnapshotsEqual(snapshot(previous), snapshot(current));
  assertions++;
  worldComparisons++;
}
function start(file, seed = 297) {
  const game = loadGame(file, { seed });
  game.click('start');
  equal(read(game, "structures(0,'factory').filter(e=>!e.build).length"), 1, 'one natural completed starting factory');
  const cash = game.state.cash;
  const cost = game.run('defs.factory.cost + defs.power.cost');
  for (const [type, x, y] of [['factory', 50, 600], ['power', 50, 520]]) {
    const card = game.elements.find(element => element.dataset.build === type);
    check(!!card && !card.disabled, type + ' natural construction card enabled');
    card.click();
    game.element('map').dispatchEvent({ type: 'pointerdown', pointerType: 'mouse', pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y });
  }
  equal(game.state.cash, cash - cost, 'natural construction pays exact normal factory and power costs');
  game.step(13);
  check(game.run('powered()'), 'natural construction is powered');
  equal(read(game, "structures(0,'factory').filter(e=>!e.build).length"), 2, 'two natural completed factories');
  game.click('selectAllFactories');
  equal(read(game, '[...selection].length'), 2, 'actual UI selects both factories');
  return game;
}
function globalOrders(file, mode) {
  const game = start(file);
  change(game, 'repeatParallel', mode);
  equal(game.element('repeatProduction').value, 'off', 'preset preserves global-off selection');
  equal(game.state.queue.length, 0, 'global-off preset buys nothing');
  const cash = game.state.cash;
  const cost = game.run('defs.scout.cost');
  change(game, 'repeatProduction', 'scout');
  game.step(.05);
  equal(game.state.queue.length, mode === 'single' ? 1 : 2, 'global scheduler retains ' + mode + ' order count');
  equal(game.state.cash, cash - game.state.queue.length * cost, 'global orders pay normal scout price');
  check(game.state.queue.every(order => order.repeatOrder === true && order.type === 'scout'), 'all global orders have the actual scheduler markers');
  return { mode, orders: game.state.queue.length, cash: game.state.cash };
}

test('exact current source and strict local v298 restoration', () => {
  equal(sourceSha256, expectedSourceSha256, 'exact current v315 source');
  baseline = restoreV298(html);
  equal(hash(baseline), expectedBaselineSha256, 'exact restored v298 source');
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'red-global-repeat-mode-v315-'));
  fs.writeFileSync(path.join(temporary, 'index.html'), baseline, { flag: 'wx' });
});

if (baseline && temporary) {
  const baselineFile = path.join(temporary, 'index.html');
  try {
    test('global-only wording, accessible relationship and visible wrapping hint', () => {
      contracts.inspectMarkup(html); assertions++;
      const game = loadGame(source, { seed: 297 });
      equal(game.element('repeatParallel').getAttribute('aria-label'), '全局循环补单方式', 'actual DOM accessible name');
      equal(game.element('repeatParallel').getAttribute('aria-describedby'), 'repeatParallelScopeHint', 'actual DOM associated hint');
      equal(game.element('repeatParallel').getAttribute('title'), contracts.title, 'actual DOM title');
      check(!!game.element('repeatParallelScopeHint'), 'actual DOM hint exists');
      equal(game.element('repeatParallelScopeHint').hidden, false, 'actual DOM hint is visible');
      equal(game.element('repeatParallelScopeHint').getAttribute('aria-hidden'), null, 'hint is not hidden from accessibility tree');
    });

    test('entire executable script restores after exact v315 art plus two exact receipt reversals', () => {
      const restored = contracts.assertExactScriptDelta(require('./source-delta-history-v315.cjs')(html), baseline); assertions++;
      equal(hash(restored), hash(contracts.inlineScript(baseline)), 'complete restored executable identity');
    });

    test('shared reserve and quantity/type selectors remain byte-identical', () => {
      for (const id of ['repeatReserve', 'repeatTarget', 'repeatProduction', 'factoryRepeat', 'factoryRepeatTarget']) {
        const pattern = new RegExp('<select id="' + id + '"[\\s\\S]*?</select>');
        check(!!html.match(pattern), id + ' exists');
        equal(html.match(pattern)[0], baseline.match(pattern)?.[0], id + ' unchanged');
      }
    });

    test('both mode transitions and 200 full-state completed-production comparisons', () => {
      const previous = start(baselineFile), current = start(source);
      for (const game of [previous, current]) change(game, 'factoryRepeat', 'scout');
      compare(previous, current);
      for (const mode of ['parallel', 'single', 'parallel']) {
        for (const game of [previous, current]) change(game, 'repeatParallel', mode);
        const receipt = contracts.receipts.find(item => item.mode === mode);
        equal(current.state.logs[0], receipt.current, 'actual exact ' + mode + ' receipt');
        equal(previous.state.logs[0], receipt.previous, 'actual previous ' + mode + ' receipt');
        compare(previous, current);
        events.push({ mode, receipt: current.state.logs[0], status: current.element('repeatProductionStatus').textContent });
      }
      for (let i = 0; i < 200; i++) {
        previous.step(.05); current.step(.05);
        compare(previous, current); longRunComparisons++;
      }
      equal(current.state.stats.produced[0], 4, 'two natural factories completed four scout vehicles');
      equal(previous.run('Math.random()'), current.run('Math.random()'), 'long-run random state remains identical');
    });

    for (const scope of ['off', 'factory', 'global']) for (const mode of ['single', 'parallel']) {
      test('complete paired natural UI state: ' + scope + ' / ' + mode, () => {
        const previous = start(baselineFile, 29419), current = start(source, 29419);
        for (const game of [previous, current]) {
          change(game, 'repeatParallel', 'parallel');
          change(game, 'repeatParallel', 'single');
          change(game, 'repeatParallel', mode);
          if (scope === 'factory') change(game, 'factoryRepeat', 'scout');
          if (scope === 'global') change(game, 'repeatProduction', 'scout');
        }
        compare(previous, current);
        for (let i = 0; i < 80; i++) {
          previous.step(.05); current.step(.05); compare(previous, current);
        }
        equal(previous.run('Math.random()'), current.run('Math.random()'), 'paired random state remains identical');
        if (scope === 'off') equal(current.state.queue.length, 0, 'off-state preset buys no orders during progression');
        if (scope === 'factory') equal(current.state.queue.length, 2, 'both independent factories queue regardless of global mode');
        scenarios.push({ scope, mode, cash: current.state.cash, queue: current.state.queue.length, produced: current.state.stats.produced[0], comparisons: 81 });
      });
    }

    for (const mode of ['single', 'parallel']) test('global-off preset and actual paid global ' + mode + ' scheduling', () => globalModes.push(globalOrders(source, mode)));

    test('independent-factory cash and orders agree across single and parallel presets', () => {
      const factory = scenarios.filter(item => item.scope === 'factory');
      equal(factory.length, 2, 'both independent mode scenarios completed');
      equal(factory[0].cash, factory[1].cash, 'independent factory cash is unaffected by global mode');
      equal(factory.map(item => item.queue), [2, 2], 'both independent factories continue scheduling in either mode');
    });

    const wordingMutations = [
      ['accessible global name', 'aria-label="全局循环补单方式"', 'aria-label="循环补单方式"', 'SCOPE_ACCESSIBLE_NAME'],
      ['hint association', 'aria-describedby="repeatParallelScopeHint"', 'aria-describedby="missingHint"', 'SCOPE_HINT_ASSOCIATION'],
      ['title global scope', 'title="仅用于全局循环；', 'title="用于循环；', 'SCOPE_TITLE'],
      ['title off-state preset', '本厂独立循环不受此设置影响。全局关闭时可预设，开启全局车型后生效。', '本厂独立循环不受此设置影响。', 'SCOPE_TITLE'],
      ['single option scope', '>全局补单：单订单（默认）</option>', '>补单：单订单（默认）</option>', 'SCOPE_SINGLE_OPTION'],
      ['parallel option scope', '>全局补单：空闲工厂并行</option>', '>补单：空闲工厂并行</option>', 'SCOPE_PARALLEL_OPTION'],
      ['visible scope explanation', '>仅设置全局补单方式；本厂独立循环不受影响。', '>仅设置补单方式；', 'SCOPE_VISIBLE_HINT'],
      ['hidden scope explanation', 'id="repeatParallelScopeHint" class="hint"', 'id="repeatParallelScopeHint" class="hint" hidden', 'SCOPE_HINT_VISIBLE'],
      ['accessibility-hidden scope explanation', 'id="repeatParallelScopeHint" class="hint"', 'id="repeatParallelScopeHint" class="hint" aria-hidden="true"', 'SCOPE_HINT_VISIBLE'],
      ['parallel receipt scope', contracts.receipts[0].current, contracts.receipts[0].current.replace('全局', ''), 'SCOPE_PARALLEL_RECEIPT'],
      ['single receipt scope', contracts.receipts[1].current, contracts.receipts[1].current.replace('全局', ''), 'SCOPE_SINGLE_RECEIPT']
    ];
    for (const [name, before, after, code] of wordingMutations) test('diagnostic-specific wording control: ' + name, () => {
      const mutated = replaceOnce(html, before, after);
      reject(name, () => contracts.inspectMarkup(mutated), code);
    });

    test('duplicate scope description is rejected for uniqueness', () => {
      const hint = html.match(/<p id="repeatParallelScopeHint"[^>]*>[\s\S]*?<\/p>/)[0];
      reject('duplicate scope hint', () => contracts.inspectMarkup(replaceOnce(html, hint, hint + hint)), 'SCOPE_HINT_UNIQUE');
    });

    test('scheduler mutation is rejected by exact executable restoration', () => {
      const mutated = replaceOnce(html, "function repeatProductionParallel(){return state.repeatParallel===true}", "function repeatProductionParallel(){return true}");
      contracts.inspectMarkup(mutated); assertions++;
      reject('global scheduler forced parallel', () => contracts.assertExactScriptDelta(require('./source-delta-history-v315.cjs')(mutated), baseline), 'SCOPE_EXECUTABLE_DELTA');
    });

    test('unrelated script change is rejected by exact executable restoration', () => {
      const mutated = replaceOnce(html, "function repeatProductionParallel(){return state.repeatParallel===true}", "function repeatProductionParallel(){return state.repeatParallel===true;} ");
      reject('unapproved executable bytes', () => contracts.assertExactScriptDelta(require('./source-delta-history-v315.cjs')(mutated), baseline), 'SCOPE_EXECUTABLE_DELTA');
    });

    test('log normalization preserves all unrelated, malformed and reordered log content', () => {
      const first = contracts.receipts[0], second = contracts.receipts[1];
      const old = { state: { logs: [first.previous, 'ordinary log', second.previous], cash: 42 }, selection: [7] };
      const current = { state: { logs: [first.current, 'ordinary log', second.current], cash: 42 }, selection: [7] };
      contracts.assertSnapshotsEqual(old, current); assertions++;
      equal(contracts.normalizeSnapshot(current).state.logs, old.state.logs, 'only exact approved messages normalize');
      equal(current.state.logs, [first.current, 'ordinary log', second.current], 'normalization does not mutate inputs');
      for (const [name, mutate] of [
        ['unexpected ordinary log text', value => { value.state.logs[1] = 'changed ordinary log'; }],
        ['extra ordinary log', value => { value.state.logs.push('extra ordinary log'); }],
        ['missing ordinary log', value => { value.state.logs.splice(1, 1); }],
        ['changed log ordering', value => { value.state.logs.reverse(); }],
        ['receipt suffix over-normalization', value => { value.state.logs[0] += ' unexpected'; }],
        ['receipt prefix over-normalization', value => { value.state.logs[0] = 'unexpected ' + value.state.logs[0]; }],
        ['non-log state field', value => { value.state.cash++; }],
        ['pending selection field', value => { value.selection.push(8); }]
      ]) {
        const changed = structuredClone(current); mutate(changed);
        reject(name, () => contracts.assertSnapshotsEqual(old, changed), 'SCOPE_FULL_STATE_PARITY');
      }
      reject('omitted log array', () => contracts.normalizeSnapshot({ state: { logs: null } }), 'SCOPE_LOGS_REQUIRED');
    });

    test('comparison coverage and both actual global order modes are complete', () => {
      equal(longRunComparisons, 200, 'all 200 completed-production steps compared');
      equal(worldComparisons, 690, '204 long-run and 486 six-scenario full-state comparisons');
      equal(scenarios.length, 6, 'all off/factory/global single/parallel scenario pairs');
      equal(globalModes.map(item => item.orders), [1, 2], 'actual global single and parallel orders remain one and two');
    });
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

test('current source remains unchanged after every positive and negative control', () => equal(hash(fs.readFileSync(source)), sourceSha256, 'current source bytes unchanged'));
const failed = results.filter(result => !result.passed).length;
console.log(JSON.stringify({
  passed: results.length - failed,
  failed,
  sourceSha256,
  baselineSourceSha256: baseline ? hash(baseline) : null,
  assertions,
  worldComparisons,
  longRunComparisons,
  scenarios,
  globalModes,
  events,
  negativeControls,
  results,
  scope: 'Current-source natural Start/build-card/map-pointer construction and normal payment. 200 completed-production comparisons plus six 81-comparison scenario pairs. Full state, every log, selection, pending modes, durable state and RNG retained; only exact equality to two approved receipt strings is reversed inside state.logs. Strict local v298 restoration, complete executable identity, accessibility wording controls and diagnostic-specific executable/log controls. Bundled no-persistence seeded synthetic DOM/VM; no save/load/import/export actions and no native browser layout claim.'
}, null, 2));
process.exitCode = failed ? 1 : 0;
