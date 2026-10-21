'use strict';
// Each temporary source mutant must fail its specific meaningful positive assertion.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const suite = path.join(__dirname, 'quick-switchback-v316.cjs');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'red-switchback-mutants-v294-'));
const results = [];
const entry = "switchback:Object.freeze({scenario:'switchback',objective:'stronghold',difficulty:'hard',challenge:'mobile'})";
const handler = "$('quickSwitchback').onclick=()=>applyQuickMission('switchback');";
const guard = "function applyQuickMission(key){if($('overlay').classList.contains('hidden')||(state?.started&&!restartPrompt&&!state.result)||typeof key!=='string'||!Object.hasOwn(quickMissions,key))return;";
const apply = "let preset=quickMissions[key];for(let field of ['scenario','objective','difficulty','challenge'])$(field).value=preset[field];updateMapPreview()";
const button = '<button type="button" id="quickSwitchback">双闸突进<small>双闸回廊 · 要点驻守 · 老兵 · 机动作战</small></button>';
const variants = [
  ['wrong click wiring', handler, handler.replace("applyQuickMission('switchback')", "applyQuickMission('stronghold')"), 'switchback button exact selector values'],
  ['wrong preset map', entry, entry.replace("scenario:'switchback'", "scenario:'ring'"), 'switchback button exact selector values'],
  ['wrong preset objective', entry, entry.replace("objective:'stronghold'", "objective:'annihilation'"), 'switchback button exact selector values'],
  ['wrong preset difficulty', entry, entry.replace("difficulty:'hard'", "difficulty:'normal'"), 'switchback button exact selector values'],
  ['wrong preset challenge', entry, entry.replace("challenge:'mobile'", "challenge:'standard'"), 'switchback button exact selector values'],
  ['automatic start on preset click', handler, "$('quickSwitchback').onclick=()=>{applyQuickMission('switchback');start()};", 'switchback button never auto-starts'],
  ['preset mutates current economy', apply, "if(key==='switchback')state.cash+=1;" + apply, 'switchback menu button leaves whole world unchanged'],
  ['preset consumes random', apply, "if(key==='switchback')Math.random();" + apply, 'switchback menu button consumes no RNG'],
  ['switchback preview not refreshed', apply, apply.replace('updateMapPreview()', "if(key!=='switchback')updateMapPreview()"), 'switchback preview refreshes to target map and goal'],
  ['hidden overlay guard omitted', guard, guard.replace("$('overlay').classList.contains('hidden')||", ''), 'hidden overlay blocks pending selector changes'],
  ['live battle guard omitted', guard, guard.replace('(state?.started&&!restartPrompt&&!state.result)||', ''), 'live non-restart guard independently blocks selector changes'],
  ['restart menu incorrectly blocked', guard, guard.replace('!restartPrompt&&!state.result', '!state.result'), 'restart menu accepts switchback pending configuration'],
  ['terminal menu incorrectly blocked', guard, guard.replace('!restartPrompt&&!state.result', '!restartPrompt'), 'terminal menu accepts switchback pending configuration'],
  ['restart preset changes live battle', apply, "if(key==='switchback'&&restartPrompt)state.cash+=1;" + apply, 'restart switchback button leaves whole world unchanged'],
  ['terminal preset changes result', apply, "if(key==='switchback'&&state.result)state.result='changed';" + apply, 'terminal switchback button leaves whole world unchanged'],
  ['manual difficulty overwritten at start', 'function start(){clearImportReadReceipt();', "function start(){if($('scenario').value==='switchback')$('difficulty').value='hard';clearImportReadReceipt();", 'start honors manual difficulty override'],
  ['restart cancellation discards pending map', 'function cancelRestart(){if(!restartPrompt)return;', "function cancelRestart(){if(!restartPrompt)return;$('scenario').value='classic';", 'restart cancellation retains next-battle configuration'],
  ['mutable new preset entry', entry, entry.replace('Object.freeze(', '').slice(0, -1), 'preset table and every configuration remain frozen'],
  ['duplicate new preset button', button, button + button, 'exactly seven quick mission buttons'],
  ['brief hidden from players', '<section id="quickSwitchbackBrief">', '<section id="quickSwitchbackBrief" hidden>', 'brief has no hidden ancestor'],
  ['brief names wrong target', '目标是中央据点（600,500）', '目标是中央据点（600,400）', 'brief concept central target coordinate'],
  ['brief omits contest pause', '双方在圈内暂停累计', '双方在圈内仍会累计', 'brief concept contested hold pauses'],
  ['brief incorrectly counts support vehicles', '矿车与维修车不计驻守', '矿车与维修车也计驻守', 'brief concept noncombat vehicles excluded'],
  ['brief promises victory', '进阶挑战，不保证获胜', '进阶挑战，保证获胜', 'brief concept advanced non-guaranteed challenge'],
  ['brief reverses HQ precedence', '指挥中心毁坏优先于驻守计时结算', '驻守计时优先于指挥中心毁坏结算', 'brief concept HQ destruction precedence']
];

function execute(source) {
  const run = spawnSync(process.execPath, [suite, ...(source ? [source] : [])], {
    encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024
  });
  assert.ifError(run.error);
  assert.equal(run.signal, null, 'suite exits normally without timeout or signal');
  return run;
}

try {
  const positive = execute();
  assert.equal(positive.status, 0, 'unmodified candidate passes first: ' + positive.stderr);
  const report = JSON.parse(positive.stdout);
  assert.equal(report.failed, 0, 'unmodified candidate has no failures');
  assert.equal(report.passed, 19, 'all positive scenarios execute');
  for (const [name, before, after, expected] of variants) {
    assert.equal(html.split(before).length - 1, 1, name + ' has one exact mutation site');
    assert.notEqual(before, after, name + ' changes source');
    const fixture = path.join(directory, name.replaceAll(' ', '-') + '.html');
    fs.writeFileSync(fixture, html.replace(before, after));
    const run = execute(fixture);
    assert.equal(run.status, 1, name + ' fails through an assertion');
    const message = run.stderr.match(/AssertionError \[ERR_ASSERTION\]: ([^\n]*)/)?.[1];
    assert.equal(message, expected, name + ' reaches its intended invariant: ' + run.stderr.slice(0, 1000));
    results.push({name, passed: true, detectedBy: message});
  }
  console.log(JSON.stringify({passed: results.length, failed: 0, positiveScenarios: report.passed, positiveAssertions: report.assertions, results, scope: 'Unmodified positive suite must pass first. Each exact temporary source or markup mutation must exit with its named semantic assertion; syntax, source hashes, generic exceptions, signal and timeout failures are rejected. Mutant fixtures and restored baselines stay outside the package. No native browser or persistence acceptance claim.'}, null, 2));
} finally {
  fs.rmSync(directory, {recursive: true, force: true});
}
