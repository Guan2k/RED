'use strict';

// Explicitly synthetic component fixtures. This is whole-source VM/simulated-DOM
// coverage, not a natural-playthrough or native-browser fidelity claim.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {loadGame} = require('./vm-environment.cjs');
const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const sourceHash = () => crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const sourceHashBefore = sourceHash();
const tests = [];

function test(name, action) {
  try { action(); tests.push({name, passed: true}); }
  catch (error) {
    tests.push({name, passed: false, error: error.stack, failure: {
      stage: error.stage ?? null, invariant: error.invariant ?? null,
      code: error.code ?? null, actual: error.actual, expected: error.expected
    }});
  }
}
function check(stage, invariant, action) {
  try { action(); } catch (error) { error.stage = stage; error.invariant = invariant; throw error; }
}
function json(g, expression) {
  return JSON.parse(g.run(`JSON.stringify(${expression}, (key,value) => key === 'battle' && value === state ? {__battleReference:true} : value === undefined ? {__undefined:true} : typeof value === 'number' && !Number.isFinite(value) ? {__number:String(value)} : value)`));
}
function world(g) {
  return json(g, `({state,uid,groups,selection:[...selection],placement,attackMode,drag,mouse,hoverActive,
    ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,ordinaryCommandActivation,appendCommandActivation,
    selectionClickCandidate,lastSelectionClick,doubleClickSelection,restartPrompt,resumeAfterCancel,simulationRemainder})`);
}
function fresh(kind = 'move') {
  const g = loadGame(source, {seed: 265}).start();
  g.run(`globalThis.u=get(6); selection=new Set([6]);
    globalThis.fixtureMove=e=>{e.goal={x:450,y:540};e.moveQueue=[{x:450,y:540},{x:500,y:620},{x:480,y:700}];e.target=null;e.attackMove=false;e.arrivalRadius=9;e.holdOnArrival=true;delete e.attackQueue;delete e.escortId;delete e.patrol;delete e.guardArea;delete e.hold;};
    globalThis.fixtureAttack=e=>{e.target=13;e.attackQueue=[13,15,17,18];e.goal=null;e.attackMove=false;delete e.moveQueue;delete e.holdOnArrival;delete e.escortId;delete e.patrol;delete e.guardArea;delete e.hold;};
    ${kind === 'move' ? 'fixtureMove(u)' : 'fixtureAttack(u)'};
    navigationMemory.set(u,{fixtureToken:265,path:[{x:350,y:540}],wait:0});
    globalThis.soundCalls=[];playSound=kind=>soundCalls.push(kind);updateUI();`);
  return g;
}
function count(g) { return g.run('clearFutureQueueOrders().length'); }
function refs(g) {
  return {
    state: g.state,
    entities: g.state.entities,
    selection: g.run('selection'),
    groups: g.run('groups'),
    inputs: g.run('[drag,mouse,ordinaryCommandGesture,ordinaryCommandActivation,appendCommandActivation,selectionClickCandidate]'),
    units: g.state.entities.map(unit => ({unit, goal: unit.goal, move: unit.moveQueue, attack: unit.attackQueue,
      attackContents: Array.isArray(unit.attackQueue) ? [...unit.attackQueue] : null, head: unit.moveQueue?.[0],
      nav: g.run(`navigationMemory.get(state.entities.find(e=>e.id===${unit.id}))`)}))
  };
}
function preserveRefs(g, before, changed = []) {
  assert.equal(g.state, before.state, 'state identity');
  assert.equal(g.state.entities, before.entities, 'entity-array identity');
  assert.equal(g.run('selection'), before.selection, 'selection identity');
  assert.equal(g.run('groups'), before.groups, 'control-groups identity');
  const currentInputs = g.run('[drag,mouse,ordinaryCommandGesture,ordinaryCommandActivation,appendCommandActivation,selectionClickCandidate]');
  before.inputs.forEach((value, index) => assert.equal(currentInputs[index], value, `input reference ${index}`));
  for (const record of before.units) {
    assert.equal(g.state.entities.find(unit => unit.id === record.unit.id), record.unit, 'entity identity');
    assert.equal(record.unit.goal, record.goal, 'current goal identity');
    assert.equal(g.run(`navigationMemory.get(state.entities.find(e=>e.id===${record.unit.id}))`), record.nav, 'navigation identity');
    assert.equal(record.unit.moveQueue, record.move, 'movement queue identity');
    if (record.move) assert.equal(record.move[0], record.head, 'current movement head identity');
    if (changed.some(change => change.id === record.unit.id && change.kind === 'attack')) {
      assert.equal(Object.hasOwn(record.unit, 'attackQueue'), false, 'attack queue property removed');
      assert.deepEqual([...record.attack], record.attackContents, 'detached raw attack array untouched');
    } else assert.equal(record.unit.attackQueue, record.attack, 'unchanged attack queue identity');
  }
}
function success(g, changes, stage = 'after_clear') {
  const before = world(g), identities = refs(g);
  g.click('clearFutureQueue');
  check(stage, 'only_future_queues_and_one_log_change', () => {
    const after = world(g), expected = structuredClone(before);
    for (const change of changes) {
      const unit = expected.state.entities.find(candidate => candidate.id === change.id);
      if (change.kind === 'move') unit.moveQueue.length = 1;
      else delete unit.attackQueue;
    }
    const attackCount = changes.filter(change => change.kind === 'attack').length;
    const moveCount = changes.filter(change => change.kind === 'move').length;
    const parts = [];
    if (attackCount) parts.push('攻击' + attackCount + '辆');
    if (moveCount) parts.push('路线' + moveCount + '辆');
    const expectedLog = '已清除后续队列：' + parts.join('、') + '；当前指令与抵达后坚守保留，待点选操作保留';
    assert.equal(after.state.logs[0], expectedLog, 'truthful exact category and affected-vehicle counts');
    expected.state.logs = [expectedLog, ...before.state.logs].slice(0, 4);
    assert.deepEqual(after, expected);
  });
  check(stage, 'current_order_and_navigation_references_preserved', () => preserveRefs(g, identities, changes));
  check(stage, 'one_order_sound', () => assert.deepEqual(json(g, 'soundCalls'), ['order']));
  return before;
}
function noOp(g, stage = 'after_rejected_clear', inspect = true) {
  const availability = inspect ? {count: count(g), disabled: g.element('clearFutureQueue').disabled} : null;
  const before = world(g), identities = refs(g), sounds = json(g, 'soundCalls');
  // Direct callback dispatch deliberately bypasses simulated disabled-click suppression.
  g.element('clearFutureQueue').dispatchEvent({type: 'click'});
  check(stage, 'world_unchanged', () => assert.deepEqual(world(g), before));
  check(stage, 'references_preserved', () => preserveRefs(g, identities));
  check(stage, 'no_success_sound', () => assert.deepEqual(json(g, 'soundCalls'), sounds));
  if (inspect) {
    check('before_rejected_clear', 'zero_eligible_orders', () => assert.equal(availability.count, 0));
    check('before_rejected_clear', 'button_disabled', () => assert.equal(availability.disabled, true));
  }
}

test('native_button_uses_shared_live_eligibility', () => {
  const g = fresh();
  check('render', 'native_button_and_live_count', () => {
    const control = g.element('clearFutureQueue');
    assert.ok(control); assert.equal(control.tagName, 'BUTTON'); assert.equal(control.getAttribute('type'), 'button');
    assert.equal(typeof control.onclick, 'function'); assert.equal(control.disabled, false);
    assert.equal(count(g), 1); assert.match(control.textContent, /1/);
    assert.match(control.getAttribute('title'), /当前/); assert.match(control.getAttribute('title'), /抵达|坚守/);
  });
});
for (const mode of [false, true]) test(`ground_${mode ? 'attack_move' : 'ordinary'}_exact_delta`, () => {
  const g = fresh();g.run(`u.attackMove=${mode};updateUI()`);
  success(g, [{id:6,kind:'move'}]);
  check('after_clear', 'head_goal_arrival_flags_preserved', () => {
    assert.equal(g.run('u.moveQueue.length'), 1);assert.equal(g.run('u.attackMove'), mode);
    assert.equal(g.run('u.arrivalRadius'), 9);assert.equal(g.run('u.holdOnArrival'), true);
  });
});
for (const hold of ['false', 'undefined', 'true']) test(`ground_arrival_hold_${hold}_preserved`, () => {
  const g=fresh();g.run(hold === 'undefined' ? 'delete u.holdOnArrival;updateUI()' : `u.holdOnArrival=${hold};updateUI()`);
  success(g,[{id:6,kind:'move'}]);
});
for (const [name, target, queue] of [
  ['head',13,[13,15,17]], ['middle',15,[13,15,17]], ['end',17,[13,15,17]],
  ['absent',10,[13,15,17]], ['one_other_target',13,[15]], ['duplicates',13,[13,13,15,15]]
]) test(`attack_current_${name}_preserved`, () => {
  const g=fresh('attack');g.run(`u.target=${target};u.attackQueue=${JSON.stringify(queue)};updateUI()`);
  success(g,[{id:6,kind:'attack'}]);
  check('after_clear','actual_current_target_preserved',()=>assert.equal(g.run('u.target'),target));
});
test('attack_invalid_entries_do_not_prevent_real_pending_clear',()=>{
  const g=fresh('attack');g.run('get(17).hp=0;u.attackQueue=[13,99999,7,17,15];updateUI()');
  success(g,[{id:6,kind:'attack'}]);
});
test('mixed_selection_changes_only_eligible_queues',()=>{
  const g=fresh();g.run(`fixtureAttack(get(7));fixtureMove(get(8));get(8).target=13;fixtureMove(get(5));
    fixtureMove(get(17));selection=new Set([6,7,8,5,17,4]);updateUI()`);
  check('before_clear','exact_eligible_vehicle_count',()=>assert.equal(count(g),2));
  check('before_clear','render_count_matches_predicate',()=>assert.match(g.element('clearFutureQueue').textContent,/2/));
  success(g,[{id:6,kind:'move'},{id:7,kind:'attack'}]);
  check('after_clear','one_truthful_mixed_log',()=>{
    assert.match(g.state.logs[0],/攻击1辆/);assert.match(g.state.logs[0],/路线1辆/);
  });
});
test('repeat_clear_is_idempotent_without_extra_log_or_sound',()=>{
  const g=fresh();success(g,[{id:6,kind:'move'}]);
  check('after_first_clear','button_disabled',()=>assert.equal(g.element('clearFutureQueue').disabled,true));
  noOp(g,'after_repeat_clear');
});
test('paused_clear_does_not_advance_simulation',()=>{
  const g=fresh();g.click('pause');g.run('soundCalls.length=0');success(g,[{id:6,kind:'move'}]);
  check('after_clear','paused_time_retained',()=>{assert.equal(g.state.paused,true);assert.equal(g.state.t,0)});
});
for (const [label, setup] of [
  ['unstarted','state.started=false'],['terminal',"state.result='胜利'"],['restart','restartPrompt=true']
]) test(`gate_${label}_blocks_even_direct_callback`,()=>{
  const g=fresh();g.run(`${setup};updateUI()`);
  check('before_rejected_clear','gate_disables_button',()=>assert.equal(g.element('clearFutureQueue').disabled,true));
  noOp(g,'after_blocked_callback',false);
});
for (const [label, setup] of [
  ['dead_owner','u.hp=0'],['enemy_owner','u.team=1'],['unfinished_owner','u.build=1'],
  ['harvester_owner',"u.type='harvester'"],['repair_owner',"u.type='repair'"],['building_owner',"u.type='factory'"],
  ['no_selection','selection.clear()'],['missing_selection','selection=new Set([99999])']
]) test(`eligibility_${label}_is_noop`,()=>{
  const g=fresh();g.run(`${setup};updateUI()`);noOp(g);
});
for (const kind of ['move','attack']) for(const type of ['tank','scout','artillery']) test(`${kind}_${type}_eligible`,()=>{
  const g=fresh(kind);g.run(`u.type='${type}';updateUI()`);success(g,[{id:6,kind}]);
});
const invalidGround = [
  ['single_head','u.moveQueue.length=1'],['empty_queue','u.moveQueue=[]'],['missing_queue','delete u.moveQueue'],
  ['object_queue','u.moveQueue={0:{x:450,y:540},1:{x:500,y:620},length:2}'],
  ['dual_queue','u.attackQueue=[13,15]'],['empty_opposite_queue','u.attackQueue=[]'],
  ['truthy_opposite_queue','u.attackQueue={}'],['missing_goal','u.goal=null'],
  ['goal_head_mismatch','u.goal={x:451,y:540}'],['goal_nonfinite','u.goal={x:NaN,y:540}'],
  ['goal_outside','u.goal={x:-1,y:540}'],['null_point','u.moveQueue[1]=null'],
  ['undefined_point','u.moveQueue[1]=undefined'],['sparse_point','delete u.moveQueue[1]'],
  ['number_point','u.moveQueue[1]=42'],['string_point',"u.moveQueue[1]='500,620'"],
  ['nan_point','u.moveQueue[1].x=NaN'],['infinite_point','u.moveQueue[1].y=Infinity'],
  ['numeric_string_point',"u.moveQueue[1].x='500'"],['negative_point','u.moveQueue[1].x=-1'],
  ['beyond_width','u.moveQueue[1].x=WIDTH+1'],['beyond_height','u.moveQueue[1].y=HEIGHT+1'],
  ['inside_radius_margin','u.moveQueue[1].x=u.r-1'],['target_conflict','u.target=13'],
  ['escort_conflict','u.escortId=5'],['patrol_conflict','u.patrol=[{x:450,y:540},{x:500,y:620}]'],
  ['guard_conflict','u.guardArea={x:450,y:540}'],['hold_conflict','u.hold=true'],
  ['ambiguous_attackmove','u.attackMove=1']
];
for (const [label, setup] of invalidGround) test(`ground_${label}_is_noop`,()=>{
  const g=fresh();g.run(`${setup};updateUI()`);noOp(g);
});
const invalidAttack = [
  ['missing_queue','delete u.attackQueue'],['empty_queue','u.attackQueue=[]'],
  ['object_queue','u.attackQueue={0:13,1:15,length:2}'],['current_only','u.attackQueue=[13]'],
  ['current_repeated','u.attackQueue=[13,13,13]'],['dead_pending','get(15).hp=0;u.attackQueue=[13,15]'],
  ['missing_pending','u.attackQueue=[13,99999]'],['friendly_pending','u.attackQueue=[13,7]'],
  ['all_invalid_pending','get(15).hp=0;u.attackQueue=[13,15,99999,7,13]'],
  ['absent_current_no_valid_pending','u.target=10;u.attackQueue=[99999,7]'],
  ['missing_actual_target','u.target=99999'],['dead_actual_target','get(13).hp=0'],
  ['friendly_actual_target','u.target=7'],['null_actual_target','u.target=null'],
  ['dual_queue','u.moveQueue=[{x:450,y:540},{x:500,y:620}]'],['empty_opposite_queue','u.moveQueue=[]'],
  ['truthy_opposite_queue','u.moveQueue={}'],['goal_conflict','u.goal={x:450,y:540}'],
  ['attackmove_conflict','u.attackMove=true'],['ambiguous_attackmove','delete u.attackMove'],
  ['arrival_hold_conflict','u.holdOnArrival=true'],['escort_conflict','u.escortId=5'],
  ['patrol_conflict','u.patrol=[{x:450,y:540},{x:500,y:620}]'],
  ['guard_conflict','u.guardArea={x:450,y:540}'],['hold_conflict','u.hold=true']
];
for (const [label, setup] of invalidAttack) test(`attack_${label}_is_noop`,()=>{
  const g=fresh('attack');g.run(`${setup};updateUI()`);noOp(g);
});
for(const [label,kind,change]of[
  ['selection_removed','move','selection.clear()'],['selection_replaced','move','selection=new Set([8])'],
  ['last_pending_target_died','attack','get(15).hp=0;get(17).hp=0;get(18).hp=0'],
  ['actual_target_died','attack','get(13).hp=0'],['ground_queue_shortened','move','u.moveQueue.length=1'],
  ['ground_goal_changed','move','u.goal={x:460,y:540}'],['attack_queue_replaced','attack','u.attackQueue=[13]']
])test(`stale_render_${label}_revalidated`,()=>{
  const g=fresh(kind);assert.equal(g.element('clearFutureQueue').disabled,false);
  g.run(change);noOp(g,'after_stale_callback',false);
});
test('stale_render_selection_uses_new_eligible_unit',()=>{
  const g=fresh();g.run('fixtureAttack(get(7));selection=new Set([7])');
  success(g,[{id:7,kind:'attack'}],'after_stale_selection_callback');
});
test('stale_render_queue_replacement_uses_live_queue',()=>{
  const g=fresh();g.run('u.moveQueue=[{x:450,y:540},{x:550,y:640},{x:580,y:700},{x:700,y:720}]');
  success(g,[{id:6,kind:'move'}],'after_stale_queue_callback');
});
test('availability_and_render_are_readonly_and_rng_free',()=>{
  const g=fresh();g.run('fixtureAttack(get(7));get(17).hp=0;get(7).attackQueue=[13,99999,7,17,15];selection=new Set([6,7])');
  const before=world(g),identities=refs(g);
  g.run('Math.random=()=>{throw Error("Unexpected random sample")};for(let i=0;i<15;i++){clearFutureQueueOrders();updateUI();render()}');
  check('after_repeated_render','world_unchanged',()=>assert.deepEqual(world(g),before));
  check('after_repeated_render','references_preserved',()=>preserveRefs(g,identities));
  check('after_repeated_render','no_sound',()=>assert.deepEqual(json(g,'soundCalls'),[]));
  check('after_repeated_render','count_still_matches',()=>{assert.equal(count(g),2);assert.match(g.element('clearFutureQueue').textContent,/2/)});
});
for(const mode of ['ordinary','append','attack','placement','gesture'])test(`pending_${mode}_inputs_preserved`,()=>{
  const g=fresh();
  if(mode==='ordinary')g.click('ordinaryCommand');
  if(mode==='append')g.run('appendCommandMode=true');
  if(mode==='attack')g.run('attackMode=true');
  if(mode==='placement')g.run("placement='power'");
  if(mode==='gesture')g.run('ordinaryCommandMode=true;ordinaryCommandGesture={pointerId:21,battle:state,start:{x:430,y:560},moved:false,append:false}');
  g.run('selectionClickCandidate={pointerId:12};lastSelectionClick=1;doubleClickSelection=false;updateUI();soundCalls.length=0');
  success(g,[{id:6,kind:'move'}]);
});
test('source_file_unchanged',()=>check('after_suite','source_hash_unchanged',()=>assert.equal(sourceHash(),sourceHashBefore)));
const report={passed:tests.filter(result=>result.passed).length,failed:tests.filter(result=>!result.passed).length,total:tests.length,
  source,sourceHashBefore,sourceHashAfter:sourceHash(),tests,
  scope:'Synthetic component/lifecycle/corruption fixtures in the shared whole-source VM and simulated DOM. No save/import/export, external browser, natural-playthrough, or native-keyboard fidelity claim. Exact world delta includes all state, queues, input modes, selection and one existing-style log; reference assertions cover current goals, queue heads, navigation and inputs.'};
console.log(JSON.stringify(report,null,2));
if(report.failed)process.exitCode=1;
