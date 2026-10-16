'use strict';

// Entire unmodified inline product script runs in the shared simulated-DOM VM.
// All boundary scenes below are synthetic fixtures, not natural-gameplay evidence.
// No save/load/import/export, native browser, timing, pathfinding or win-rate claim.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {loadGame} = require('./vm-environment.cjs');
const FROZEN_SOURCE_HASH = '5d8e0f32d62179704ac98c14ab9229ba4725a5080c1379200ce35b99dd765e2d';
const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
// Only the negative-control driver supplies this explicit exact mutant digest.
// There is no unrestricted bypass: every run verifies its actual source bytes.
const expectedHash = process.argv[3] || FROZEN_SOURCE_HASH;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const html = fs.readFileSync(source, 'utf8');
const sourceHashBefore = hash(html);
const tests = [];
let assertions = 0;
function check(stage, invariant, fn) {
  try { fn(); assertions++; }
  catch (error) { error.stage=stage; error.invariant=invariant; throw error; }
}
function eq(stage, invariant, actual, expected) { check(stage,invariant,()=>assert.equal(actual,expected)); }
function test(name, fn) {
  try { fn(); tests.push({name,passed:true}); }
  catch (error) { tests.push({name,passed:false,failure:{stage:error.stage||null,invariant:error.invariant||null,code:error.code||null},error:error.stack}); }
}
function fresh() {
  const g=loadGame(source,{seed:267}).start();
  g.run(`globalThis.miner=get(5);globalThis.refinery=get(3);globalThis.owner=get(6);
    miner.x=600;miner.y=400;miner.load=180;miner.manual=0;miner.returnCargo=false;
    selection=new Set([miner.id]);updateUI()`);
  return g;
}
function world(g) {
  return g.run(`JSON.stringify({state,uid,groups,simulationRemainder,
    navigation:state.entities.map(e=>[e.id,navigationMemory.get(e)||null]),
    deliveries:state.entities.map(e=>[e.id,harvesterDeliveries.get(e)||null]),
    movement:state.entities.map(e=>[e.id,movementIntent.has(e),goalMovementIntent.has(e)])})`)+JSON.stringify([...g.storage]);
}
function input(g) {
  return g.run(`JSON.stringify({selection:[...selection],placement,attackMode,drag,
    ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,
    selectionClickCandidate,lastSelectionClick,doubleClickSelection,
    ordinary:ordinaryCommandActivation,append:appendCommandActivation,factory:factoryExitActivation})`);
}
function inputWithoutSelection(g) {
  const data=JSON.parse(input(g));delete data.selection;
  return JSON.stringify(data);
}
function view(g) {
  return g.run('JSON.stringify({WIDTH,HEIGHT,mouse,hoverActive,coordinateAidEnabled,coordinateMouseBaseline})')+
    JSON.stringify({mapStyle:g.element('map').style,mapWidth:g.element('map').getAttribute('width'),mapHeight:g.element('map').getAttribute('height')});
}
function identities(g) { return {state:g.state,entities:[...g.state.entities],navigation:g.run('navigationMemory'),deliveries:g.run('harvesterDeliveries')}; }
function invariantWorld(g,before,stage,refs) {
  eq(stage,'world_unchanged',world(g),before);
  if(refs) {
    eq(stage,'state_identity_unchanged',g.state,refs.state);
    eq(stage,'entity_identities_unchanged',g.state.entities.every((e,i)=>e===refs.entities[i])&&g.state.entities.length===refs.entities.length,true);
    eq(stage,'navigation_map_identity_unchanged',g.run('navigationMemory'),refs.navigation);
    eq(stage,'delivery_map_identity_unchanged',g.run('harvesterDeliveries'),refs.deliveries);
  }
}
function visible(g,expected,stage='after_render') {
  eq(stage,'row_visible',g.element('deliveryRefineryRow')?.hidden===false,expected);
  eq(stage,'button_enabled',g.element('selectDeliveryRefinery')?.disabled===false,expected);
}
function selected(g,id,stage='after_click') { eq(stage,'current_refinery_selected',g.run('JSON.stringify([...selection])'),JSON.stringify([id])); }
function expectSelectionOnly(g,id,act=()=>g.click('selectDeliveryRefinery')) {
  const before=world(g),refs=identities(g),beforeView=view(g),focus=g.document.activeElement;
  act();
  invariantWorld(g,before,'after_click',refs);
  selected(g,id);
  eq('after_click','view_unchanged',view(g),beforeView);
  eq('after_click','focus_unchanged',g.document.activeElement,focus);
  visible(g,false,'after_click');
}
function expectBlocked(g,act=()=>g.click('selectDeliveryRefinery')) {
  const before=world(g),beforeInput=input(g);
  act();
  eq('after_stale_click','selection_and_input_unchanged',input(g),beforeInput);
  invariantWorld(g,before,'after_stale_click');
  g.run('updateUI()');visible(g,false);
}

// Freeze assertions are separate from behavior: they cannot make a mutant count
// as detected, and the driver checks the exact expected post-action assertion.
test('strict_source_hash',()=>{
  eq('source_gate','expected_hash_well_formed',/^[a-f0-9]{64}$/.test(expectedHash),true);
  eq('source_gate','exact_source_hash',sourceHashBefore,expectedHash);
});
test('hidden_row_has_scoped_css_and_honest_tooltip',()=>{
  eq('static_markup','scoped_hidden_css_present',/#deliveryRefineryRow\[hidden\]\s*\{\s*display\s*:\s*none\s*;?\s*\}/.test(html),true);
  const g=fresh(),title=g.element('selectDeliveryRefinery')?.getAttribute('title')||'';
  for(const term of ['当前','最近','已完工','己方','重新判断','不是绑定任务','不保证道路可达','仅选择','不移动视角'])
    eq('static_markup','tooltip_'+term,title.includes(term),true);
});
test('full_load_returning_exposes_current_identity',()=>{
  const g=fresh();visible(g,true);
  eq('after_render','work_phase',g.run('harvesterWorkState(miner,harvesterWorkContext())'),'returning');
  eq('after_render','label_current_identity',g.element('selectDeliveryRefinery').textContent,'选择当前交矿精炼厂 · #3（290,640）');
  eq('after_render','helper_current_target',g.run('selectedDeliveryRefinery()'),g.run('refinery'));
  expectSelectionOnly(g,3);
});
for(const [name,setup,phase] of [
  ['full_load_delivery','miner.x=refinery.x+83.5;miner.y=refinery.y','delivery'],
  ['exact_delivery_boundary','miner.x=refinery.x+miner.r+refinery.r+35;miner.y=refinery.y','returning'],
  ['partial_forced_return','miner.load=35;miner.returnCargo=true','returning'],
  ['partial_forced_delivery','miner.load=35;miner.returnCargo=true;miner.x=refinery.x+50;miner.y=refinery.y','delivery'],
  ['partial_global_ore_exhaustion','miner.load=35;state.ores.forEach(o=>o.amount=0)','returning'],
  ['partial_no_ore_entries','miner.load=35;state.ores=[]','returning'],
  ['over_capacity_return','miner.load=181','returning']
])test(name+'_selects_current_refinery',()=>{
  const g=fresh();g.run(setup+';updateUI()');
  eq('after_render','work_phase',g.run('harvesterWorkState(miner,harvesterWorkContext())'),phase);
  visible(g,true);expectSelectionOnly(g,3);
});
for(const [name,setup,phase] of [
  ['gathering','miner.load=50;miner.x=state.ores[0].x;miner.y=state.ores[0].y','gathering'],
  ['assigned_travel','miner.load=50;miner.oreIndex=0','assignedTravel'],
  ['automatic_travel','miner.load=50;miner.oreIndex=null','autoTravel'],
  ['empty_forced_return','miner.load=0;miner.returnCargo=true','autoTravel'],
  ['partial_without_forced_return','miner.load=179;miner.returnCargo=false','autoTravel'],
  ['assigned_ore_only_exhausted','miner.load=50;miner.oreIndex=0;state.ores[0].amount=0','autoTravel'],
  ['empty_global_exhaustion','miner.load=0;state.ores.forEach(o=>o.amount=0)','exhausted'],
  ['manual_move_override','miner.manual=2;miner.goal={x:800,y:400}','manualMove'],
  ['manual_end_override','miner.manual=2;miner.goal=null','manualEnd'],
  ['unfinished_miner','miner.build=1','construction'],
  ['no_refinery','state.entities=state.entities.filter(e=>e.type!=="refinery"||e.team!==0)','noRefinery']
])test(name+'_hides_and_rejects_stale_action',()=>{
  const g=fresh();g.run(setup);
  eq('fixture','work_phase',g.run('harvesterWorkState(miner,harvesterWorkContext())'),phase);
  expectBlocked(g);
});
for(const [name,setup] of [
  ['empty_selection','selection.clear()'],
  ['multiple_miners','globalThis.second=create("harvester",0,610,400);second.load=180;selection.add(second.id)'],
  ['mixed_selection','selection.add(owner.id)'],
  ['ghost_additional_selection','selection.add(99999)'],
  ['missing_selected_id','selection=new Set([99999])'],
  ['enemy_miner','miner.team=1'],
  ['dead_miner','miner.hp=0'],
  ['removed_miner','state.entities=state.entities.filter(e=>e!==miner)'],
  ['building_selection','selection=new Set([refinery.id])'],
  ['combat_selection','selection=new Set([owner.id])'],
  ['repair_selection','globalThis.repair=create("repair",0,620,400);selection=new Set([repair.id])'],
  ['dead_refinery','refinery.hp=0'],
  ['enemy_refinery','refinery.team=1'],
  ['unfinished_refinery','refinery.build=1'],
  ['removed_refinery','state.entities=state.entities.filter(e=>e!==refinery)']
])test(name+'_revalidated_at_click',()=>{
  const g=fresh();g.run(setup);expectBlocked(g);
  eq('after_render','generic_disabled_label',g.element('selectDeliveryRefinery').textContent,'选择当前交矿精炼厂');
});
for(const [name,setup] of [
  ['dead','near.hp=0'],['enemy','near.team=1'],['unfinished','near.build=1']
])test(name+'_nearer_refinery_is_excluded',()=>{
  const g=fresh();g.run('globalThis.near=create("refinery",0,620,400);'+setup+';updateUI()');
  visible(g,true);expectSelectionOnly(g,3);
});
test('nearest_refinery_beats_first_array_entry',()=>{
  const g=fresh();g.run('globalThis.near=create("refinery",0,700,400);updateUI()');
  const id=g.run('near.id');
  eq('after_render','label_current_nearest',g.element('selectDeliveryRefinery').textContent,`选择当前交矿精炼厂 · #${id}（700,400）`);
  expectSelectionOnly(g,id);
});
test('nearest_equal_distance_tie_uses_simulation_array_order',()=>{
  const g=fresh();g.run('refinery.x=500;refinery.y=400;globalThis.near=create("refinery",0,700,400);updateUI()');
  expectSelectionOnly(g,3);
  g.run('selection=new Set([miner.id]);state.entities=state.entities.filter(e=>e!==near);state.entities.unshift(near);updateUI()');
  expectSelectionOnly(g,g.run('near.id'));
});
test('label_uses_current_rounded_coordinates',()=>{
  const g=fresh();g.run('refinery.x=290.49;refinery.y=640.5;updateUI()');
  eq('after_render','rounded_coordinates',g.element('selectDeliveryRefinery').textContent,'选择当前交矿精炼厂 · #3（290,641）');
  g.run('refinery.x=312.51;refinery.y=630.49;updateUI()');
  eq('after_second_render','current_coordinates',g.element('selectDeliveryRefinery').textContent,'选择当前交矿精炼厂 · #3（313,630）');
  expectSelectionOnly(g,3);
});
test('new_nearer_refinery_between_render_and_click_revalidated',()=>{
  const g=fresh();g.run('globalThis.near=create("refinery",0,700,400)');
  eq('before_click','old_label_retained',g.element('selectDeliveryRefinery').textContent,'选择当前交矿精炼厂 · #3（290,640）');
  expectSelectionOnly(g,g.run('near.id'));
});
test('destroyed_rendered_refinery_falls_back_to_live_current_one',()=>{
  const g=fresh();g.run('globalThis.far=create("refinery",0,100,100);updateUI();refinery.hp=0');
  expectSelectionOnly(g,g.run('far.id'));
});
test('unfinished_refinery_completed_between_render_and_click',()=>{
  const g=fresh();g.run('globalThis.near=create("refinery",0,700,400,true);updateUI();near.build=0');
  expectSelectionOnly(g,g.run('near.id'));
});
test('refinery_ownership_change_uses_friendly_fallback',()=>{
  const g=fresh();g.run('globalThis.far=create("refinery",0,100,100);updateUI();refinery.team=1');
  expectSelectionOnly(g,g.run('far.id'));
});
test('miner_position_change_recomputes_current_nearest',()=>{
  const g=fresh();g.run('globalThis.far=create("refinery",0,100,100);updateUI();miner.x=150;miner.y=150');
  expectSelectionOnly(g,g.run('far.id'));
});
test('selection_change_to_other_returning_miner_uses_new_owner',()=>{
  const g=fresh();g.run('globalThis.far=create("refinery",0,100,100);globalThis.second=create("harvester",0,150,150);second.load=180;selection=new Set([second.id])');
  expectSelectionOnly(g,g.run('far.id'));
});
test('phase_change_to_empty_between_render_and_click_rejected',()=>{
  const g=fresh();g.run('miner.load=0');expectBlocked(g);
});
test('phase_change_to_manual_between_render_and_click_rejected',()=>{
  const g=fresh();g.run('miner.manual=1;miner.goal={x:800,y:300}');expectBlocked(g);
});
for(const [name,setup] of [['unstarted','state.started=false'],['restart_prompt','restartPrompt=true'],['terminal','state.result="胜利"']])
  test(name+'_blocks_direct_action',()=>{
    const g=fresh();g.run(setup);expectBlocked(g,()=>g.run('selectDeliveryRefinery()'));
  });
test('pause_allows_selection_without_advancing_time',()=>{
  const g=fresh();g.click('pause');eq('fixture','paused',g.state.paused,true);visible(g,true);expectSelectionOnly(g,3);
});
test('restart_cancel_restores_availability',()=>{
  const g=fresh();g.click('restart');visible(g,false);expectBlocked(g,()=>g.run('selectDeliveryRefinery()'));
  g.click('cancelRestart');visible(g,true);expectSelectionOnly(g,3);
});
test('terminal_lifecycle_hides_and_blocks',()=>{
  const g=fresh();g.run('finish(true,"hq");updateUI()');visible(g,false);expectBlocked(g,()=>g.run('selectDeliveryRefinery()'));
});
test('new_battle_does_not_reuse_prior_destination',()=>{
  const g=fresh(),oldMiner=g.run('miner'),oldRef=g.run('refinery');g.click('restart');g.click('start');
  eq('after_start','battle_entities_replaced',g.run('get(5)')!==oldMiner&&g.run('get(3)')!==oldRef,true);
  visible(g,false);expectBlocked(g,()=>g.run('selectDeliveryRefinery()'));
  g.run('selection=new Set([5]);updateUI()');visible(g,false);expectBlocked(g,()=>g.run('selectDeliveryRefinery()'));
  g.run('get(5).load=180;updateUI()');visible(g,true);expectSelectionOnly(g,3);
});
test('repeated_render_and_helper_queries_are_world_input_rng_readonly',()=>{
  const g=fresh();g.run('navigationMemory.set(miner,{fixture:true});harvesterDeliveries.set(miner,{fixture:true});movementIntent.add(miner);goalMovementIntent.add(miner)');
  const before=world(g),beforeInput=input(g),beforeView=view(g),refs=identities(g);
  g.run('Math.random=()=>{throw Error("unexpected random draw")};for(let i=0;i<20;i++){selectedDeliveryRefinery();updateDeliveryRefinerySelection();updateUI()}');
  invariantWorld(g,before,'after_render',refs);
  eq('after_render','input_unchanged',input(g),beforeInput);eq('after_render','view_unchanged',view(g),beforeView);
});
test('selection_only_preserves_all_commands_cargo_economy_and_world',()=>{
  const g=fresh();g.run(`miner.goal={x:800,y:400};miner.target=14;miner.oreIndex=2;
    miner.moveQueue=[{x:810,y:410}];miner.attackQueue=[{x:820,y:420}];miner.returnCargo=true;
    groups=[[5,6],[7],[]];state.queue=[{type:'tank',left:6,total:6,factoryId:4}];
    state.stats.harvested[0]=789;state.cash=1234;state.enemyCash=567;
    navigationMemory.set(miner,{fixture:true});harvesterDeliveries.set(miner,{fixture:true});
    movementIntent.add(miner);goalMovementIntent.add(miner);updateUI();
    Math.random=()=>{throw Error('unexpected random draw')}`);
  expectSelectionOnly(g,3);
});
test('repeated_clicks_cannot_issue_or_bind_commands',()=>{
  const g=fresh();expectSelectionOnly(g,3);
  const before=world(g),beforeInput=input(g);g.run('Math.random=()=>{throw Error("unexpected random draw")};for(let i=0;i<20;i++)selectDeliveryRefinery()');
  invariantWorld(g,before,'after_repeated_clicks');eq('after_repeated_clicks','input_unchanged',input(g),beforeInput);
});
function preparePending(g,kind,feature) {
  // Synthetic selection transition allows pending combat append state to coexist
  // with a returning miner; this does not claim normal UI permits that transition.
  g.run('owner.escortId=miner.id;selection=new Set([owner.id]);updateUI()');
  if(kind==='ordinary'||kind==='ordinary_pointer_gesture'||kind==='ordinary_activation') {
    const b=g.element('ordinaryCommand');b.dispatchEvent({type:'pointerdown',pointerId:41,button:0,isPrimary:true});
    if(kind!=='ordinary_activation') {b.dispatchEvent({type:'pointerup',pointerId:41,button:0,isPrimary:true});g.click('ordinaryCommand');}
  } else if(kind==='append'||kind==='append_activation') {
    const b=g.element('appendCommand');b.dispatchEvent({type:'keydown',key:'Enter',repeat:false});
    if(kind==='append') {g.click('appendCommand');b.dispatchEvent({type:'keyup',key:'Enter'});}
  } else if(kind==='attack') g.click('attack');
  else if(kind==='placement') g.document.querySelectorAll('[data-build]').find(b=>b.dataset.build==='power').click();
  else if(kind==='drag') g.run('drag={x:100,y:100,pointerId:11};selectionClickCandidate={pointerId:11};lastSelectionClick=2;doubleClickSelection=true');
  if(feature)g.run('selection=new Set([miner.id]);updateUI()');
  if(kind==='ordinary_pointer_gesture') g.element('map').dispatchEvent({type:'pointerdown',pointerId:51,button:0,isPrimary:true,clientX:500,clientY:500});
  g.run(`$('ordinaryCommandPreviewText').textContent='fixture preview';canvas.setAttribute('aria-describedby','ordinaryCommandPreviewText')`);
}
for(const kind of ['ordinary','append','ordinary_activation','append_activation','ordinary_pointer_gesture','attack','placement','drag'])
  test('pending_'+kind+'_clearing_matches_existing_selection_action',()=>{
    const g=fresh(),control=fresh();preparePending(g,kind,true);preparePending(control,kind,false);
    const before=world(g),controlBefore=world(control);
    g.click('selectDeliveryRefinery');control.click('selectEscortTarget');
    selected(g,3);selected(control,5);
    invariantWorld(g,before,'after_click');invariantWorld(control,controlBefore,'after_control_click');
    eq('after_click','pending_input_matches_existing_selection',inputWithoutSelection(g),inputWithoutSelection(control));
    eq('after_click','pending_modes_cleared',g.run('!placement&&!attackMode&&!drag&&!ordinaryCommandMode&&!appendCommandMode&&!ordinaryCommandGesture&&!selectionClickCandidate&&lastSelectionClick===0&&!doubleClickSelection'),true);
    eq('after_click','preview_cleared',g.element('ordinaryCommandPreviewText').textContent,'');
    eq('after_click','preview_accessibility_reference_cleared',g.element('map').getAttribute('aria-describedby'),null);
    if(kind.includes('ordinary'))eq('after_click','ordinary_token_canceled',g.run('ordinaryCommandActivation.canceled'),true);
    if(kind.includes('append'))eq('after_click','append_token_canceled',g.run('appendCommandActivation.canceled'),true);
  });
test('invalid_stale_click_preserves_pending_input',()=>{
  const g=fresh();preparePending(g,'ordinary_pointer_gesture',true);g.run('miner.manual=1;miner.goal={x:800,y:400}');
  expectBlocked(g);
});
test('enter_repeat_prevents_accidental_reactivation',()=>{
  const g=fresh();let prevented=false;
  const before=world(g),beforeInput=input(g);
  g.element('selectDeliveryRefinery').dispatchEvent({type:'keydown',key:'Enter',repeat:true,preventDefault(){prevented=true}});
  eq('after_keydown','enter_repeat_prevented',prevented,true);invariantWorld(g,before,'after_keydown');eq('after_keydown','input_unchanged',input(g),beforeInput);
});
test('composing_enter_is_not_intercepted',()=>{
  const g=fresh();for(const extra of [{isComposing:true},{keyCode:229}]) {
    let prevented=false;g.element('selectDeliveryRefinery').dispatchEvent({type:'keydown',key:'Enter',repeat:true,...extra,preventDefault(){prevented=true}});
    eq('after_keydown','composition_not_intercepted',prevented,false);
  }
});
test('source_bytes_unchanged_after_all_cases',()=>eq('final_gate','source_unchanged',hash(fs.readFileSync(source)),sourceHashBefore));
const report={suite:'delivery-refinery-selection',total:tests.length,passed:tests.filter(t=>t.passed).length,failed:tests.filter(t=>!t.passed).length,assertions,
  frozenSourceHash:FROZEN_SOURCE_HASH,expectedHash,sourceHashBefore,sourceHashAfter:hash(fs.readFileSync(source)),tests,
  scope:'Full-source Node VM with simulated DOM; all fixtures synthetic. Scoped hidden CSS checked statically only. No native layout/keyboard fidelity, navigation reachability, save/load/import/export, natural gameplay or win-rate claim.'};
console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
