'use strict';
// Text contract and explicitly synthetic command fixtures. No native tooltip,
// browser, persistence, natural battle or new gameplay implementation claim.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {loadGame}=require('./vm-environment.cjs');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html'));
const frozenHash='f66ba2568cabc8c5a8645558bb15e8b337ebaf23e3641af18f54464cf53f205a';
const expectedHash=process.argv[3]||frozenHash;
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const html=fs.readFileSync(source,'utf8'),results=[];
let assertions=0;
function check(stage,invariant,fn){try{fn();assertions++}catch(e){e.stage=stage;e.invariant=invariant;throw e}}
function eq(stage,invariant,a,b){check(stage,invariant,()=>assert.equal(a,b))}
function test(name,fn){try{fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,failure:{stage:e.stage||null,invariant:e.invariant||null,code:e.code||null},error:e.stack})}}
function game(){const g=loadGame(source).start();g.run('globalThis.u=get(6);selection=new Set([6]);issueMapCommand({x:get(13).x,y:get(13).y});appendAttackQueue(get(15));appendAttackQueue(get(17));updateUI()');return g}
const queue=g=>g.run('JSON.stringify(u.attackQueue)');
const world=g=>g.run('JSON.stringify({state,uid,groups,selection:[...selection],placement,attackMode,ordinaryCommandMode,appendCommandMode,simulationRemainder})');
test('source identity',()=>eq('setup','exact_source_digest',hash(html),expectedHash));
test('tooltip describes valid pending target and conditional cleanup',()=>{
 const match=html.match(/<button id="undoAttackTail" disabled title="([^"]+)"/);
 check('setup','undo_button_exists',()=>assert.ok(match));
 eq('text','tooltip_contract',match[1],'对所选战斗车各撤销最后一个后续攻击目标或地面路点；保留当前任务，仅剩一项不可撤。攻击只撤最后一个有效待攻击目标，成功撤销时清理失效编号。抵达坚守将在缩短后的路线末点生效。暂停可用。');
});
test('sidebar help describes valid pending target and conditional cleanup',()=>{
 const match=html.match(/“撤销队尾”[^<]+/);
 check('setup','sidebar_help_exists',()=>assert.ok(match));
 eq('text','sidebar_contract',match[0],'“撤销队尾”对所选车辆各撤销最后一个有效待攻击目标或后续地面路点，成功撤销攻击项时清理失效编号；保留当前任务，仅剩一项不可撤。抵达坚守随路线缩短到新末点。暂停可操作，无新增快捷键');
});
test('both obsolete invalid-tail claims are absent',()=>{
 eq('text','obsolete_tooltip_absent',html.includes('攻击失效尾项仍算一项'),false);
 eq('text','obsolete_help_absent',html.includes('攻击失效项也计入'),false);
});
test('entire executable script is byte-identical to v267',()=>{
 const current=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 eq('setup','frozen_reference_source',hash(current),frozenHash);
 const baseline=require('./restore-v267.cjs')(current),script=x=>x.match(/<script>([\s\S]*?)<\/script>/)[1];
 eq('source','executable_script_unchanged',script(html),script(baseline));
});
test('successful undo prunes invalid IDs and removes last live pending target',()=>{
 const g=game();g.run('get(17).hp=0;updateUI()');
 eq('setup','two_live_targets',g.run('JSON.stringify(attackQueueTargets(u).map(e=>e.id))'),'[13,15]');
 eq('setup','raw_dead_tail_retained_until_action',queue(g),'[13,15,17]');
 g.click('undoAttackTail');
 eq('action','last_live_pending_removed',queue(g),'[13]');
 eq('action','actual_current_preserved',g.run('u.target'),13);
});
test('one surviving target cannot undo or silently clean invalid IDs',()=>{
 const g=game();g.run('get(15).hp=0;get(17).hp=0;updateUI()');
 eq('setup','one_live_target',g.run('JSON.stringify(attackQueueTargets(u).map(e=>e.id))'),'[13]');
 eq('setup','disabled_without_future',g.element('undoAttackTail').disabled,true);
 const before=world(g);g.run('undoQueuedTail()');
 eq('action','no_success_no_cleanup',world(g),before);
 eq('action','invalid_ids_unchanged_without_success',queue(g),'[13,15,17]');
});
test('actual current target at raw tail remains protected',()=>{
 const g=game();g.run('u.target=17;updateUI()');g.click('undoAttackTail');
 eq('action','actual_tail_target_preserved',g.run('u.target'),17);
 eq('action','last_pending_not_current_removed',queue(g),'[13,17]');
});
test('ground route undo preserves active goal and arrival hold',()=>{
 const g=game();g.run('issueMapCommand({x:450,y:540});issueMapCommand({x:450,y:650},false,true);toggleArrivalHold();globalThis.savedGoal=u.goal;updateUI()');g.click('undoAttackTail');
 eq('action','ground_future_removed',g.run('u.moveQueue.length'),1);
 eq('action','ground_goal_identity_preserved',g.run('u.goal===savedGoal'),true);
 eq('action','arrival_hold_preserved',g.run('u.holdOnArrival'),true);
});
console.log(JSON.stringify({passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,assertions,results,scope:'Static text/executable-byte checks plus synthetic whole-source VM fixtures. No native tooltip, browser or persistence operations.'},null,2));
if(results.some(x=>!x.passed))process.exitCode=1;
