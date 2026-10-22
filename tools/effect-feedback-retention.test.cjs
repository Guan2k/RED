'use strict';
// Current whole-index VM tests. No HTML/script rewrite, no historical-suite coverage claim.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {test}=require('node:test');
const {loadGame}=require('../verification/vm-environment.cjs');
const root=path.join(__dirname,'..'),source=path.join(root,'index.html');
const game=(file=source)=>loadGame(file,{seed:29419}).start();
const plain=x=>JSON.parse(JSON.stringify(x));
const critical=['order','repair','cash','flash','boom','hit','blast','future-feedback'];
const decorative=['spark','smoke','scorch'];
function quiet(g){g.run(`state.entities=state.entities.filter(e=>e.type==='hq');state.shots=[];state.fx=[];state.ai=10000;state.wave=10000;`);return g;}
function burst(g){g.run(`for(let i=0;i<24;i++){let e=create('tank',1,450+(i%6)*50,250+Math.floor(i/6)*50);e.hp=1;e.cool=100;e.hold=true;state.shots.push({x:e.x,y:e.y,to:e.id,damage:999,team:0,kind:'tank',life:2})}update(.001)`);}
function markers(g){g.run(`globalThis.markers=['order','repair','cash'].map(type=>({type,x:500,y:500,x2:510,y2:510,amount:180,t:1,max:1}));for(let f of markers)pushEffect(f)`);}
function retained(g){assert.equal(g.run('markers.every(f=>state.fx.includes(f))'),true,'pre-existing marker object identities survive 24 simultaneous kills');assert.equal(g.run('markers.every(f=>f.t===.999)'),true,'markers age by .001 rather than being evicted');}
const core=g=>g.run(`JSON.stringify({state:{...state,fx:[]},uid,groups,selection:[...selection],placement,attackMode,simulationRemainder,durable:durableBattleSignature()})`);

test('whole-index: 24 lethal projectiles retain existing order/repair/cash objects and explosions',()=>{
 const g=quiet(game());markers(g);burst(g);retained(g);
 assert.equal(g.state.stats.kills[0],24);assert.equal(g.state.fx.length,256);
 for(const type of ['boom','hit','spark','smoke','scorch'])assert.ok(g.state.fx.some(f=>f.type===type),type);
});
test('same whole-index regression oracle rejects old all-FIFO implementation',()=>{
 const html=fs.readFileSync(source,'utf8'),start=html.indexOf('function decorativeEffect('),end=html.indexOf('// Cosmetic-only battlefield effects:',start);
 assert.ok(start>0&&end>start);const old="function pushEffect(effect){if(effect.type==='order')state.fx=state.fx.filter(e=>e.type!=='order');state.fx.push(effect);if(state.fx.length>MAX_EFFECTS)state.fx.splice(0,state.fx.length-MAX_EFFECTS)}\n";
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-old-fifo-'));try{const file=path.join(dir,'index.html');fs.writeFileSync(file,html.slice(0,start)+old+html.slice(end));const g=quiet(game(file));markers(g);burst(g);assert.equal(g.state.stats.kills[0],24);assert.throws(()=>retained(g),/pre-existing marker object identities/);}finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('all known and unknown semantic types survive every decorative kind at capacity',()=>{
 const g=quiet(game());g.context.kinds=critical;g.context.decorations=decorative;
 assert.equal(g.run(`state.fx=Array.from({length:256},(_,i)=>({type:kinds[i%kinds.length],i,t:1,max:1}));globalThis.original=state.fx.slice();for(let type of decorations)for(let i=0;i<300;i++)pushEffect({type,i,t:3,max:3});state.fx.length===256&&state.fx.every((f,i)=>f===original[i])`),true);
});
test('mixed capacity removes oldest decoration, preserving feedback identities and relative order',()=>{
 const g=quiet(game());assert.equal(g.run(`state.fx=Array.from({length:256},(_,i)=>({type:i===7||i===200?'spark':'cash',i,t:1,max:1}));globalThis.original=state.fx.slice();let newest={type:'repair',t:1,max:1};pushEffect(newest);state.fx.length===256&&state.fx.at(-1)===newest&&state.fx.slice(0,-1).every((f,i)=>f===original[i<7?i:i+1])`),true);
});
test('critical-only overload remains bounded FIFO, never an unbounded reserve',()=>{
 const g=quiet(game());assert.equal(g.run(`state.fx=[];globalThis.all=Array.from({length:600},(_,i)=>({type:'cash',i,t:1,max:1}));for(let f of all)pushEffect(f);state.fx.length===256&&state.fx.every((f,i)=>f===all[i+344])`),true);
});
test('order replacement stays unique and does not evict another feedback at a full queue',()=>{
 const g=quiet(game());assert.equal(g.run(`state.fx=Array.from({length:256},(_,i)=>({type:i===128?'order':'repair',i,t:1,max:1}));globalThis.original=state.fx.filter(f=>f.type!=='order');globalThis.newOrder={type:'order',t:.6,max:.6};pushEffect(newOrder);state.fx.length===256&&state.fx.at(-1)===newOrder&&state.fx.slice(0,-1).every((f,i)=>f===original[i])`),true);
});
test('below capacity all kinds retain insertion order, data and identity',()=>{
 const g=quiet(game());g.context.kinds=critical.concat(decorative);assert.equal(g.run(`globalThis.all=kinds.map((type,i)=>({type,i,t:1,max:1}));for(let f of all)pushEffect(f);state.fx.every((f,i)=>f===all[i])`),true);
});
test('overlapping repeated bursts stay bounded and retain live semantic objects',()=>{
 const g=quiet(game());markers(g);for(let i=0;i<4;i++){burst(g);assert.equal(g.state.fx.length,256);assert.equal(g.run('markers.every(f=>state.fx.includes(f))'),true);}assert.equal(g.state.stats.kills[0],96);
});
test('actual update naturally expires retained feedback and all transient effects',()=>{
 const g=quiet(game());markers(g);burst(g);g.run('update(.998)');assert.equal(g.run('markers.every(f=>state.fx.includes(f))'),true);g.run('update(.002)');assert.equal(g.run('markers.every(f=>!state.fx.includes(f))'),true);g.run('update(30)');assert.equal(g.state.fx.length,0);
});
test('full render visits retained semantic feedback and effects without mutating simulation',()=>{
 const g=quiet(game());markers(g);burst(g);const before=core(g);g.run(`globalThis.drawn=[];globalThis.originalDraw=drawBattleEffect;drawBattleEffect=function(f){drawn.push(f);return originalDraw(f)};render()`);assert.equal(g.run('markers.every(f=>drawn.includes(f))'),true);assert.equal(core(g),before);
});
test('actual save/load excludes transient effects and preserves durable state',()=>{
 const g=game();g.run('refreshPostStates()');markers(g);g.run(`spawnDestructionEffects({id:900,type:'tank',r:17,x:600,y:400});globalThis.receipt=saveGame()`);assert.ok(g.run('receipt'));assert.deepEqual(plain(g.run('receipt.payload.state.fx')),[]);const signature=g.run('durableBattleSignature()');g.run('loadGame()');assert.equal(g.state.fx.length,0);assert.equal(g.run('durableBattleSignature()'),signature);
});

const BASE_SHA='75511392c7383c5e5e234b3ea45e8795859e6a799198cb8acbe030d2cb651c36';
function referenceHtml(){
 const html=fs.readFileSync(source,'utf8'),start=html.indexOf('function decorativeEffect('),end=html.indexOf('function spawnImpactSparks(',start);
 assert.ok(start>0&&end>start);
 const old="function pushEffect(effect){if(effect.type==='order')state.fx=state.fx.filter(e=>e.type!=='order');state.fx.push(effect);if(state.fx.length>MAX_EFFECTS)state.fx.splice(0,state.fx.length-MAX_EFFECTS)}\n// Cosmetic-only battlefield effects: fixed-angle sparks never consume the gameplay RNG.\n// The existing MAX_EFFECTS bound and fx lifetime update also bound all new particles.\n";
 const restored=html.slice(0,start)+old+html.slice(end);
 assert.equal(require('node:crypto').createHash('sha256').update(restored).digest('hex'),BASE_SHA,'inverse approved queue-only edit recovers exact c2d501a whole HTML');
 return restored;
}
function withReference(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-retention-reference-'));try{const file=path.join(dir,'index.html');fs.writeFileSync(file,referenceHtml());return fn(file);}finally{fs.rmSync(dir,{recursive:true,force:true})}}
test('strict inverse diff binds all markup, CSS, rendering and other gameplay to c2d501a',()=>referenceHtml());
test('24-kill damage/economy/entity/command/save signature and RNG match unmodified current main',()=>withReference(file=>{
 const a=quiet(game(file)),b=quiet(game());markers(a);markers(b);burst(a);burst(b);
 assert.equal(core(b),core(a));assert.equal(b.run('Math.random()'),a.run('Math.random()'));
}));
for(const [map,objective] of [['classic','annihilation'],['meridian','stronghold'],['frontier','harvest']])test(`600-step actual current paired trajectory: ${map}/${objective}`,()=>withReference(file=>{
 const a=game(file),b=game();for(const g of [a,b]){g.element('scenario').value=map;g.element('objective').value=objective;g.run(`reset();state.started=true;$('overlay').classList.add('hidden');selection=new Set(state.entities.filter(e=>e.team===0&&e.type==='tank').map(e=>e.id));controlGroup(0,true);issueMapCommand({x:650,y:400});globalThis.trajectory=[];for(let i=0;i<600;i++){update(.1);trajectory.push(JSON.stringify({state:{...state,fx:[]},uid,groups,selection:[...selection]}))}`)}
 assert.deepEqual(plain(b.run('trajectory')),plain(a.run('trajectory')));assert.equal(core(b),core(a));assert.equal(b.run('Math.random()'),a.run('Math.random()'));
}));
test('semantic oracles reject damage, economy and RNG side effects in queue insertion',()=>withReference(file=>{
 for(const [name,mutation] of [['economy','state.cash+=1;'],['damage','if(state.entities[0])state.entities[0].hp-=1;'],['rng','Math.random();']]){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-retention-negative-'));try{
   const html=fs.readFileSync(source,'utf8').replace('function pushEffect(effect){','function pushEffect(effect){'+mutation),mutant=path.join(dir,'index.html');fs.writeFileSync(mutant,html);
   const a=quiet(game(file)),b=quiet(game(mutant));markers(a);markers(b);burst(a);burst(b);
   if(name==='rng')assert.notEqual(b.run('Math.random()'),a.run('Math.random()'),name+' behavior oracle');else assert.notEqual(core(b),core(a),name+' behavior oracle');
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
 }
}));
test('priority oracle rejects wrongly classifying cash as decoration',()=>{
 const html=fs.readFileSync(source,'utf8').replace("return effect.type==='spark'||", "return effect.type==='cash'||effect.type==='spark'||");
 assert.notEqual(html,fs.readFileSync(source,'utf8'));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-retention-priority-negative-'));try{
  const file=path.join(dir,'index.html');fs.writeFileSync(file,html);const g=quiet(game(file));markers(g);burst(g);
  assert.throws(()=>retained(g),/pre-existing marker object identities/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
