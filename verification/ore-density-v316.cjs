'use strict';
// v315 expected-side presentation adaptation; no candidate stream changes.
const {installExpectedPresentation,expectedFunctionSource}=require('./presentation-expected-v315.cjs');
'use strict';
const {installExpectedDepletedOreBeds}=require('./depleted-ore-expected-v315.cjs');
// Exact v315 renderer evidence; no raster/FPS claims and no product writes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {installExpectedOreLabels}=require('./low-ore-label-oracle-v315.cjs');
const {loadGame}=require('./visual-independent-v294/no-persistence-vm.cjs');
const {mockPath}=require('./building-recorder-v295.cjs'),{record}=require('./building-team-cue-v301-support/recorder.cjs');
const {oreViews,projectOreDensity,count}=require('./ore-density-normalization-v315.cjs');
const h=require('./render-preview-v316.cjs'),copy=x=>JSON.parse(JSON.stringify(x)),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const sourceFile=path.join(__dirname,'../index.html'),frozen=fs.readFileSync(sourceFile,'utf8'),historical=require('./restore-v301-from-v316.cjs')(frozen);
assert.equal(hash(historical),'75c75c7a25af246d366770809853f2fab440cd734c11d9fbe6acfe840a0efd39','strict historical v301 identity before expected-label adaptation');
const maps=['classic','frontier','canyon','ridge','crossroads','switchback','ring','meridian'];
const core=g=>g.run('JSON.stringify({state,uid,groups,selection:[...selection],placement,attackMode,drag,ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,restartPrompt,resumeAfterCancel,simulationRemainder,mouse,hoverActive,durable:durableBattleSignature()})');
function checkPair(sourceText,setup,{preview=false,caching=true,map='classic',frames=2}={}){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-density-v315-'));
 try{
  const games=[historical,sourceText].map((s,i)=>{const file=path.join(tmp,i+'.html');fs.writeFileSync(file,s);const g=loadGame(file,{seed:30219,path2D:caching?mockPath().P:undefined});if(i===0){installExpectedOreLabels(g);installExpectedDepletedOreBeds(g);installExpectedPresentation(g);}g.element('scenario').value=map;g.start();g.run(setup);h.toggle(g,preview);return g});
  const rs=games.map(g=>record(g)),[old,now]=games;assert.equal(core(now),core(old),'ore density initial world equality');
  const labels=g=>g.run('JSON.stringify(oreLabelLayout().map(({ore,...v})=>v))');assert.equal(labels(now),labels(old),'ore density layout labels positions and order');
  let omitted=0,baselineCalls=0,candidateCalls=0;
  for(let n=0;n<frames;n++){
   const before=games.map(core),views=oreViews(old);rs.forEach(r=>r.reset());
   for(const g of games)g.run('globalThis.__oreTestRandom=Math.random;Math.random=()=>{throw Error("ore density render consumed RNG")};try{render()}finally{Math.random=__oreTestRandom;delete globalThis.__oreTestRandom}');
   games.forEach((g,i)=>assert.equal(core(g),before[i],'ore density world unchanged'));
   const projected=projectOreDensity(rs[0].paints,views,{events:rs[0].events});
   assert.deepEqual(rs[1].paints,projected.paints,'ore density complete paints retain exact base/label/position/color/style/order');
   assert.deepEqual(rs[1].events,projected.events,'ore density complete Canvas methods retain exact remaining order');
   assert.equal(rs[0].calls-rs[1].calls,views.reduce((n,o)=>n+8-count(o.amount),0),'ore density exact method reduction');
   assert.deepEqual(rs[1].current,rs[0].current,'ore density current path unchanged');
   assert.deepEqual(rs[1].snapshot(),rs[0].snapshot(),'ore density full canvas context unchanged');
   rs.forEach(r=>assert.equal(r.stack.length,0,'ore density balanced context'));
   assert.equal(h.tracks(now),h.tracks(old),'ore density track-memory parity');
   omitted=projected.removedPaints;baselineCalls=rs[0].calls;candidateCalls=rs[1].calls;
  }
  const rng=g=>g.run('JSON.stringify([Math.random(),Math.random(),Math.random()])');assert.equal(rng(now),rng(old),'ore density RNG position');
  return {omitted,baselineCalls,candidateCalls,frames,preview,caching,map};
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
}
function projectionControls(){
 const results=[];
 for(const format of ['commands','world'])for(const amount of [.001,999.999,1000,1500,4500]){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-density-project-'));
  try{
   const file=path.join(tmp,'old.html');fs.writeFileSync(file,historical);
   const g=format==='commands'?loadGame(file,{path2D:mockPath().P}):h.game(historical,{expectedLabels:true});if(format==='commands')installExpectedOreLabels(g);g.start();
   const r=format==='commands'?record(g):g.recorder;g.run(`state.ores=[{x:500,y:600,amount:${amount}}]`);r.reset();g.run('render()');
   const paints=copy(r.paints),events=format==='commands'?copy(r.events):undefined,views=oreViews(g),options={format,...(events?{events}:{})};
   const projected=projectOreDensity(paints,views,options),at=projected.occurrences[0].at,key=format==='commands'?'args':'shape',color=format==='commands'?'fillStyle':'color',tail=at+1+count(amount);
   assert.equal(projected.removedPaints,8-count(amount));assert.deepEqual(paints,r.paints,'ore projection input immutable');
   let rejected=0;
   for(const [name,change]of[
    ['tail position',p=>p[tail][key][0]=format==='commands'?999:[999,999]],
    ['tail color',p=>p[tail].style[color]='#bad'],['tail alpha',p=>p[tail].style[format==='commands'?'globalAlpha':'alpha']=.2],
    ['tail unknown field',p=>p[tail].unexpected=true],['tail clip',p=>p[tail].clips=[[]]],['tail wrong method',p=>p[tail][format==='commands'?'op':'kind']='strokeRect'],
    ['tail missing',p=>p.splice(tail,1)],['tail reordered',p=>[p[tail],p[tail+1]]=[p[tail+1],p[tail]]],
    ['base wrong position',p=>p[at][key]=[]],['base wrong color',p=>p[at].style[color]='#bad'],
    ['retained block wrong position',p=>p[at+1][key]=[]],['retained block wrong color',p=>p[at+1].style[color]='#bad'],
    ['label missing',p=>p.splice(at+9,1)],['label wrong text',p=>p[at+9][key][0]='wrong'],['label wrong color',p=>p[at+9].style[color]='#bad'],
    ['duplicate base',p=>p.push(copy(p[at]))]
   ]){
    const changed=copy(paints);change(changed);assert.throws(()=>projectOreDensity(changed,views,options),e=>e.name==='AssertionError'&&e.code==='ERR_ASSERTION'&&e.message.startsWith('ore projection'),'ore projection semantic rejection '+name);rejected++;
   }
   // Altered fields outside the omitted tail MUST remain observable; never filter them.
   for(const [name,change]of[['unrelated paint',p=>p[0].style[color]='#bad'],['extra rect',p=>p.push(copy(p[at+1]))],['base alpha',p=>p[at].style[format==='commands'?'globalAlpha':'alpha']=.321],['label position',p=>p[at+9][key][1]++]]){
    const changed=copy(paints);change(changed);let normalized;try{normalized=projectOreDensity(changed,views,options)}catch(e){assert.equal(e.code,'ERR_ASSERTION');rejected++;continue}assert.notDeepEqual(normalized.paints,projected.paints,'ore projection preserves '+name);rejected++;
   }
   if(events){
    const start=events.findIndex((e,i)=>e[0]==='beginPath'&&JSON.stringify(events[i+1])===JSON.stringify(['arc',500,600,33,0,Math.PI*2]));assert.ok(start>=0);
    for(const [name,change]of[['tail method',e=>e[start+3+count(amount)][0]='strokeRect'],['tail missing method',e=>e.splice(start+3+count(amount),1)],['tail extra method',e=>e.splice(start+3+count(amount),0,['measureText','unexpected'])],['base method',e=>e[start+2][0]='stroke'],['label method',e=>e[start+11][0]='strokeText']]){
     const changed=copy(events);change(changed);assert.throws(()=>projectOreDensity(paints,views,{format,events:changed}),e=>e.code==='ERR_ASSERTION'&&e.message.startsWith('ore projection'),'ore projection rejects '+name);rejected++;
    }
    const extra=copy(events);extra.push(['measureText','unrelated']);assert.deepEqual(projectOreDensity(paints,views,{format,events:extra}).events.at(-1),extra.at(-1),'unrelated method preserved');rejected++;
   }
   assert.deepEqual(projectOreDensity(paints,[],options).paints,paints,'no descriptors never omit arbitrary paints');
   results.push({format,amount,rejected});
  }finally{fs.rmSync(tmp,{recursive:true,force:true})}
 }
 return results;
}
function runSuite(){
 const results=[];function test(name,fn){try{results.push({name,passed:true,...fn()})}catch(e){results.push({name,passed:false,errorName:e.name,errorCode:e.code||null,error:e.stack})}}
 test('source/exact-version-low-label-and-single-render-loop-deltas',()=>{assert.equal(hash(frozen),'6e170c0b72206693e554f0798a02b413af12b0c2fb3c2f0f7160c5e00c24dd61');assert.equal(hash(historical),'75c75c7a25af246d366770809853f2fab440cd734c11d9fbe6acfe840a0efd39');assert.equal(require('./source-delta-v302.cjs')(require('./source-delta-to-v302-v316.cjs')(frozen)),historical);return{sourceSha256:hash(frozen),baselineSha256:hash(historical)}});
 const amounts=[-1,0,.001,.5,1,999,999.999,1000,1000.001,1499,1499.99,1500,1500.001,1501,4499.99,4500,4500.001,4501,12000,1000000];
 for(const amount of amounts)for(const preview of [false,true])for(const caching of [false,true])test(`threshold/${amount}/preview-${preview}/cached-${caching}`,()=>checkPair(frozen,`state.ores=[{x:500,y:600,amount:${amount}}]`,{preview,caching}));
 for(const map of maps)for(const preview of [false,true])for(const caching of [false,true])test(`map/${map}/preview-${preview}/cached-${caching}`,()=>checkPair(frozen,"state.ores.forEach((o,i)=>o.amount=[1500,4500,12000,0,.1,4500.001][i%6]);hoverActive=true;mouse={x:state.ores[0].x,y:state.ores[0].y};selection=new Set([5]);",{map,preview,caching}));
 test('overlap/posts-hover-and-consecutive-frames',()=>checkPair(frozen,'state.ores=[{x:450,y:260,amount:1500},{x:290,y:640,amount:4500},{x:291,y:641,amount:.001}];hoverActive=true;mouse={x:290,y:640};selection=new Set([3,5]);',{preview:true,frames:3}));
 test('expected-depleted/protected-historical-adapter-boundaries',()=>require('./depleted-ore-expected-v315.cjs').adapterBoundaryControls(historical.split('\n').find(s=>s.startsWith('function render()')),frozen.split('\n').find(s=>s.startsWith('function render()')),historical.split('\n').find(s=>s.startsWith('function drawRocks()'))));
 test('projection/exact-omitted-tails-and-observable-unrelated-fields',()=>({controls:projectionControls()}));
 const mutations=[
  ['lower inclusive threshold','o.amount<=1500?1','o.amount<1500?1',1500],['upper inclusive threshold','o.amount<=4500?4','o.amount<4500?4',4500],
  ['middle missing tail block','o.amount<=4500?4','o.amount<=4500?3',2500],['middle extra tail block','o.amount<=4500?4','o.amount<=4500?5',2500],
  ['low retains wrong block','i<n;i++){let a=i*2.4','i<n;i++){let a=(i+1)*2.4',100],['retained position','Math.cos(a)*22-4','Math.cos(a)*23-4',100],
  ['retained color',"i%2?'#c6b96d':'#e5d183'","i%2?'#c6b96d':'#ffffff'",100],
  ['high missing last block','o.amount<=4500?4:8','o.amount<=4500?4:7',12000],
  ['retained odd color',"i%2?'#c6b96d':'#e5d183'","i%2?'#ffffff':'#e5d183'",2500],
  ['retained wrong method',"rect(o.x+Math.cos(a)*22-4,o.y+Math.sin(a)*21-5,9,12,i%2?'#c6b96d':'#e5d183')","ctx.strokeRect(o.x+Math.cos(a)*22-4,o.y+Math.sin(a)*21-5,9,12)",100],
  ['missing label',"text(label,x,y,'#e2d692',11)","void 0",100],
  ['base color',"circle(o.x,o.y,33,'#746544')","circle(o.x,o.y,33,'#ffffff')",100],
  ['base position',"circle(o.x,o.y,33,'#746544')","circle(o.x+1,o.y,33,'#746544')",100],
  ['label color',"text(label,x,y,'#e2d692',11)","text(label,x,y,'#ffffff',11)",100],
  ['label position',"text(label,x,y,'#e2d692',11)","text(label,x+1,y,'#e2d692',11)",100],
  ['zero skip','if(o.amount<=0)continue;let label=','if(o.amount<0)continue;let label=',0,'layout'],
  ['extra Canvas method','let a=i*2.4;rect(o.x','let a=i*2.4;ctx.measureText("extra");rect(o.x',100,'methods'],
  ['world mutation','let a=i*2.4;rect(o.x','let a=i*2.4;state.cash++;rect(o.x',100,'world'],
  ['RNG consumption','let a=i*2.4;rect(o.x','let a=i*2.4;Math.random();rect(o.x',100,'rng']
 ];
 for(const [name,before,after,amount,kind='paints']of mutations)test('negative/'+name,()=>{
  assert.equal(frozen.split(before).length-1,1,'unique mutation anchor');const setup=`state.ores=[{x:500,y:600,amount:${amount}}]`;
  checkPair(frozen,setup,{preview:true,frames:1});let error;try{checkPair(frozen.replace(before,after),setup,{preview:true,frames:1})}catch(e){error=e}
  assert.ok(error,'behavioral mutant must fail');const diagnostic={paints:'ore density complete paints',layout:'ore density layout labels positions and order',methods:'ore density complete Canvas methods',world:'ore density world unchanged',rng:'ore density render consumed RNG'}[kind];
  assert.equal(error.name,kind==='rng'?'Error':'AssertionError');if(kind!=='rng')assert.equal(error.code,'ERR_ASSERTION');assert.ok(error.message.startsWith(diagnostic),'exact semantic rejection, no source identity gate: '+error.message);return{rejectedBy:diagnostic};
 });
 assert.equal(fs.readFileSync(sourceFile,'utf8'),frozen,'product source unchanged');
 return {passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,sourceSha256:hash(frozen),baselineSha256:hash(historical),results,scope:'Complete real renderer with immutable v301 baseline plus explicit expected-side low-ore labels and independently specified depleted ground insertion at the hash-locked historical layer slot; 20 integer/fraction boundary quantities, all eight maps, both preview states, cached/direct paths, zero/depleted skip, layout/base/style/method/order, world/input/RNG/current-path parity and behavior-only negatives. Only exact validated historical ore suffixes are omitted. Synthetic Canvas/Path2D recording, not native raster or FPS evidence.'};
}
module.exports={runSuite,checkPair,projectionControls};
if(require.main===module){const result=runSuite();console.log(JSON.stringify(result,null,2));if(result.failed)process.exitCode=1}
