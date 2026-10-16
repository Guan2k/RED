'use strict';
// UI-driven legal paid-production regression matrix; shared simulated DOM harness, no gameplay injection.
const fs=require('node:fs'),path=require('node:path'),{loadGame}=require('./vm-environment.cjs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const hash = () => crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const sourceHashBefore = hash();
const tests = [];
const clone = value => JSON.parse(JSON.stringify(value));
const near = (a,b,message) => assert.ok(Math.abs(a-b)<1e-7, `${message}: ${a} versus ${b}`);
const observe = g => ({t:g.state.t,cash:g.state.cash,income:g.state.stats.income[0],spent:g.state.stats.spent[0],produced:g.state.stats.produced[0],paused:g.state.paused,queue:clone(g.state.queue),global:g.run('repeatProductionType()'),factories:clone(g.run("structures(0,'factory').map(e=>({id:e.id,build:e.build,repeat:factoryRepeatType(e)}))"))});
const finance = g => ({cash:g.state.cash,income:g.state.stats.income[0],spent:g.state.stats.spent[0]});
function ledger(g, before, label) { assert.equal(g.state.cash, before.cash + (g.state.stats.income[0]-before.income) - (g.state.stats.spent[0]-before.spent), label); }
function invariantEqual(actual,expected,stage,invariant){try{assert.equal(actual,expected,invariant)}catch(error){error.stage=stage;error.invariant=invariant;throw error}}
function test(name, run) { try { tests.push({name,passed:true,...run()}); } catch(error) { tests.push({name,passed:false,error:error.stack,failure:{stage:error.stage??null,invariant:error.invariant??null,code:error.code??null,actual:error.actual,expected:error.expected}}); } }
function fresh() { const g=loadGame(source,{seed:263}).start(); assert.equal(g.state.cash,1700);assert.equal(g.state.queue.length,0);assert.equal(g.state.stats.spent[0],0);return g; }
let pointerId=0;
function mapClick(g,x,y) { const base={pointerId:++pointerId,pointerType:'mouse',button:0,isPrimary:true,clientX:x,clientY:y};const map=g.element('map');map.dispatchEvent({type:'pointerdown',...base});map.dispatchEvent({type:'pointerup',...base});map.dispatchEvent({type:'click',detail:1,...base}); }
function selectFactory(g,id) { const e=g.state.entities.find(e=>e.id===id);assert.ok(e&&e.team===0&&e.type==='factory');mapClick(g,e.x,e.y);assert.deepEqual(clone(g.run('[...selection]')),[id]); }
function change(g,id,value) { const e=g.element(id);assert.ok(e&&!e.disabled,`${id} must be enabled`);e.value=String(value);e.dispatchEvent({type:'change'}); }
function configure(g,mode,type,factoryId=4) { if(mode==='local'){selectFactory(g,factoryId);change(g,'factoryRepeat',type);}else change(g,'repeatProduction',type); }
function buyUnit(g,type) { const button=g.elements.find(e=>e.dataset.unit===type);assert.ok(button&&!button.disabled);button.click(); }
function rowButton(g,q) { const row=[...g.run('productionOrderRows.values()')].find(row=>row.q===q);assert.ok(row&&row.live&&row.wrapper.parentNode===g.element('productionOrders'),'live order row');assert.equal(row.node.disabled,false);return row.node; }
function exactCancel(g,q) { const before=finance(g),remaining=clone(q),refund=Math.floor(({scout:180,tank:350})[q.type]*Math.max(0,Math.min(1,q.left/q.total))+1e-8),button=rowButton(g,q);button.click();assert.ok(!g.state.queue.includes(q));invariantEqual(g.state.cash,before.cash+refund,'after_cancel','refund_cash');assert.equal(g.state.stats.spent[0],before.spent-refund);assert.equal(g.state.stats.income[0],before.income);const after=observe(g);button.click();assert.deepEqual(observe(g),after,'repeated activation refunds only once');return {refund,remaining}; }
function initialPaid(g,mode) { const before=finance(g);configure(g,mode,'scout');assert.deepEqual(finance(g),before);assert.equal(g.state.queue.length,0);g.step(.05);assert.equal(g.state.queue.length,1);const q=g.state.queue[0];assert.equal(q.type,'scout');assert.equal(q.total,4);assert.equal(q.factoryId,4);assert.equal(g.state.cash,1520);assert.equal(g.state.stats.spent[0],180);if(mode==='global')assert.equal(q.repeatOrder,true);else assert.equal(q.factoryRepeatSource,4);g.step(.5);near(q.left,4-8/15,'paid scout progress after .55 seconds');assert.equal(g.state.cash,1520);return q; }
function assertNextMode(g,expected,stage='mode_observation') { invariantEqual(g.run('repeatProductionType()'),expected.global,stage,'global_mode');invariantEqual(g.run('factoryRepeatType(get(4))'),expected.local,stage,'local_mode'); }
const transitions=[
 {name:'global_to_local',from:'global',to:'local',type:'tank',cancel:{global:'off',local:'tank'}},
 {name:'local_to_global',from:'local',to:'global',type:'tank',cancel:{global:'tank',local:'off'}},
 {name:'global_retype',from:'global',to:'global',type:'tank',cancel:{global:'off',local:'off'}},
 {name:'local_retype',from:'local',to:'local',type:'tank',cancel:{global:'off',local:'tank'}},
 {name:'global_off',from:'global',to:'global',type:'off',cancel:{global:'off',local:'off'}},
 {name:'local_off',from:'local',to:'local',type:'off',cancel:{global:'off',local:'off'}},
 {name:'global_same_type',from:'global',to:'global',type:'scout',cancel:{global:'off',local:'off'}},
 {name:'local_same_type',from:'local',to:'local',type:'scout',cancel:{global:'off',local:'off'}}
];
for(const spec of transitions)for(const outcome of ['cancel','complete'])test(`${spec.name}_${outcome}`,()=>{
 const g=fresh(),q=initialPaid(g,spec.from),before=observe(g),original=clone(q);
 configure(g,spec.to,spec.type);const changed=observe(g);
 assert.equal(g.state.queue.length,1);assert.equal(g.state.queue[0],q);
 for(const key of ['type','left','total','factoryId'])assert.equal(q[key],original[key],`mode change preserves ${key}`);
 assert.deepEqual(finance(g),{cash:before.cash,income:before.income,spent:before.spent});
 if(spec.from==='global')assert.equal(q.repeatOrder,true,'global provenance remains associated by documented contract');
 else if(spec.to==='local'&&spec.type==='scout')assert.equal(q.factoryRepeatSource,4,'same local type retains source');
 else invariantEqual(q.factoryRepeatSource,undefined,'after_mode_change','local_source_detached');
 const configured={global:spec.to==='global'?spec.type:'off',local:spec.to==='local'?spec.type:'off'};assertNextMode(g,configured);
 let result;
 if(outcome==='cancel'){
  result=exactCancel(g,q);assert.equal(result.refund,156);assertNextMode(g,spec.cancel,'after_cancel');
  const beforeStep=finance(g);g.step(.05);const expectedType=spec.cancel.global!=='off'?spec.cancel.global:spec.cancel.local;
  if(expectedType==='off'){assert.equal(g.state.queue.length,0);assert.deepEqual(finance(g),beforeStep);}
  else{assert.equal(g.state.queue.length,1);assert.equal(g.state.queue[0].type,expectedType);assert.equal(g.state.stats.spent[0]-beforeStep.spent,expectedType==='scout'?180:350);ledger(g,beforeStep,'one replacement charged exactly once');if(spec.cancel.local!=='off')assert.equal(g.state.queue[0].factoryRepeatSource,4);else assert.equal(g.state.queue[0].repeatOrder,true);}
 }else{
  const beforeStep=finance(g),startLeft=q.left;g.step(startLeft+.1);assert.ok(!g.state.queue.includes(q),'old paid order completes naturally');assert.equal(g.state.stats.produced[0],1,'one old scout actually produced');assert.equal(g.state.entities.filter(e=>e.team===0&&e.type==='scout').length,2);assertNextMode(g,configured);
  if(spec.type==='off'){assert.equal(g.state.queue.length,0);assert.equal(g.state.stats.spent[0],beforeStep.spent);}
  else{assert.equal(g.state.queue.length,1);assert.equal(g.state.queue[0].type,spec.type);assert.equal(g.state.stats.spent[0]-beforeStep.spent,spec.type==='scout'?180:350);if(spec.to==='local')assert.equal(g.state.queue[0].factoryRepeatSource,4);else assert.equal(g.state.queue[0].repeatOrder,true);}
  ledger(g,beforeStep,'completion and one follow-on paid order conserve the ledger');result={completed:'scout',replacement:spec.type};
 }
 return{before,changed,result,after:observe(g)};
});
for(const mode of ['global','local'])test(`${mode}_off_then_reenable_cancellation_provenance`,()=>{
 const g=fresh(),q=initialPaid(g,mode),before=clone(q);configure(g,mode,'off');configure(g,mode,'scout');for(const key of ['left','total','type','factoryId'])assert.equal(q[key],before[key]);const result=exactCancel(g,q);
 assertNextMode(g,mode==='global'?{global:'off',local:'off'}:{global:'off',local:'scout'});g.step(.05);assert.equal(g.state.queue.length,mode==='global'?0:1);if(mode==='local')assert.equal(g.state.queue[0].factoryRepeatSource,4);return{result,after:observe(g)};
});
for(const mode of ['global','local'])test(`${mode}_manual_order_cancel_preserves_repeat`,()=>{
 const g=fresh(),q=initialPaid(g,mode),auto=clone(q),before=finance(g);buyUnit(g,'tank');const manual=g.state.queue[1];assert.equal(manual.type,'tank');assert.equal(manual.repeatOrder,undefined);assert.equal(manual.factoryRepeatSource,undefined);assert.equal(g.state.cash,before.cash-350);assert.equal(g.state.stats.spent[0],before.spent+350);const result=exactCancel(g,manual);assert.equal(result.refund,350);assert.deepEqual(finance(g),before);assert.equal(g.state.queue.length,1);assert.equal(g.state.queue[0],q);assert.deepEqual(clone(q),auto);assertNextMode(g,mode==='global'?{global:'scout',local:'off'}:{global:'off',local:'scout'});g.step(.05);assert.ok(q.left<auto.left);return{result,after:observe(g)};
});
for(const mode of ['global','local'])test(`${mode}_paused_change_cancel_manual_and_resume`,()=>{
 const g=fresh(),q=initialPaid(g,mode);g.click('pause');assert.equal(g.state.paused,true);const frozen=observe(g);g.step(2);assert.deepEqual(observe(g),frozen,'pause freezes production, time, and cash');configure(g,mode,'tank');const changed=observe(g);g.step(1);assert.deepEqual(observe(g),changed,'changing repeat while paused does not auto-buy');const result=exactCancel(g,q);const beforeManual=finance(g);buyUnit(g,'scout');assert.equal(g.state.queue.length,1);const manual=g.state.queue[0];assert.equal(manual.left,4);g.step(1);assert.equal(manual.left,4);assert.equal(exactCancel(g,manual).refund,180);assert.deepEqual(finance(g),beforeManual);assert.equal(g.state.queue.length,0);g.step(.5);assert.equal(g.state.queue.length,0);g.click('pause');g.step(.05);assert.equal(g.state.paused,false);assert.equal(g.state.queue.length,mode==='local'?1:0);if(mode==='local'){assert.equal(g.state.queue[0].type,'tank');assert.equal(g.state.queue[0].factoryRepeatSource,4);}return{frozen,result,after:observe(g)};
});
for(const mode of ['global','local'])for(const wasPaused of [false,true])test(`${mode}_restart_return_${wasPaused?'paused':'running'}`,()=>{
 const g=fresh(),q=initialPaid(g,mode);if(wasPaused)g.click('pause');const before=observe(g),oldOrder=clone(q);g.click('restart');assert.equal(g.state.paused,true);assert.equal(g.run('restartPrompt'),true);assert.equal(g.element('repeatProduction').disabled,true);selectNoChange();
 function selectNoChange(){const factoryRepeat=g.element('factoryRepeat');assert.equal(factoryRepeat.disabled,true);const unit=g.elements.find(e=>e.dataset.unit==='tank');assert.equal(unit.disabled,true);assert.equal(g.element('salvage').disabled,true);assert.equal([...g.run('productionOrderRows.values()')].find(row=>row.q===q).node.disabled,true);}
 g.step(2);const menu=observe(g);assert.deepEqual({...menu,paused:wasPaused},before,'restart menu freezes model');g.click('cancelRestart');assert.equal(g.run('restartPrompt'),false);assert.equal(g.state.paused,wasPaused);assert.deepEqual(observe(g),before,'return restores exact paid order and mode');assert.deepEqual(clone(q),oldOrder);g.step(.05);if(wasPaused)assert.deepEqual(observe(g),before);else assert.ok(q.left<oldOrder.left);return{before,after:observe(g)};
});
for(const mode of ['global','local'])test(`${mode}_restart_confirm_resets_paid_state`,()=>{
 const g=fresh(),q=initialPaid(g,mode),oldState=g.state,oldButton=rowButton(g,q);g.click('restart');g.click('start');assert.notEqual(g.state,oldState);assert.equal(g.state.t,0);assert.equal(g.state.cash,1700);assert.equal(g.state.stats.spent[0],0);assert.equal(g.state.stats.income[0],0);assert.equal(g.state.stats.produced[0],0);assert.equal(g.state.queue.length,0);assert.equal(g.state.paused,false);assertNextMode(g,{global:'off',local:'off'});const reset=observe(g);oldButton.click();assert.deepEqual(observe(g),reset,'old order activation cannot refund into new battle');g.step(.05);assert.equal(g.state.queue.length,0);assert.equal(g.state.cash,1700);return{after:observe(g)};
});
function build(g,type,x,y){const before=finance(g),ids=new Set(g.state.entities.map(e=>e.id)),button=g.elements.find(e=>e.dataset.build===type);assert.ok(button&&!button.disabled);assert.equal(g.run(`canPlace('${type}',{x:${x},y:${y}})`),true);button.click();mapClick(g,x,y);const placed=g.state.entities.find(e=>!ids.has(e.id)&&e.type===type&&e.team===0);assert.ok(placed,'natural construction exists');const cost=g.run(`defs['${type}'].cost`);assert.equal(g.state.cash,before.cash-cost);assert.equal(g.state.stats.spent[0],before.spent+cost);return placed.id;}
function salvage(g,id){selectFactory(g,id);const target=g.state.entities.find(e=>e.id===id),before=finance(g),quote=Math.floor(850*.5*Math.max(0,Math.min(1,target.hp/g.run("defs.factory.hp")))+1e-8),button=g.element('salvage');assert.equal(button.disabled,false);g.click('salvage');assert.ok(!g.state.entities.some(e=>e.id===id));assert.equal(g.state.cash,before.cash+quote);assert.equal(g.state.stats.income[0],before.income+quote);assert.equal(g.state.stats.spent[0],before.spent);return quote;}
for(const mode of ['global','local'])test(`${mode}_legal_factory_loss_reassign_cancel`,()=>{
 const g=fresh(),second=build(g,'factory',50,600);build(g,'power',50,520);g.step(12.1);assert.equal(g.run('powered()'),true);assert.equal(g.state.entities.filter(e=>e.team===0&&e.type==='factory'&&!e.build).length,2);configure(g,mode,'scout');g.step(.05);assert.equal(g.state.queue.length,1);const q=g.state.queue[0];assert.equal(q.factoryId,4);g.step(.5);const paid=observe(g),old=clone(q);configure(g,'local','tank',second);const changed=clone(q);assert.equal(changed.left,old.left);assert.equal(changed.total,old.total);assert.equal(changed.type,old.type);const salvageRefund=salvage(g,4);assert.equal(salvageRefund,425);assert.equal(q.factoryId,second);for(const key of ['left','total','type','factoryRepeatSource','repeatOrder'])assert.equal(q[key],old[key]);assert.equal(g.run(`factoryRepeatType(get(${second}))`),'tank');const reassigned=observe(g),result=exactCancel(g,q);assert.equal(result.refund,156);invariantEqual(g.run(`factoryRepeatType(get(${second}))`),'tank','after_cancel','replacement_factory_mode');const beforeStep=finance(g);g.step(.05);assert.equal(g.state.queue.length,1);assert.equal(g.state.queue[0].type,'tank');assert.equal(g.state.queue[0].factoryRepeatSource,second);assert.equal(g.state.queue[0].factoryId,second);assert.equal(g.state.cash,beforeStep.cash-350);assert.equal(g.state.stats.spent[0],beforeStep.spent+350);return{paid,reassigned,salvageRefund,result,after:observe(g)};
});
for(const mode of ['global','local'])test(`${mode}_last_factory_loss_preserves_unassigned_paid_order`,()=>{
 const g=fresh(),q=initialPaid(g,mode),old=clone(q),salvageRefund=salvage(g,4);assert.equal(q.factoryId,null);for(const key of ['left','total','type','factoryRepeatSource','repeatOrder'])assert.equal(q[key],old[key]);const beforeWait=observe(g);g.step(.5);assert.equal(g.state.queue.length,1);assert.equal(q.left,old.left);assert.equal(g.state.stats.spent[0],beforeWait.spent);const result=exactCancel(g,q);assert.equal(result.refund,156);g.step(.05);assert.equal(g.state.queue.length,0);return{salvageRefund,result,after:observe(g)};
});
const sourceHashAfter=hash();
assert.equal(sourceHashAfter,sourceHashBefore,'source file was not modified');
const report={passed:tests.filter(t=>t.passed).length,failed:tests.filter(t=>!t.passed).length,total:tests.length,source,sourceHashBefore,sourceHashAfter,scope:'Node VM/DOM model only. UI events drive natural paid production, mode changes, cancellation, pause/restart, legal construction and confirmed salvage. No save/import/export calls, browser use, publication, or gameplay-state injections. Browser interaction/layout fidelity is not asserted.',documentedContract:'CURRENT_PLAYER_GUIDE.md production-mode contract: global old-order cancellation stops current global repeat even after retyping; local source mode changes detach prior orders; all already-paid work is retained.',tests};
console.log(JSON.stringify(report,null,2));
if(report.failed)process.exitCode=1;
