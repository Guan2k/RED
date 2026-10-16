'use strict';

// Whole-source component fixtures and a simulated DOM, not native-browser proof.
// Command/eligibility setup is deliberately injected; every tested point command
// enters through the actual button/canvas handlers or the actual contextmenu path.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {loadGame} = require('./vm-environment.cjs');
const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const hash = () => crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const sourceHashBefore = hash();
const tests = [];
const ground = {x: 500, y: 500};
let gestureId = 200;

function check(stage, invariant, assertion) {
  try { assertion(); } catch (error) { error.stage = stage; error.invariant = invariant; throw error; }
}
function test(name, run) {
  try { tests.push({name, passed: true, fixture: 'whole-source component', ...run()}); }
  catch (error) { tests.push({name, passed: false, error: error.stack, failure: {
    stage: error.stage ?? null, invariant: error.invariant ?? null, code: error.code ?? null,
    actual: error.actual, expected: error.expected
  }}); }
}
function fresh(setup = '') {
  const g = loadGame(source, {seed: 264}).start();
  g.run(`selection=new Set([6]);groups[0]=[6,7];${setup};updateUI()`);
  return g;
}
// No state fields are filtered. Excluded are deliberately ephemeral input state:
// pointer/hover coordinates, gesture/activation tokens, pressed modes and focus.
// Navigation memory is included per entity; storage is observed, never exercised.
function world(g) {
  return g.run('JSON.stringify({state,uid,selection:[...selection],groups,placement,attackMode,simulationRemainder,navigation:state.entities.map(e=>[e.id,navigationMemory.get(e)||null])})') + JSON.stringify([...g.storage]);
}
function receipt(g) { return g.element('mapCommandReceipt').textContent; }
function armed(g, expected = true, stage = 'after_activation') {
  check(stage, expected ? 'append_armed' : 'append_disarmed', () => {
    assert.equal(g.element('appendCommand').getAttribute('aria-pressed'), String(expected));
    assert.equal(g.run('appendCommandMode'), expected);
  });
}
function event(g, type, point = ground, extra = {}) {
  g.element('map').dispatchEvent({type, button: 0, isPrimary: true, pointerType: 'mouse',
    pointerId: 501, clientX: point.x, clientY: point.y, detail: 1, ...extra});
}
function button(g, type, extra = {}, id = 'appendCommand') {
  g.element(id).dispatchEvent({type, button: 0, isPrimary: true, pointerId: 41, ...extra});
}
function activate(g, kind = 'pointer', id = 'appendCommand') {
  assert.equal(g.element(id).disabled, false, `${id} starts enabled`);
  if (kind === 'untracked') return g.click(id);
  if (kind === 'pointer') {
    button(g, 'pointerdown', {}, id); button(g, 'pointerup', {}, id); button(g, 'click', {}, id);
  } else {
    const key = kind === 'space' ? ' ' : 'Enter';
    button(g, 'keydown', {key, repeat: false}, id);
    if (key === ' ') button(g, 'keyup', {key}, id);
    button(g, 'click', {}, id);
    if (key === 'Enter') button(g, 'keyup', {key}, id);
  }
}
function releasePoint(g, point = ground, extra = {}) {
  const pointerId = ++gestureId;
  event(g, 'pointerdown', point, {pointerId, ...extra});
  event(g, 'pointerup', point, {pointerId, ...extra});
}
function context(g, point, shiftKey = true, extra = {}) {
  event(g, 'contextmenu', point, {button: 2, shiftKey, ...extra});
}
function compareAppend(name, setup, point, verify) {
  test(name, () => {
    const append = fresh(setup), shift = fresh(setup);
    assert.equal(world(append), world(shift), 'identical complete starting worlds');
    const before = world(append);
    activate(append);
    check('after_arming', 'world_unchanged', () => assert.equal(world(append), before));
    releasePoint(append, point);
    context(shift, point);
    check('after_release', 'shift_world_equivalence', () => assert.equal(world(append), world(shift)));
    check('after_release', 'shift_receipt_equivalence', () => assert.equal(receipt(append), receipt(shift)));
    armed(append, false, 'after_release');
    verify?.(append);
    return {reference: 'actual same-source Shift-contextmenu', point};
  });
}

compareAppend('ground_idle_matches_shift', '', ground, g => {
  check('after_release', 'route_created', () => assert.equal(g.run('get(6).moveQueue.length'), 1));
});
compareAppend('ground_existing_route_matches_shift', 'get(6).goal={x:450,y:500};get(6).moveQueue=[{x:450,y:500},{x:470,y:500}]', ground, g => {
  check('after_release', 'existing_route_retained', () => assert.equal(g.run('JSON.stringify(get(6).moveQueue)'), '[{"x":450,"y":500},{"x":470,"y":500},{"x":500,"y":500}]'));
});
compareAppend('ground_first_attackmove_segment_preserved', 'get(6).goal={x:450,y:500};get(6).attackMove=true;get(6).holdOnArrival=true', ground, g => {
  check('after_release', 'first_segment_attackmove_preserved', () => {
    assert.equal(g.run('get(6).attackMove'), true);
    assert.equal(g.run('get(6).holdOnArrival'), true);
    assert.equal(g.run('JSON.stringify(get(6).goal)'), '{"x":450,"y":500}');
    assert.equal(g.run('get(6).moveQueue.length'), 2);
  });
});
compareAppend('ground_duplicate_coordinates_preserve_existing_policy', 'get(6).goal={x:500,y:500};get(6).moveQueue=[{x:500,y:500}]', ground, g => {
  check('after_release', 'existing_duplicate_policy', () => assert.equal(g.run('get(6).moveQueue.length'), 2));
});
compareAppend('ground_route_cap_retains_commands', 'get(6).goal={x:450,y:500};get(6).moveQueue=Array.from({length:8},(_,i)=>({x:450+i,y:500}))', ground, g => {
  check('after_release', 'route_cap', () => assert.equal(g.run('get(6).moveQueue.length'), 8));
});
compareAppend('enemy_idle_matches_shift', '', {x:1050,y:125}, g => {
  check('after_release', 'attack_queue_created', () => assert.equal(g.run('JSON.stringify(get(6).attackQueue)'), '[9]'));
});
compareAppend('enemy_current_target_preserved', 'get(6).target=9;get(6).attackMove=true', {x:1100,y:250}, g => {
  check('after_release', 'current_attack_retained', () => {
    assert.equal(g.run('get(6).target'), 9); assert.equal(g.run('JSON.stringify(get(6).attackQueue)'), '[9,10]');
  });
});
compareAppend('enemy_duplicate_retains_commands', 'get(6).target=9;get(6).attackQueue=[9,10]', {x:1100,y:250}, g => {
  check('after_release', 'attack_duplicate_ignored', () => assert.equal(g.run('JSON.stringify(get(6).attackQueue)'), '[9,10]'));
});
compareAppend('enemy_queue_cap_retains_commands', 'get(6).target=9;get(6).attackQueue=[9,10,11,12,13,14,15,16]', {x:930,y:300}, g => {
  check('after_release', 'attack_cap', () => assert.equal(g.run('JSON.stringify(get(6).attackQueue)'), '[9,10,11,12,13,14,15,16]'));
});
for (const [label,point] of [['miner',{x:350,y:660}],['factory',{x:220,y:750}],['friendly_combat',{x:360,y:580}]]) {
  compareAppend(`friendly_or_blocked_${label}_no_replacement`, 'get(6).goal={x:450,y:500};get(6).moveQueue=[{x:450,y:500}]', point, g => {
    check('after_release', 'original_command_retained', () => {
      assert.equal(g.run('JSON.stringify(get(6).goal)'), '{"x":450,"y":500}');
      assert.equal(g.run('JSON.stringify(get(6).moveQueue)'), '[{"x":450,"y":500}]');
      assert.equal(g.run('get(6).escortId||null'), null);
    });
  });
}
compareAppend('rock_blocked_retains_commands', 'state.mapChoice="canyon";get(6).goal={x:450,y:500};get(6).moveQueue=[{x:450,y:500}]', {x:600,y:400}, g => {
  check('after_release','rock_is_real_and_order_retained',()=>{
    assert.equal(g.run('terrainObstacles().some(o=>o.x===600&&o.y===400)'),true);
    assert.equal(g.run('JSON.stringify(get(6).moveQueue)'), '[{"x":450,"y":500}]');
  });
});
compareAppend('mixed_ground_eligibility_preserves_unsupported', `globalThis.service=create('repair',0,400,700);service.goal={x:430,y:700};get(5).goal={x:410,y:650};get(4).rally={x:400,y:750};get(7).target=9;selection=new Set([6,7,5,4,service.id])`, ground, g => {
  check('after_release', 'only_eligible_ground_changed', () => {
    assert.equal(g.run('get(6).moveQueue.length'), 1);
    assert.equal(g.run('get(7).target'), 9);
    assert.equal(g.run('JSON.stringify(service.goal)'), '{"x":430,"y":700}');
    assert.equal(g.run('JSON.stringify(get(5).goal)'), '{"x":410,"y":650}');
    assert.equal(g.run('JSON.stringify(get(4).rally)'), '{"x":400,"y":750}');
    assert.match(receipt(g), /4 个所选存活友方单位保留/);
  });
});
compareAppend('mixed_enemy_eligibility_preserves_moving_and_support', `globalThis.service=create('repair',0,400,700);service.escortId=5;get(7).goal={x:450,y:500};selection=new Set([6,7,5,4,service.id])`, {x:1050,y:125}, g => {
  check('after_release', 'only_eligible_attack_changed', () => {
    assert.equal(g.run('JSON.stringify(get(6).attackQueue)'), '[9]');
    assert.equal(g.run('JSON.stringify(get(7).goal)'), '{"x":450,"y":500}');
    assert.equal(g.run('service.escortId'), 5);
    assert.match(receipt(g), /4 个所选存活友方单位保留/);
  });
});
for (const [field,value] of [['hold','true'],['escortId','5'],['patrol','{a:{x:320,y:540},b:{x:450,y:500},next:0}'],['guardArea','{x:320,y:540}'],['target','9']]) {
  compareAppend(`ground_ineligible_${field}_retained`, `get(6).${field}=${value}`, ground, g => {
    check('after_release','ineligible_order_retained',()=>assert.equal(g.run('get(6).moveQueue||null'),null));
  });
}
for (const [label,setup] of [['empty','selection.clear()'],['miner','selection=new Set([5])'],['factory','selection=new Set([4])'],['repair',"globalThis.s=create('repair',0,400,700);selection=new Set([s.id])"],['dead','get(6).hp=0'],['unfinished','get(6).build=1'],['enemy','selection=new Set([17])']]) {
  test(`unsupported_${label}_cannot_arm`, () => {
    const g=fresh(setup), before=world(g);
    check('before_activation','append_disabled',()=>assert.equal(g.element('appendCommand').disabled,true));
    button(g,'click');
    check('after_activation','world_unchanged',()=>assert.equal(world(g),before));
    armed(g,false); assert.equal(receipt(g),'');
  });
}

for (const kind of ['pointer','enter','space','untracked']) test(`valid_${kind}_release_exactly_once`,()=>{
  const g=fresh(), before=world(g);activate(g,kind);armed(g);
  check('after_arming','world_unchanged',()=>assert.equal(world(g),before));
  event(g,'pointerdown');
  check('after_pointerdown','world_unchanged',()=>assert.equal(world(g),before));
  event(g,'click');event(g,'dblclick',ground,{detail:2});
  check('after_premature_clicks','world_unchanged',()=>assert.equal(world(g),before));
  event(g,'pointerup');
  check('after_release','route_created_once',()=>assert.equal(g.run('get(6).moveQueue.length'),1));
  armed(g,false,'after_release');const after=world(g),text=receipt(g);
  for(const type of ['pointerup','click','dblclick'])event(g,type,ground,{detail:2});
  check('after_duplicate_release','world_unchanged',()=>assert.equal(world(g),after));
  check('after_duplicate_release','receipt_unchanged',()=>assert.equal(receipt(g),text));
});
for (const pointerType of ['touch','pen']) test(`${pointerType}_release_uses_append_path`,()=>{
  const a=fresh('get(6).goal={x:450,y:500}'),b=fresh('get(6).goal={x:450,y:500}');
  activate(a);releasePoint(a,ground,{pointerType});context(b,ground);
  check('after_release','shift_world_equivalence',()=>assert.equal(world(a),world(b)));
});
test('pointer_activation_waits_for_matching_primary_release',()=>{
  const g=fresh();button(g,'pointerdown');button(g,'click');armed(g,false);
  button(g,'pointerup',{pointerId:42});button(g,'click');armed(g,false);
  button(g,'pointerup',{isPrimary:false});button(g,'click');armed(g,false);
  button(g,'pointerup',{button:2});button(g,'click');armed(g,false);
  button(g,'pointerup');button(g,'click');armed(g);
});
test('space_activation_waits_for_keyup',()=>{
  const g=fresh();button(g,'keydown',{key:' ',repeat:false});button(g,'click');armed(g,false);
  button(g,'keyup',{key:'Enter'});button(g,'click');armed(g,false);
  button(g,'keyup',{key:' '});button(g,'click');armed(g);
});
for (const kind of ['pointer','enter','space']) test(`consumed_${kind}_activation_cannot_rearm`,()=>{
  const g=fresh();activate(g,kind);releasePoint(g);const before=world(g);
  if(kind!=='pointer')button(g,'keydown',{key:kind==='enter'?'Enter':' ',repeat:true});
  button(g,'click');button(g,'click');
  check('after_late_click','world_unchanged',()=>assert.equal(world(g),before));
  armed(g,false,'after_late_click');
  activate(g,kind);armed(g,true,'after_fresh_activation');
});
for(const key of ['Enter',' '])test(`orphan_repeat_${key===' '?'space':'enter'}_cannot_arm`,()=>{
  const g=fresh();button(g,'keydown',{key,repeat:true});button(g,'keyup',{key});button(g,'click');armed(g,false);
});
for(const interruption of ['pointercancel','lostpointercapture','button_blur','window_blur','outside_release','restart','new_battle'])test(`activation_${interruption}_late_click_rejected`,()=>{
  const g=fresh();button(g,'pointerdown');
  if(interruption==='button_blur')button(g,'blur');
  else if(interruption==='window_blur')g.dispatch('blur');
  else if(interruption==='outside_release')g.dispatch('pointerup',{pointerId:41,button:0});
  else if(interruption==='restart'){g.click('restart');g.click('cancelRestart');}
  else if(interruption==='new_battle'){g.click('restart');g.click('start');g.run('selection=new Set([6]);updateUI()');}
  else button(g,interruption);
  const before=world(g);button(g,'pointerup');button(g,'click');
  check('after_stale_activation','world_unchanged',()=>assert.equal(world(g),before));armed(g,false,'after_stale_activation');
  activate(g);armed(g,true,'after_fresh_activation');
});

for(const interruption of ['drag_return','drag_release','outside_release','nonfinite_release','pointercancel','lostpointercapture','outside_window_release','window_blur','visibility','Escape','cancel','restart','new_battle','terminal','selection_change','all_selected_dead','all_selected_unfinished'])test(`gesture_${interruption}_does_not_commit`,()=>{
  const g=fresh();activate(g);event(g,'pointerdown');let end=ground;
  if(interruption==='drag_return') {event(g,'pointermove',{x:520,y:500});event(g,'pointermove',ground);}
  else if(interruption==='drag_release')end={x:509,y:500};
  else if(interruption==='outside_release')end={x:1201,y:500};
  else if(interruption==='nonfinite_release')end={x:NaN,y:500};
  else if(interruption==='pointercancel'||interruption==='lostpointercapture')event(g,interruption);
  else if(interruption==='outside_window_release')g.dispatch('pointerup',{pointerId:501,button:0});
  else if(interruption==='window_blur')g.dispatch('blur');
  else if(interruption==='visibility'){g.document.hidden=true;g.dispatch('document:visibilitychange');}
  else if(interruption==='Escape')g.dispatch('keydown',{key:'Escape'});
  else if(interruption==='cancel')g.click('cancelPending');
  else if(interruption==='restart'){g.click('restart');g.click('cancelRestart');}
  else if(interruption==='new_battle'){g.click('restart');g.click('start');g.run('selection=new Set([6]);updateUI()');}
  else if(interruption==='terminal')g.run("state.result='胜利';updateUI()");
  else if(interruption==='selection_change')g.click('selectMiners');
  else if(interruption==='all_selected_dead')g.run('get(6).hp=0');
  else if(interruption==='all_selected_unfinished')g.run('get(6).build=1');
  const before=world(g),text=receipt(g);event(g,'pointerup',end);event(g,'click',end);event(g,'dblclick',end,{detail:2});
  check('after_interrupted_release','world_unchanged',()=>assert.equal(world(g),before));
  check('after_interrupted_release','receipt_unchanged',()=>assert.equal(receipt(g),text));
  armed(g,false,'after_interrupted_release');
});
test('unrelated_pointer_events_do_not_steal_pending_gesture',()=>{
  const g=fresh();activate(g);event(g,'pointerdown');const before=world(g);
  event(g,'pointerdown',{x:700,y:500},{pointerId:502});event(g,'pointermove',{x:700,y:500},{pointerId:502});
  event(g,'pointercancel',ground,{pointerId:502});event(g,'lostpointercapture',ground,{pointerId:502});
  event(g,'pointerup',ground,{pointerId:502});event(g,'pointerup',ground,{isPrimary:false});
  check('after_unrelated_pointer','world_unchanged',()=>assert.equal(world(g),before));armed(g);
  event(g,'pointerup');check('after_matching_release','route_created_once',()=>assert.equal(g.run('get(6).moveQueue.length'),1));
});
test('secondary_down_cannot_start_append_point',()=>{
  const g=fresh();activate(g);const before=world(g);
  event(g,'pointerdown',ground,{button:2});event(g,'pointerup',ground,{button:2});
  event(g,'pointerdown',ground,{isPrimary:false});event(g,'pointerup',ground,{isPrimary:false});
  check('after_secondary_input','world_unchanged',()=>assert.equal(world(g),before));armed(g);
  releasePoint(g);check('after_primary_release','route_created_once',()=>assert.equal(g.run('get(6).moveQueue.length'),1));
});
test('capture_failure_cancels_without_command',()=>{
  const g=fresh();activate(g);g.element('map').setPointerCapture=()=>{throw Error('component capture failure')};
  const before=world(g);event(g,'pointerdown');event(g,'pointerup');
  check('after_failed_capture','world_unchanged',()=>assert.equal(world(g),before));armed(g,false);
});
test('target_revalidated_at_release_matches_shift',()=>{
  const a=fresh(),b=fresh(),point={x:1050,y:125};activate(a);event(a,'pointerdown',point);
  a.run('get(9).hp=0');b.run('get(9).hp=0');event(a,'pointerup',point);context(b,point);
  check('after_release','shift_world_equivalence',()=>assert.equal(world(a),world(b)));
  check('after_release','dead_target_not_queued',()=>assert.equal(a.run('get(6).attackQueue||null'),null));
});
test('eligibility_revalidated_at_release_without_replace',()=>{
  const a=fresh(),b=fresh();activate(a);event(a,'pointerdown');a.run('get(6).hold=true');b.run('get(6).hold=true');
  event(a,'pointerup');context(b,ground);
  check('after_release','shift_world_equivalence',()=>assert.equal(world(a),world(b)));
  check('after_release','hold_retained',()=>assert.equal(a.run('get(6).hold'),true));
});
test('paused_append_planning_matches_shift_without_simulation',()=>{
  const a=fresh(),b=fresh();a.click('pause');b.click('pause');activate(a);releasePoint(a);context(b,ground);
  check('after_release','shift_world_equivalence',()=>assert.equal(world(a),world(b)));
  check('after_release','paused_receipt',()=>assert.match(receipt(a),/下达时暂停/));
  const before=world(a);a.step(2);check('after_paused_step','world_unchanged',()=>assert.equal(world(a),before));
});
test('pause_during_gesture_retains_plan_until_release',()=>{
  const g=fresh();activate(g);event(g,'pointerdown');g.click('pause');armed(g);const time=g.state.t;
  event(g,'pointerup');check('after_release','route_created_once',()=>assert.equal(g.run('get(6).moveQueue.length'),1));
  check('after_release','simulation_not_advanced',()=>assert.equal(g.state.t,time));
});

for(const destination of ['ordinary','attack','building'])test(`switch_append_to_${destination}_cancels_old_gesture`,()=>{
  const g=fresh();activate(g);event(g,'pointerdown');
  if(destination==='ordinary')activate(g,'pointer','ordinaryCommand');
  else if(destination==='attack')g.click('attack');
  else g.elements.find(n=>n.dataset.build==='power').click();
  const before=world(g),text=receipt(g);event(g,'pointerup');
  check('after_old_release','world_unchanged',()=>assert.equal(world(g),before));
  check('after_old_release','receipt_unchanged',()=>assert.equal(receipt(g),text));armed(g,false);
});
test('switch_ordinary_to_append_cancels_old_gesture',()=>{
  const g=fresh();activate(g,'pointer','ordinaryCommand');event(g,'pointerdown');activate(g);
  const before=world(g);event(g,'pointerup');check('after_old_release','world_unchanged',()=>assert.equal(world(g),before));
  armed(g);releasePoint(g);check('after_new_release','route_created_once',()=>assert.equal(g.run('get(6).moveQueue.length'),1));
});
test('shift_contextmenu_cancels_pending_point_and_commits_once',()=>{
  const a=fresh(),b=fresh();activate(a);event(a,'pointerdown');context(a,ground);context(b,ground);
  check('after_contextmenu','shift_world_equivalence',()=>assert.equal(world(a),world(b)));armed(a,false);
  const before=world(a);event(a,'pointerup');check('after_old_release','world_unchanged',()=>assert.equal(world(a),before));
});
test('append_ui_distinct_and_ordinary_preview_suppressed',()=>{
  const g=fresh();
  check('before_activation','native_button_semantics',()=>{assert.equal(g.element('appendCommand').tagName,'BUTTON');assert.equal(g.element('appendCommand').getAttribute('type'),'button');});
  activate(g,'pointer','ordinaryCommand');event(g,'pointermove');g.run('render()');
  assert.notEqual(g.element('ordinaryCommandPreviewText').textContent,'','ordinary preview is present before switching');
  activate(g);event(g,'pointermove');g.run('render()');
  check('while_append_armed','ordinary_preview_suppressed',()=>{
    assert.equal(g.run('ordinaryCommandPreview({x:500,y:500})'),null);
    assert.equal(g.element('ordinaryCommandPreviewText').textContent,'');
    assert.notEqual(g.element('map').getAttribute('aria-describedby'),'ordinaryCommandPreviewText');
  });
  check('while_append_armed','distinct_mode_feedback',()=>{
    assert.equal(g.element('ordinaryCommand').getAttribute('aria-pressed'),'false');
    assert.match(g.element('mission').textContent,/追加/);
    assert.match(g.element('cancelPending').textContent,/追加/);
    assert.match(g.element('appendCommand').title,/战斗|战车/);
  });
});
for(const [label,setup,point] of [['ground','get(6).goal={x:450,y:500};get(6).moveQueue=[{x:450,y:500},{x:470,y:500}]',ground],['enemy','get(6).target=10;get(6).attackQueue=[10,11]',{x:1050,y:125}],['escort','',{x:350,y:660}],['factory','selection=new Set([4]);get(4).rally={x:450,y:500}',ground]])test(`ordinary_${label}_still_matches_nonshift_contextmenu`,()=>{
  const a=fresh(setup),b=fresh(setup);activate(a,'pointer','ordinaryCommand');releasePoint(a,point,{shiftKey:true,altKey:true,ctrlKey:true});context(b,point,false);
  check('after_ordinary_release','ordinary_world_equivalence',()=>assert.equal(world(a),world(b)));
  check('after_ordinary_release','ordinary_receipt_equivalence',()=>assert.equal(receipt(a),receipt(b)));
});
test('unarmed_mouse_selection_is_unchanged',()=>{
  const g=fresh();releasePoint(g,{x:360,y:580});
  check('after_selection','friendly_selected_without_order',()=>{
    assert.equal(g.run('JSON.stringify([...selection])'),'[7]');assert.equal(g.run('get(7).moveQueue||null'),null);
  });
});
test('unarmed_touch_point_retains_ordinary_command_behavior',()=>{
  const a=fresh('get(6).goal={x:450,y:500};get(6).moveQueue=[{x:450,y:500}]'),b=fresh('get(6).goal={x:450,y:500};get(6).moveQueue=[{x:450,y:500}]');
  releasePoint(a,ground,{pointerType:'touch'});context(b,ground,false);
  check('after_touch_release','ordinary_world_equivalence',()=>assert.equal(world(a),world(b)));
});


for(const kind of ['enter','space'])for(const interruption of ['button_blur','window_blur','visibility','Escape','restart','new_battle'])test(`key_${kind}_${interruption}_late_default_rejected`,()=>{
  const g=fresh(),key=kind==='enter'?'Enter':' ';button(g,'keydown',{key,repeat:false});
  if(interruption==='button_blur')button(g,'blur');
  else if(interruption==='window_blur')g.dispatch('blur');
  else if(interruption==='visibility'){g.document.hidden=true;g.dispatch('document:visibilitychange');}
  else if(interruption==='Escape')g.dispatch('keydown',{key:'Escape'});
  else if(interruption==='restart'){g.click('restart');g.click('cancelRestart');}
  else {g.click('restart');g.click('start');g.run('selection=new Set([6]);updateUI()');}
  const before=world(g);button(g,'keyup',{key});button(g,'click');
  check('after_stale_key_default','world_unchanged',()=>assert.equal(world(g),before));armed(g,false,'after_stale_key_default');
  activate(g,kind);armed(g,true,'after_fresh_activation');
});
for(const [label,point] of [['outside',{x:-1,y:500}],['nonfinite',{x:Infinity,y:500}]])test(`invalid_${label}_start_cannot_commit`,()=>{
  const g=fresh();activate(g);const before=world(g);event(g,'pointerdown',point);event(g,'pointerup',ground);
  check('after_invalid_start','world_unchanged',()=>assert.equal(world(g),before));armed(g,false);
});
test('exact_eight_pixel_release_is_valid',()=>{
  const a=fresh(),b=fresh(),end={x:508,y:500};activate(a);event(a,'pointerdown');event(a,'pointerup',end);context(b,end);
  check('after_release','shift_world_equivalence',()=>assert.equal(world(a),world(b)));
});
test('append_modifiers_do_not_replace_or_attackmove',()=>{
  const a=fresh('get(6).goal={x:450,y:500}'),b=fresh('get(6).goal={x:450,y:500}');activate(a);releasePoint(a,ground,{shiftKey:true,altKey:true,ctrlKey:true});context(b,ground);
  check('after_release','shift_world_equivalence',()=>assert.equal(world(a),world(b)));
});
test('component_battle_identity_change_rejects_old_release',()=>{
  const g=fresh();activate(g);event(g,'pointerdown');g.run('state={...state}');const before=world(g);event(g,'pointerup');
  check('after_old_battle_release','world_unchanged',()=>assert.equal(world(g),before));armed(g,false);
});
test('component_activation_battle_identity_change_rejects_old_click',()=>{
  const g=fresh();button(g,'pointerdown');g.run('state={...state}');const before=world(g);button(g,'pointerup');button(g,'click');
  check('after_old_battle_activation','world_unchanged',()=>assert.equal(world(g),before));armed(g,false,'after_old_battle_activation');
});

const sourceHashAfter=hash();
assert.equal(sourceHashAfter,sourceHashBefore,'source remained unchanged');
const report={passed:tests.filter(t=>t.passed).length,failed:tests.filter(t=>!t.passed).length,total:tests.length,source,sourceHashBefore,sourceHashAfter,
  scope:'Whole-source Node VM/simulated DOM component fixtures with explicit selection, command, eligibility and terminal setup. Actual native-button handler and canvas event paths are compared with actual same-source Shift-contextmenu. Full state, selection, groups, uid, placement, attack mode, simulation remainder, entity navigation and storage snapshots are retained. Only ephemeral input mode/token/gesture/hover/focus differences are excluded and separately tested. No native-browser, real touch, focus, event-ordering, layout or assistive-technology claim. No save/import/export, publication or user-computer operations.',tests};
console.log(JSON.stringify(report,null,2));
if(report.failed)process.exitCode=1;
