'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const source=path.resolve(process.argv[2] || path.join(__dirname,'../index.html'));
const results=[],measurements=[];
const plain=value=>JSON.parse(JSON.stringify(value));
const {loadGame}=require('./vm-environment.cjs');
const sha=()=>crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),before=sha();
function run(seed,mode){
 const g=loadGame(source,{seed}),actions=[],trace=[],events=[];let selected,repairOrdered=false,artilleryOrdered=new Set();
 const note=(kind,extra={})=>actions.push({t:g.state.t,kind,...extra});
 if(mode==='preset'){g.click('quickSwitchback');}else{for(const[id,value]of Object.entries({scenario:'switchback',objective:'stronghold',difficulty:'hard',challenge:'mobile'})){g.element(id).value=value;g.element(id).dispatchEvent({type:'change'});}}
 g.element('gameSpeed').value='1';g.element('gameSpeed').dispatchEvent({type:'change'});g.start();
 assert.deepEqual(plain([g.state.mapChoice,g.state.objective,g.state.difficulty,g.state.challenge]),['switchback','stronghold','hard','mobile']);
 const clickMap=(x,y)=>{const b=g.element('map'),ev={pointerId:1,pointerType:'mouse',isPrimary:true,button:0,clientX:x,clientY:y};for(const type of ['pointerdown','pointerup','click'])b.dispatchEvent({type,detail:1,...ev});};
 const select=id=>{const e=g.state.entities.find(e=>e.id===id);if(!e)return false;clickMap(e.x,e.y);selected=Array.from(g.run('[...selection]'));assert.deepEqual(selected,[id]);return true;};
 const order=(x,y,hold=false)=>{for(const[id,v]of [['coordinateCommandX',x],['coordinateCommandY',y]]){g.element(id).value=String(v);g.element(id).dispatchEvent({type:'input'});}assert.equal(g.element('coordinateCommandExecute').disabled,false);g.click('coordinateCommandExecute');if(hold)g.click('holdOnArrival');note('move',{selected,x,y,hold,receipt:g.element('mapCommandReceipt').textContent});};
 const buy=type=>{const b=g.elements.find(e=>e.dataset.unit===type),cash=g.state.cash;b.click();note('buy',{type,before:cash,after:g.state.cash,queue:g.state.queue.map(q=>q.type)});};
 select(8);order(550,510,true);select(6);order(565,470,true);select(7);order(590,535,true);
 select(4);order(580,500);g.click('rallyHold');note('rallyHold');
 buy('artillery');buy('repair');buy('artillery');
 g.raf.shift()(1000);
 let firstCapture=null,lastOwner=-1,lastHarvest=0,lastProduced=0,lastProgress=0,lastContested=false,contestSeconds=0;
 for(let tick=0;tick<300*60&&!g.state.result;tick++){
  g.raf.shift()(1000+(tick+1)*1000/60);const s=g.state,p=s.posts[1],present=[0,0];for(const e of s.entities)if(['tank','scout','artillery'].includes(e.type)&&Math.hypot(e.x-p.x,e.y-p.y)<65)present[e.team]++;
  const contested=present[0]>0&&present[1]>0;if(contested)contestSeconds+=1/60;
  if(p.owner!==lastOwner){events.push({t:s.t,kind:'owner',from:lastOwner,to:p.owner,present});lastOwner=p.owner;if(p.owner===0&&firstCapture===null)firstCapture=s.t;}
  if(contested!==lastContested){events.push({t:s.t,kind:'contest',active:contested,progress:[...s.controlProgress],present});lastContested=contested;}
  if(s.controlProgress[0]<lastProgress-0.1)events.push({t:s.t,kind:'reset',from:lastProgress,to:s.controlProgress[0]});lastProgress=s.controlProgress[0];
  if(s.stats.harvested[0]!==lastHarvest){events.push({t:s.t,kind:'harvest',total:s.stats.harvested[0],cash:s.cash});lastHarvest=s.stats.harvested[0];}
  if(s.stats.produced[0]!==lastProduced){events.push({t:s.t,kind:'produced',total:s.stats.produced[0],types:s.entities.filter(e=>e.team===0&&e.id>18).map(e=>({id:e.id,type:e.type}))});lastProduced=s.stats.produced[0];}
  if(tick%60===59){
   if(!repairOrdered){const r=s.entities.find(e=>e.team===0&&e.type==='repair');if(r){select(r.id);order(545,510);repairOrdered=true;}}
   for(const a of s.entities.filter(e=>e.team===0&&e.type==='artillery'))if(!artilleryOrdered.has(a.id)){const index=artilleryOrdered.size;select(a.id);order(index===0?600:575,index===0?440:560,true);artilleryOrdered.add(a.id);}
   if(s.cash>=450&&s.queue.length<3&&!s.result)buy('tank');
  }
  if(tick%300===0||s.result)trace.push({t:s.t,cash:s.cash,progress:[...s.controlProgress],owner:p.owner,present,contested,stats:JSON.parse(JSON.stringify(s.stats)),entities:s.entities.map(e=>({id:e.id,type:e.type,team:e.team,x:e.x,y:e.y,hp:e.hp,hold:e.hold,goal:e.goal}))});
 }
 const out={seed,source,sha256:before,config:{scenario:g.state.mapChoice,objective:g.state.objective,difficulty:g.state.difficulty,challenge:g.state.challenge},result:g.state.result||'timeout',time:g.state.t,firstCapture,contestSeconds,progress:g.state.controlProgress,stats:g.state.stats,narrative:g.element('intro').textContent,actions,events,trace,scope:'Whole source VM; normal select/change/start, map pointer selection, coordinate commands, arrival hold/rally hold, paid production. Fixed1/60 simulation steps. Read-only observations. No state/resource/entity injection or game-function commands.'};out.finalState=plain(g.state);return plain(out);
}

// The retained v292 traces are read-only evidence. No report/storage writes occur.
// Compare the complete recorded traces, not only their winning result.
const historicalKeys=['seed','config','result','time','firstCapture','contestSeconds','progress','stats','narrative','actions','events','trace'];
const pick=value=>Object.fromEntries(historicalKeys.map(key=>[key,value[key]]));
let failed=0;
for(const seed of [29301,29302,29303]){
 try{
  const manual=run(seed,'manual'),preset=run(seed,'preset');
  const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'switchback-route-v293',`seed-${seed}.json`),'utf8'));
  assert.deepEqual(pick(preset),pick(manual),'preset/manual complete recorded trace parity');
  assert.deepEqual(preset.finalState,manual.finalState,'preset/manual complete final state parity');
  assert.deepEqual(pick(manual),pick(baseline),'current/manual retained v292 complete trace parity');
  assert.equal(preset.result,'胜利');assert.equal(preset.progress[0],90);
  assert.equal(preset.firstCapture,12.483333333333533);
  results.push({name:`switchback natural route seed ${seed}: preset, manual, and retained v292 trace parity`,passed:true});
  measurements.push({seed,result:preset.result,time:preset.time,firstCapture:preset.firstCapture,contestSeconds:preset.contestSeconds,progress:preset.progress,stats:preset.stats,traceSnapshots:preset.trace.length,actions:preset.actions.length,events:preset.events.length});
 }catch(error){failed++;results.push({name:`switchback natural route seed ${seed}: preset, manual, and retained v292 trace parity`,passed:false,error:error.message});}
}
try{assert.equal(sha(),before);}catch(error){failed++;results.push({name:'source remains unchanged',passed:false,error:error.message});}
console.log(JSON.stringify({passed:results.filter(r=>r.passed).length,failed,measurements,results,scope:'Whole-source natural UI route: actual preset button versus actual manual select changes and retained v292 action/event/world traces, for all three declared seeds. Normal queued RAF callbacks at fixed 1/60 timestamps; read-only state observations. No state/position/HP/resource/capture/timer injection, no command helper shortcuts, no save/load/import/export or explicit storage operations. Retained failures remain in switchback-route-v294; winning route is narrow, not a universal win-rate claim.'},null,2));
if(failed)process.exitCode=1;
