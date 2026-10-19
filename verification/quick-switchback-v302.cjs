'use strict';
// Whole inline product source in the existing deterministic VM. No browser or save lifecycle claim.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const {loadGame} = require('./vm-environment.cjs');
const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const html = fs.readFileSync(source, 'utf8');
const canonical = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'red-switchback-v294-'));
const baseline = path.join(directory, 'v292.html');
// Restore only the unmodified package source. Mutants always execute as the candidate,
// so their failures must reach the behavioral assertions rather than a source hash gate.
fs.writeFileSync(baseline, require('./restore-v292-from-v302.cjs')(canonical));
const fields = ['scenario', 'objective', 'difficulty', 'challenge'];
const target = ['switchback', 'stronghold', 'hard', 'mobile'];
const legacy = [
  ['Assault', 'assault', ['classic', 'annihilation', 'normal', 'standard']],
  ['Harvest', 'harvest', ['frontier', 'harvest', 'normal', 'mobile']],
  ['Stronghold', 'stronghold', ['ring', 'stronghold', 'normal', 'mobile']],
  ['Meridian', 'meridian', ['meridian', 'harvest', 'normal', 'standard']],
  ['Control', 'control', ['crossroads', 'control', 'normal', 'standard']],
  ['Survival', 'survival', ['classic', 'survival', 'normal', 'standard']]
];
const results = [], measurements = [], games = [];
let assertions = 0, pointer = 29300;
const plain = value => JSON.parse(JSON.stringify(value));
function eq(actual, expected, message) { assert.deepEqual(plain(actual), plain(expected), message); assertions++; }
function ok(value, message) { assert.ok(value, message); assertions++; }
function test(name, fn) { fn(); results.push({name, passed: true}); }
function game(file = source, seed = 29317) {
  const g = loadGame(file, {seed});
  g.run(`globalThis.presetRandom=[];{const original=Math.random;Math.random=()=>{const value=original();presetRandom.push(value);return value}};globalThis.presetStorageWrites=[];for(const key of ['setItem','removeItem']){const original=localStorage[key];localStorage[key]=(...args)=>{presetStorageWrites.push([key,...args]);return original(...args)}}`);
  games.push(g);
  return g;
}
const configuration = g => fields.map(id => g.element(id).value);
const liveConfiguration = g => g.run('[state.mapChoice,state.objective,state.difficulty,state.challenge]');
const world = g => g.run('JSON.stringify({state,uid,selection:[...selection],groups,placement,attackMode,ordinaryCommandMode,appendCommandMode,restartPrompt,resumeAfterCancel,simulationRemainder,last,drag,battleAlerts,objectiveAlert,objectiveAlertSeen,economyAlert,economyAlertSeen,finishedBattleNarrative})');
function press(g, button) {
  const node = typeof button === 'string' ? g.element(button) : button;
  ok(node && !node.disabled, 'enabled control ' + (node?.id || 'production card'));
  const event = {pointerId: ++pointer, isPrimary: true, button: 0};
  for (const type of ['pointerdown', 'pointerup']) node.dispatchEvent({type, ...event});
  node.click();
}
function choose(g, values) {
  fields.forEach((id, index) => {
    g.element(id).value = values[index];
    g.element(id).dispatchEvent({type: 'change'});
  });
}
function parity(left, right, label) {
  eq(world(left), world(right), 'whole-world parity ' + label);
  eq(left.run('presetRandom'), right.run('presetRandom'), 'RNG parity ' + label);
}
function inert(g, action, label) {
  const before = world(g), identity = g.state, random = plain(g.run('presetRandom'));
  action();
  eq(world(g), before, label + ' leaves whole world unchanged');
  ok(g.state === identity, label + ' retains state identity');
  eq(g.run('presetRandom'), random, label + ' consumes no RNG');
}
function frozenState(g) {
  return g.run('JSON.stringify({state,uid,selection:[...selection],groups,placement,attackMode,ordinaryCommandMode,appendCommandMode,finishedBattleNarrative})');
}

try {
  test('seven distinct menu buttons and a readable accurate optional briefing', () => {
    const g = game();
    const buttons = g.elements.filter(node => /^quick(?:Assault|Harvest|Stronghold|Meridian|Control|Survival|Switchback)$/.test(node.id));
    eq(buttons.length, 7, 'exactly seven quick mission buttons');
    for (const id of [...legacy.map(row => 'quick' + row[0]), 'quickSwitchback']) {
      eq(g.elements.filter(node => node.id === id).length, 1, 'unique preset button ' + id);
      eq(g.element(id).tagName, 'BUTTON', 'native preset button ' + id);
      eq(g.element(id).getAttribute('type'), 'button', 'non-submit preset button ' + id);
      ok(!g.element(id).hidden && !g.element(id).disabled, 'available preset button ' + id);
    }
    const oldHtml = fs.readFileSync(baseline, 'utf8');
    for (const [suffix] of legacy) {
      const button = oldHtml.match(new RegExp('<button type="button" id="quick' + suffix + '">[\\s\\S]*?<\\/button>'))?.[0];
      ok(button && html.includes(button), 'legacy button markup unchanged ' + suffix);
    }
    ok(html.includes('<button type="button" id="quickSwitchback">双闸突进<small>双闸回廊 · 要点驻守 · 老兵 · 机动作战</small></button>'), 'switchback visible button label matches configuration');
    eq(g.elements.filter(node => node.id === 'quickSwitchbackBrief').length, 1, 'unique switchback briefing');
    const brief = g.element('quickSwitchbackBrief'), tips = g.element('quickMissionTips');
    eq(brief.tagName, 'SECTION', 'brief is a section');
    ok(tips.contains(brief), 'brief belongs to optional mission tips');
    eq(tips.getAttribute('open'), null, 'mission tips stay initially collapsed');
    eq(brief.children.map(node => node.tagName), ['H4', 'P', 'UL'], 'brief has heading configuration and instructions');
    for (let node = brief; node; node = node.parentNode) ok(!node.hidden && node.style.display !== 'none', 'brief has no hidden ancestor');
    ok(!g.elements.some(node => brief.contains(node) && ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(node.tagName)), 'brief adds no gameplay controls');
    const text = html.match(/<section id="quickSwitchbackBrief">([\s\S]*?)<\/section>/)?.[1] || '';
    const concepts = [
      ['advanced non-guaranteed challenge', '进阶挑战，不保证获胜'],
      ['central target coordinate', '中央据点（600,500）'],
      ['strict circle and capture then hold', '进入65距离内，无敌车争夺时先占领8秒，再有效驻守90游戏秒'],
      ['contested hold pauses', '双方在圈内暂停累计'],
      ['empty or lost hold resets', '己方战斗车辆全部离开或失去归属会归零'],
      ['noncombat vehicles excluded', '矿车与维修车不计驻守'],
      ['western combat coverage', '侦察车与坦克分散守住据点西侧'],
      ['paid reinforcement order', '先补火炮、维修车、火炮'],
      ['ongoing mining and tank reinforcement', '正常采矿收入持续补坦克'],
      ['repair follows frontline', '维修车跟随前线受损车辆'],
      ['no player turret construction', '机动作战不能新建己方炮塔'],
      ['HQ destruction precedence', '指挥中心毁坏优先于驻守计时结算']
    ];
    for (const [name, phrase] of concepts) ok(text.includes(phrase), 'brief concept ' + name);
    ok(html.includes('七项快速任务均有参考'), 'mission tips advertise seven presets');
    const before = world(g);
    tips.open = true;
    g.run('updateUI()');
    eq(world(g), before, 'reading expanded briefing leaves whole world unchanged');
  });

  for (const [suffix, key, expected] of legacy) test('unchanged legacy preset ' + key, () => {
    const candidate = game(), previous = game(baseline);
    for (const g of [candidate, previous]) {
      choose(g, target);
      inert(g, () => press(g, 'quick' + suffix), 'legacy ' + key + ' button');
      eq(configuration(g), expected, 'legacy ' + key + ' exact selector values');
      eq(g.state.started, false, 'legacy ' + key + ' never auto-starts');
    }
    eq(candidate.element('mapPreviewCaption').textContent, previous.element('mapPreviewCaption').textContent, 'legacy ' + key + ' preview unchanged');
    parity(candidate, previous, key + ' pending');
    for (const g of [candidate, previous]) press(g, 'start');
    eq(liveConfiguration(candidate), expected, 'legacy ' + key + ' exact runtime values');
    parity(candidate, previous, key + ' started');
    for (const g of [candidate, previous]) g.step(.5);
    parity(candidate, previous, key + ' advanced');
  });

  test('switchback click matches manual selectors in both versions without a special game mode', () => {
    const clicked = game(), manual = game(), previous = game(baseline);
    const before = world(clicked), identity = clicked.state, random = plain(clicked.run('presetRandom'));
    press(clicked, 'quickSwitchback');
    eq(configuration(clicked), target, 'switchback button exact selector values');
    eq(clicked.state.started, false, 'switchback button never auto-starts');
    eq(world(clicked), before, 'switchback menu button leaves whole world unchanged');
    ok(clicked.state === identity, 'switchback menu button retains state identity');
    eq(clicked.run('presetRandom'), random, 'switchback menu button consumes no RNG');
    for (const g of [manual, previous]) choose(g, target);
    eq(clicked.element('mapPreviewCaption').textContent, '双闸回廊 · 6处矿点 · 3座据点 · 金色外圈为驻守目标', 'switchback preview refreshes to target map and goal');
    eq(clicked.element('mapPreview').getAttribute('aria-label'), manual.element('mapPreview').getAttribute('aria-label'), 'switchback preview accessible description matches manual');
    for (const g of [manual, previous]) parity(clicked, g, 'switchback pending');
    for (const g of [clicked, manual, previous]) press(g, 'start');
    ok(clicked.state !== identity, 'explicit start creates new battle');
    eq(liveConfiguration(clicked), target, 'explicit start uses switchback configuration');
    eq([clicked.state.cash, clicked.state.enemyCash], [1700, 2200], 'switchback uses ordinary hard-mode economy without player bonus');
    eq(clicked.run('((p)=>[p.x,p.y])(strongholdPost())'), [600, 500], 'switchback runtime central stronghold coordinate');
    eq(clicked.run('buildingRuleReason("turret")'), '机动作战挑战禁止新建己方炮塔', 'switchback runtime keeps ordinary mobile turret restriction');
    for (const g of [manual, previous]) parity(clicked, g, 'switchback start');
    for (let checkpoint = 1; checkpoint <= 12; checkpoint++) {
      for (const g of [clicked, manual, previous]) { g.step(.5); g.run('updateUI()'); }
      for (const g of [manual, previous]) parity(clicked, g, 'switchback natural step ' + checkpoint);
    }
    measurements.push({switchbackParitySeconds: clicked.state.t, randomDraws: clicked.run('presetRandom.length'), comparedSources: 3});
  });

  for (const [index, value] of [[0, 'meridian'], [1, 'survival'], [2, 'easy'], [3, 'standard']]) test('manual override remains authoritative for ' + fields[index], () => {
    const clicked = game(), manual = game(baseline), expected = [...target];
    expected[index] = value;
    press(clicked, 'quickSwitchback');
    clicked.element(fields[index]).value = value;
    clicked.element(fields[index]).dispatchEvent({type: 'change'});
    choose(manual, expected);
    eq(configuration(clicked), expected, 'manual ' + fields[index] + ' override remains selected');
    for (const g of [clicked, manual]) press(g, 'start');
    eq(liveConfiguration(clicked), expected, 'start honors manual ' + fields[index] + ' override');
    parity(clicked, manual, 'manual ' + fields[index] + ' override');
  });

  test('hidden overlay and running battle independently block preset changes', () => {
    const g = game();
    const original = configuration(g);
    // Synthetic DOM visibility isolates each production guard, not a human browser path.
    g.element('overlay').classList.add('hidden');
    inert(g, () => press(g, 'quickSwitchback'), 'hidden pre-start button');
    eq(configuration(g), original, 'hidden overlay blocks pending selector changes');
    g.element('overlay').classList.remove('hidden');
    for (const key of [null, 7, {}, '__proto__', 'constructor', 'missing']) {
      g.context.testPresetKey = key;
      inert(g, () => g.run('applyQuickMission(testPresetKey)'), 'invalid preset key');
      eq(configuration(g), original, 'invalid preset never changes selectors');
    }
    press(g, 'start');
    g.step(.5);
    inert(g, () => press(g, 'quickSwitchback'), 'hidden live button');
    eq(configuration(g), original, 'hidden live battle blocks pending selector changes');
    g.element('overlay').classList.remove('hidden');
    inert(g, () => press(g, 'quickSwitchback'), 'visible live non-restart button');
    eq(configuration(g), original, 'live non-restart guard independently blocks selector changes');
  });

  for (const paused of [false, true]) test('restart cancel and explicit replacement from ' + (paused ? 'paused' : 'running') + ' battle', () => {
    const clicked = game(), manual = game(baseline);
    for (const g of [clicked, manual]) {
      press(g, 'start');
      press(g, 'selectArmy');
      g.dispatch('keydown', {key: '1', code: 'Digit1', ctrlKey: true});
      press(g, g.document.querySelectorAll('[data-unit]').find(node => node.dataset.unit === 'scout'));
      g.step(.5);
      if (paused) press(g, 'pause');
    }
    const previous = frozenState(clicked), identity = clicked.state;
    for (const g of [clicked, manual]) press(g, 'restart');
    ok(clicked.run('restartPrompt') && clicked.state.paused, 'restart opens a paused confirmation');
    inert(clicked, () => press(clicked, 'quickSwitchback'), 'restart switchback button');
    choose(manual, target);
    eq(configuration(clicked), target, 'restart menu accepts switchback pending configuration');
    parity(clicked, manual, 'restart pending ' + paused);
    for (const g of [clicked, manual]) press(g, 'cancelRestart');
    eq(frozenState(clicked), previous, 'restart cancellation preserves current battle and orders');
    ok(clicked.state === identity, 'restart cancellation preserves current state identity');
    eq(clicked.state.paused, paused, 'restart cancellation restores prior pause state');
    eq(configuration(clicked), target, 'restart cancellation retains next-battle configuration');
    parity(clicked, manual, 'restart canceled ' + paused);
    for (const g of [clicked, manual]) { press(g, 'restart'); press(g, 'start'); }
    ok(clicked.state !== identity, 'confirmed restart creates new state');
    eq(liveConfiguration(clicked), target, 'confirmed restart applies pending switchback configuration');
    eq(clicked.state.t, 0, 'confirmed restart resets game time');
    eq(clicked.state.queue.length, 0, 'confirmed restart clears old production orders');
    eq(clicked.run('groups'), [[], [], []], 'confirmed restart clears old groups');
    parity(clicked, manual, 'confirmed restart ' + paused);
  });

  for (const terminal of [true, false, null]) test('terminal read-only preset and next battle for ' + terminal, () => {
    const clicked = game(), manual = game(baseline);
    for (const g of [clicked, manual]) {
      press(g, 'start');
      g.step(.5);
      // Synthetic completion fixture isolates terminal menu behavior. No legal win-route claim.
      g.run('finish(' + JSON.stringify(terminal) + ')');
      g.run('updateUI()');
    }
    const result = clicked.state.result, identity = clicked.state;
    inert(clicked, () => press(clicked, 'quickSwitchback'), 'terminal switchback button');
    choose(manual, target);
    eq(configuration(clicked), target, 'terminal menu accepts switchback pending configuration');
    eq(clicked.state.result, result, 'terminal preset retains completed result');
    parity(clicked, manual, 'terminal pending ' + terminal);
    for (const g of [clicked, manual]) press(g, 'viewBattle');
    inert(clicked, () => press(clicked, 'quickAssault'), 'hidden finished-battle preset');
    eq(configuration(clicked), target, 'finished-battle view blocks preset changes');
    for (const g of [clicked, manual]) { g.step(1); g.run('updateUI()'); }
    parity(clicked, manual, 'terminal frozen viewing ' + terminal);
    for (const g of [clicked, manual]) { press(g, 'returnResult'); press(g, 'start'); }
    ok(clicked.state !== identity, 'terminal explicit start replaces completed state');
    eq(clicked.state.result, null, 'terminal explicit start clears result');
    eq(liveConfiguration(clicked), target, 'terminal explicit start uses pending switchback configuration');
    parity(clicked, manual, 'terminal next battle ' + terminal);
  });

  test('preset table immutability and no persistence writes across tested interactions', () => {
    const g = game();
    eq(g.run('Object.keys(quickMissions)'), [...legacy.map(row => row[1]), 'switchback'], 'preset table contains exactly the seven expected keys');
    ok(g.run('Object.isFrozen(quickMissions)&&Object.values(quickMissions).every(Object.isFrozen)'), 'preset table and every configuration remain frozen');
    for (const [index, instance] of games.entries()) eq(instance.run('presetStorageWrites'), [], 'no preset persistence writes instance ' + index);
    measurements.push({wholeSourceInstances: games.length, legacyPresets: legacy.length, manualOverrideFields: fields.length, terminalFixtureKinds: 3});
  });

  console.log(JSON.stringify({passed: results.length, failed: 0, assertions, measurements, results, scope: 'Whole product source executed in the existing deterministic VM. Six v292 presets unchanged; new menu-only Switchback selection, runtime/manual/baseline whole-state and RNG parity, all four manual overrides, independent hidden/live guards, running/paused restart cancellation and replacement, synthetic win/loss/draw terminal boundaries, readable briefing and no persistence writes. No native browser, layout, screen-reader, save lifecycle, or natural winning-strategy acceptance claim.'}, null, 2));
} finally {
  fs.rmSync(directory, {recursive: true, force: true});
}
