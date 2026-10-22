'use strict';
// Whole-document execution. No source hash is used as a semantic test oracle.
const assert=require('node:assert/strict');
const path=require('node:path');
const {loadGame}=require('../vm-environment.cjs');
const root=path.resolve(__dirname,'../..');
const currentDefault=path.join(root,'index.html');
const fs=require('node:fs'),os=require('node:os');
let generatedBaseline;
function baselineDefault(){if(!generatedBaseline){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-effects-baseline-'));generatedBaseline=path.join(dir,'index.html');fs.writeFileSync(generatedBaseline,require('../current-release/source.cjs').restore(fs.readFileSync(currentDefault,'utf8')));}return generatedBaseline;}
const json=x=>JSON.parse(JSON.stringify(x));
function game(source){const g=loadGame(source,{seed:83719}).start();g.run(`globalThis.__rngCalls=0;globalThis.__rngValues=[];globalThis.__originalRandom=Math.random;Math.random=()=>{__rngCalls++;let v=__originalRandom();__rngValues.push(v);return v};`);return g;}
function core(g){return g.run(`JSON.stringify({state:{...state,fx:undefined},selection:[...selection],groups,uid,selectedDeathUiDirty,rng:__rngValues})`);}
function pair(current,baseline){return [game(current),game(baseline)];}
function same(gs,label){assert.equal(core(gs[0]),core(gs[1]),label+' gameplay/RNG parity');const common=g=>json(g.state.fx).filter(f=>!['boom','spark','smoke','scorch'].includes(f.type));assert.deepEqual(common(gs[0]),common(gs[1]),label+' pre-existing non-destruction effect parity');}
function both(gs,code){for(const g of gs)g.run(code);}
function quiet(g){g.run(`state.entities=state.entities.filter(e=>e.type==='hq');state.posts=[];state.ores=[];state.queue=[];state.shots=[];state.fx=[];state.ai=-1e6;state.wave=-1e6;`);}
function runSuite({current=currentDefault,baseline,only}={}){
 baseline=baseline||baselineDefault();
 const results=[];
 const test=(name,fn)=>{if(only&&name!==only)return;try{const detail=fn();results.push({name,pass:true,...(detail?{detail}:{})});}catch(e){results.push({name,pass:false,error:e.message,stack:e.stack});}};
 test('hit-destruction-spawn',()=>{
  const g=game(current);quiet(g);
  g.run(`globalThis.victim=create('tank',1,600,400);impactShot({kind:'tank',team:0,damage:10},victim,new Set());`);
  assert.deepEqual(json(g.state.fx.map(f=>f.type)),['hit','spark','spark','spark','spark']);
  g.run(`state.fx=[];selection.add(victim.id);applyShotDamage(victim,10000,0,new Set());`);
  assert.deepEqual(json(g.state.fx.map(f=>f.type)),['boom',...Array(7).fill('spark'),...Array(3).fill('smoke'),'scorch']);
  assert.equal(g.state.fx.at(-1).t,30);assert.equal(g.run('selection.has(victim.id)'),false);assert.equal(g.run('selectedDeathUiDirty'),true);
  const count=g.state.fx.length;g.run('applyShotDamage(victim,10000,0,new Set())');assert.equal(g.state.fx.length,count);assert.equal(g.state.stats.kills[0],1);
  g.run(`state.fx=[];globalThis.building=create('factory',1,700,400);applyShotDamage(building,10000,0,new Set())`);
  assert.equal(g.state.fx.filter(f=>f.type==='spark').length,10);assert.equal(g.state.fx.filter(f=>f.type==='smoke').length,5);
  assert.equal(g.run('__rngCalls'),0,'effects/damage must not consume RNG');
  assert.ok(g.state.fx.every(f=>Object.values(f).filter(v=>typeof v==='number').every(Number.isFinite)));
 });
 test('actual-update-expiration',()=>{
  const g=game(current);quiet(g);g.run(`spawnDestructionEffects(state.entities[0]);`);
  const initial=g.state.fx.map(f=>f.t);g.run('update(.1)');g.state.fx.forEach((f,i)=>assert.ok(Math.abs(f.t-(initial[i]-.1))<1e-10));
  for(let i=0;i<40;i++)g.run('update(.1)');
  assert.deepEqual(json(g.state.fx.map(f=>f.type)),['scorch']);
  for(let i=0;i<270;i++)g.run('update(.1)');assert.equal(g.state.fx.length,0,'actual update expires scorch');
 });
 test('full-render-pure-and-branches',()=>{
  const g=game(current);quiet(g);
  g.run(`spawnDestructionEffects(state.entities[0]);spawnImpactSparks(600,400,20,1,4);for(let f of state.fx)f.t=f.max*.6;
   globalThis.__draw=[];globalThis.__phase='scene';globalThis.__oldEffect=drawBattleEffect;drawBattleEffect=function(f){__phase=f.type;try{return __oldEffect(f)}finally{__phase='scene'}};
   globalThis.__oldScars=drawBattleScars;drawBattleScars=function(){__phase='scars';try{return __oldScars()}finally{__phase='scene'}};
   for(let method of ['arc','ellipse','lineTo','fill','stroke','fillRect','fillText'])ctx[method]=function(...args){__draw.push({phase:__phase,method,args,fill:this.fillStyle,stroke:this.strokeStyle})};
   globalThis.__savedState=state;globalThis.__proxies=new WeakMap();globalThis.__readonly=function(v){if(!v||typeof v!=='object')return v;if(__proxies.has(v))return __proxies.get(v);let p=new Proxy(v,{get:(o,k)=>__readonly(o[k]),set(){throw Error('render wrote gameplay state')},deleteProperty(){throw Error('render deleted gameplay state')},defineProperty(){throw Error('render defined gameplay state')}});__proxies.set(v,p);return p};state=__readonly(state);`);
  const before=core(g);g.run('render();render()');assert.equal(core(g),before,'render leaves state, selection and RNG unchanged');
  const calls=json(g.run('__draw'));
  assert.ok(calls.some(x=>x.phase==='scars'&&x.method==='ellipse'),'scorch layer rendered');
  assert.ok(calls.some(x=>x.phase==='spark'&&x.method==='stroke'&&x.stroke==='#ffe8ad'),'spark renderer branch');
  assert.ok(calls.some(x=>x.phase==='smoke'&&x.method==='fill'&&x.fill==='#303a37'),'smoke renderer branch');
  assert.ok(calls.some(x=>x.phase==='boom'&&x.method==='fill'&&x.fill==='#f46c29'),'boom renderer branch');
  assert.equal(g.run('__rngCalls'),0);g.run('state=__savedState');
 });
 test('save-load-reset-transient',()=>{
  const g=game(current);g.run(`spawnDestructionEffects(state.entities.find(e=>e.type==='tank'));globalThis.receipt=saveGame()`);
  assert.ok(g.run('receipt'),'real save succeeds');const data=json(g.run('receipt.payload'));
  assert.deepEqual(data.state.fx,[],'saved snapshot must not persist effects');
  assert.ok(g.state.fx.length>0,'save does not clear live effects');
  // Inject a valid legacy cosmetic effect so clearing is tested, not merely loading an empty array.
  const key=g.run('receipt.key');data.state.fx=[{type:'boom',x:100,y:100,t:.4,max:.6}];g.storage.set(key,JSON.stringify(data));
  assert.equal(g.run(`validSave(JSON.parse(localStorage.getItem(saveKey())))`),true);
  g.run('loadGame()');assert.equal(g.state.paused,true);assert.deepEqual(json(g.state.fx),[],'load clears saved and live effects');
  g.run('spawnDestructionEffects(state.entities[0]);reset()');assert.deepEqual(json(g.state.fx),[],'reset clears effects');
 });
 test('damage-splash-kills-selection-economy-rng-parity',()=>{
  const gs=pair(current,baseline);for(const g of gs)quiet(g);
  both(gs,`globalThis.scout=create('scout',1,600,400);globalThis.building=create('factory',1,700,400);globalThis.tank=create('tank',1,720,400);globalThis.friend=create('tank',0,710,400);globalThis.edge=create('tank',1,750,400);selection.add(scout.id);`);
  same(gs,'setup');both(gs,`impactShot({kind:'tank',team:0,damage:10},scout,new Set())`);same(gs,'tank/scout multiplier');
  assert.equal(gs[0].run('scout.max-scout.hp'),12);
  both(gs,`impactShot({kind:'artillery',team:0,damage:20},building,new Set())`);same(gs,'artillery/building multiplier and splash');
  assert.equal(gs[0].run('building.max-building.hp'),25);assert.ok(gs[0].run('tank.hp<tank.max'));assert.equal(gs[0].run('friend.hp===friend.max && edge.hp===edge.max'),true);
  both(gs,`applyShotDamage(scout,10000,0,new Set());applyShotDamage(scout,10000,0,new Set());update(.05)`);same(gs,'death removal and single kill');
  assert.equal(gs[0].run('state.entities.some(e=>e.id===scout.id)'),false);assert.equal(gs[0].run('selection.has(scout.id)'),false);
  // Run ordinary economy/AI/production instead of stubbing those systems.
  const normal=pair(current,baseline);both(normal,`buy('tank')`);same(normal,'purchase');
  for(let i=0;i<120;i++){both(normal,'update(.1)');if(i%20===0)same(normal,'economy tick '+i);}same(normal,'economy final');
  assert.ok(normal[0].state.stats.spent[0]>0);assert.ok(normal[0].state.stats.harvested[0]>0);
 });
 test('full-mission-battle-trajectories-and-save-parity',()=>{
  const details=[];
  for(const [map,objective,difficulty] of [['classic','annihilation','normal'],['meridian','control','hard'],['switchback','survival','easy']]){
   const gs=pair(current,baseline);
   both(gs,`$('scenario').value='${map}';$('objective').value='${objective}';$('difficulty').value='${difficulty}';reset();state.started=true;buy('tank');buy('scout');selection.clear();for(let e of state.entities)if(e.team===0&&e.type==='tank')selection.add(e.id);issue({x:600,y:400},true);`);
   same(gs,map+' real attack command');
   const seen=new Set(gs[0].state.fx.map(f=>f.type));
   // Local skirmish exercises actual targeting, fire, projectile travel and repair.
   both(gs,`for(let i=0;i<3;i++){let a=create('tank',0,480,310+i*40),b=create('tank',1,640,310+i*40);a.target=b.id;b.target=a.id;a.hold=true;b.hold=true;}let service=create('repair',0,470,355);let damaged=state.entities.find(e=>e.team===0&&e.type==='tank'&&e.x===480);damaged.hp-=70;`);
   for(let tick=0;tick<600;tick++){
    both(gs,'advanceSimulation(.1)');
    for(const f of gs[0].state.fx)seen.add(f.type);
    same(gs,map+' simulation tick '+tick);
    if(tick%50===0){for(const g of gs){const before=core(g);g.run('render()');assert.equal(core(g),before,map+' render purity');}}
   }
   assert.ok(gs[0].state.stats.kills.reduce((a,b)=>a+b,0)>0,map+' real combat occurred');
   assert.ok(seen.has('order')&&seen.has('repair')&&seen.has('cash'),map+' existing order/repair/cash feedback exercised');
   both(gs,'globalThis.missionSave=saveGame()');
   assert.ok(gs[0].run('missionSave')&&gs[1].run('missionSave'),map+' real mission saves succeed');
   const payload=g=>g.run(`JSON.stringify({...missionSave.payload,savedAt:undefined})`);
   assert.equal(payload(gs[0]),payload(gs[1]),map+' exact saved gameplay fields (timestamp excluded only)');
   both(gs,'loadGame()');same(gs,map+' load state');
   details.push({map,objective,difficulty,seconds:60,steps:600,effectsSeen:[...seen],kills:json(gs[0].state.stats.kills)});
  }return details;
 });
 test('projectile-victory-and-terminal-parity',()=>{
  const outcomes=[];
  for(const teams of [[1],[0],[0,1]]){
   const gs=pair(current,baseline);for(const g of gs)quiet(g);
   both(gs,`for(let e of state.entities){e.hp=1;if(${JSON.stringify(teams)}.includes(e.team))state.shots.push({x:e.x,y:e.y,to:e.id,damage:10,team:1-e.team,kind:'tank',life:2})}update(.05)`);
   same(gs,'HQ projectile outcome '+teams);assert.ok(gs[0].state.result);assert.equal(gs[0].state.shots.length,0);
   const snapshot=core(gs[0]);both(gs,'update(1)');assert.equal(core(gs[0]),snapshot,'terminal simulation freeze');same(gs,'terminal');outcomes.push(gs[0].state.result);
  }return {outcomes};
 });
 test('shared-cap-pressure-explicit-accounting',()=>{
  const gs=pair(current,baseline);for(const g of gs)quiet(g);
  both(gs,`for(let type of ['order','repair','cash']){let life={order:.6,repair:.3,cash:1}[type];pushEffect({type,x:10,y:10,x2:20,y2:20,amount:7,t:life,max:life})}for(let i=0;i<24;i++){let victim=create('tank',1,400+(i%6)*50,300+Math.floor(i/6)*50);victim.hp=1;state.shots.push({x:victim.x,y:victim.y,to:victim.id,damage:10,team:0,kind:'tank',life:2})}update(.05)`);
  assert.equal(core(gs[0]),core(gs[1]),'cap pressure cannot alter gameplay/RNG');assert.equal(gs[0].state.stats.kills[0],24);assert.equal(gs[0].state.shots.length,0);
  const retained=g=>json(g.state.fx.filter(f=>['order','repair','cash'].includes(f.type)).map(f=>f.type));
  // Decoration must not evict live semantic feedback; this is a product acceptance assertion.
  assert.deepEqual(retained(gs[0]),['order','repair','cash']);assert.deepEqual(retained(gs[1]),['order','repair','cash']);assert.equal(gs[0].state.fx.length,256);
  return {projectileKillsInOneUpdate:24,currentEffectCount:gs[0].state.fx.length,baselineEffectCount:gs[1].state.fx.length,currentRetainedFeedback:retained(gs[0]),baselineRetainedFeedback:retained(gs[1]),classification:'Live order/repair/cash feedback retained under decorative pressure with the 256-slot cap. Core state and RNG match historical v318 in this fixture; no broader nonvisual equivalence is asserted.'};
 });
 return {pass:results.every(r=>r.pass),current,baseline,source:'full index.html via verification/vm-environment.cjs; no baseline substitution',results};
}
module.exports={runSuite,currentDefault,baselineDefault};
if(require.main===module){const report=runSuite({current:process.argv[2]||currentDefault,baseline:process.argv[3]});console.log(JSON.stringify(report,null,2));process.exitCode=report.pass?0:1;}
