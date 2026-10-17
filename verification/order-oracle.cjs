'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html'));
const {loadGame}=require(path.join(path.dirname(source),'verification/vm-environment.cjs'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sourceHash=hash(fs.readFileSync(source));
const counts={correctness:0,pairing:0,negativeControls:0};
function check(test,message){assert.ok(test,message);counts.correctness++}
function equal(a,b,message){assert.deepEqual(a,b,message);counts.correctness++}
const plain=x=>JSON.parse(JSON.stringify(x));
let pointer=0;
// One pointer identity must survive press and release.
function button(g,id){const e=g.element(id);check(e&&!e.disabled,'UI button enabled '+id);const pointerId=++pointer;for(const type of ['pointerdown','pointerup'])e.dispatchEvent({type,pointerId,isPrimary:true,button:0});e.click()}
function map(g,x,y){const pointerId=++pointer;for(const type of ['pointerdown','pointerup'])g.element('map').dispatchEvent({type,pointerId,pointerType:'mouse',isPrimary:true,button:0,clientX:x,clientY:y})}
function field(g,id,value,event='input'){const e=g.element(id);check(e&&!e.disabled,'UI field enabled '+id);e.value=String(value);e.dispatchEvent({type:event})}
function start(){const g=loadGame(source,{seed:43801});for(const[id,value]of [['scenario','classic'],['difficulty','normal'],['objective','annihilation'],['challenge','standard']])field(g,id,value,'change');button(g,'start');map(g,320,540);equal(plain(g.run('[...selection]')),[6],'real map selects only tank 6');return g}
const a=start(),b=start();equal(a.state.mapChoice,'classic','fixed classic terrain scenario');equal(plain(a.run('terrainObstacles()')),[],'classic oracle has no unmodeled rocks');
const unit=g=>plain(g.state.entities.find(e=>e.id===6));
const world=g=>g.run('JSON.stringify({state,uid,selection:[...selection],groups,simulationRemainder,navigation:state.entities.map(e=>[e.id,navigationMemory.get(e)]),traffic:trafficCoordination.status(),deliveries:state.entities.map(e=>[e.id,harvesterDeliveries.get(e)])})');
const blockers=plain(a.state.entities.filter(e=>['hq','power','refinery','factory','turret'].includes(e.type)));
const initialEntities=plain(a.state.entities);
const checkpoints=[];
function noOtherOrders(u){equal(u.escortId,null,'no escort task');check(!u.patrol&&!u.guardArea&&!u.hold,'no competing patrol/guard/hold')}
function safeGoal(u,p){check(p&&Object.keys(p).sort().join(',')==='x,y'&&Number.isFinite(p.x)&&Number.isFinite(p.y),'finite point shape');check(p.x>=u.r&&p.x<=1200-u.r&&p.y>=u.r&&p.y<=800-u.r,'point inside map for unit radius');for(const wall of blockers)check(Math.hypot(p.x-wall.x,p.y-wall.y)>=u.r+wall.r+3-1e-8,'point clears physical building '+wall.id)}
function ground(u,attack){safeGoal(u,u.goal);equal(u.target,null,'ground command has no entity target');equal(u.attackMove,attack,'correct ordinary versus attack movement');check(!Object.hasOwn(u,'moveQueue'),'replacement clears prior ground route');check(!Object.hasOwn(u,'attackQueue'),'replacement clears attack queue');noOtherOrders(u)}
function appended(before,after){equal(after.goal,before.goal,'append preserves current goal');equal(after.target,null,'append retains no entity target');equal(after.attackMove,false,'append remains ordinary movement');const prefix=before.moveQueue||[before.goal];check(Array.isArray(after.moveQueue),'append creates explicit route');equal(after.moveQueue.length,prefix.length+1,'append adds exactly one waypoint');equal(after.moveQueue.slice(0,-1),prefix,'append preserves complete old prefix');safeGoal(after,after.moveQueue.at(-1));check(!Object.hasOwn(after,'attackQueue'),'ground append has no attack queue');noOtherOrders(after)}
function targeted(u,id){equal(u.target,id,'actual targeted enemy ID');equal(u.goal,null,'targeted attack has no ground goal');equal(u.attackMove,false,'ordinary target command is not attack-move');check(!Object.hasOwn(u,'moveQueue')&&!Object.hasOwn(u,'attackQueue'),'target replaces queued ground route');noOtherOrders(u)}
function targetAppend(before,after,id){equal(after.target,before.target,'attack append preserves current target');equal(after.attackQueue,[before.target,id],'attack queue retains target prefix and adds requested enemy');equal(after.goal,null,'attack queue has no ground goal');equal(after.attackMove,false,'target queue not attack-move');check(!Object.hasOwn(after,'moveQueue'),'target queue has no ground route');noOtherOrders(after)}
// Exact destination applies only to independently proven unadjusted sites in
// this single-unit, no-rock, no-time-advance classic scenario.
function destination(before,after,input){const p={x:input.x,y:input.y};safeGoal(before,p);check(p.x>=20&&p.x<=1180&&p.y>=20&&p.y<=780,'requested point needs no map clamp');for(const e of initialEntities)check(Math.hypot(p.x-e.x,p.y-e.y)>=e.r+9,'requested point cannot hit entity '+e.id);equal(input.kind==='append'?after.moveQueue.at(-1):after.goal,p,'unadjusted safe request destination applied');}
function command(name,kind,x,y,oracle){const before=unit(a);for(const g of[a,b]){field(g,'coordinateCommandX',x);field(g,'coordinateCommandY',y)}button(a,{ordinary:'coordinateCommandExecute',append:'coordinateAppendExecute',attack:'coordinateAttackExecute'}[kind]);button(b,{ordinary:'ordinaryCommand',append:'appendCommand',attack:'attack'}[kind]);map(b,x,y);const after=unit(a);check(a.element('mapCommandReceipt').textContent.includes('已接收'),'command actually accepted');oracle(before,after);equal(plain(a.run('[...selection]')),[6],'single unit has no formation offset');if(checkpoints.length<5)destination(before,after,{kind,x,y});equal(a.state.t,0,'no time advanced between order transitions');assert.equal(world(a),world(b),'separate legacy UI full-world pairing: '+name);counts.pairing++;checkpoints.push({name,input:{kind,x,y},before,after,worldSha256:hash(world(a)),receipt:a.element('mapCommandReceipt').textContent})}
command('ordinary safe ground','ordinary',450,540,(_,u)=>ground(u,false));
command('first ground append','append',500,600,appended);
command('second append preserves existing prefix','append',550,650,appended);
command('attack move replaces queued route','attack',650,550,(_,u)=>ground(u,true));
command('ordinary replaces attack move','ordinary',450,600,(_,u)=>ground(u,false));
command('enemy HQ replaces ground command','ordinary',1050,125,(_,u)=>targeted(u,9));
command('enemy factory append retains HQ','append',1100,250,(before,after)=>targetAppend(before,after,10));
const positiveCounts={...counts};
// Mutate detached JSON observations only, never game state or product source.
const negativeCases=[
 ['ordinary wrong but safe destination',0,(b,a)=>a.goal={x:750,y:600},(b,a)=>destination(b,a,checkpoints[0].input),'unadjusted safe request destination applied'],
 ['append wrong but safe tail',2,(b,a)=>a.moveQueue[a.moveQueue.length-1]={x:750,y:600},(b,a)=>destination(b,a,checkpoints[2].input),'unadjusted safe request destination applied'],
 ['ordinary wrongly attacks',0,(b,a)=>a.attackMove=true,(_,u)=>ground(u,false),'correct ordinary versus attack movement'],
 ['ordinary illegal goal',0,(b,a)=>a.goal={x:-1,y:0},(_,u)=>ground(u,false),'point inside map'],
 ['append replaces current goal',1,(b,a)=>a.goal={x:700,y:700},appended,'append preserves current goal'],
 ['append drops old route prefix',2,(b,a)=>a.moveQueue[0]={x:700,y:700},appended,'append preserves complete old prefix'],
 ['attack move keeps ordinary route',3,(b,a)=>a.moveQueue=[{x:450,y:540}],(_,u)=>ground(u,true),'replacement clears prior ground route'],
 ['HQ targets wrong enemy',5,(b,a)=>a.target=10,(_,u)=>targeted(u,9),'actual targeted enemy ID'],
 ['attack append replaces current target',6,(b,a)=>a.target=10,(b,a)=>targetAppend(b,a,10),'attack append preserves current target'],
 ['attack append loses prefix',6,(b,a)=>a.attackQueue=[10,9],(b,a)=>targetAppend(b,a,10),'attack queue retains target prefix']
];
const negatives=[];for(const[name,index,mutate,oracle,expected]of negativeCases){const {before,after}=plain(checkpoints[index]);mutate(before,after);assert.throws(()=>oracle(before,after),e=>e instanceof assert.AssertionError&&e.message.includes(expected),name);counts.negativeControls++;negatives.push({name,detected:true,expected})}
// Negative oracle invocations are not added to the positive correctness count.
counts.correctness=positiveCounts.correctness;
equal(hash(fs.readFileSync(source)),sourceHash,'product source unchanged');
console.log(JSON.stringify({passed:7,failed:0,seed:43801,map:'classic',sourceSha256:sourceHash,counts,checkpoints,negativeControls:negatives,scope:'Seven legal UI command transitions on one real selected tank, no simulation steps, no state injection, no browser or save/export. Independent structural and circle-clearance oracles; separate legacy-UI full-world pairing. Ten negative controls mutate detached observations only. Exact destination is checked only for these independently proven unclamped, entity-free, single-unit clear sites in classic with no terrain rocks; no claim for terrain-adjusted destinations.'},null,2));
