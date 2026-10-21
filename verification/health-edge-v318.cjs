'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {oreViews,projectOreDensity}=require('./ore-density-normalization-v314.cjs');
const h=require('./render-preview-v318.cjs');
const {cueViews,projectCues}=require('./building-cue-normalization-v301.cjs');
const {installExpectedPresentation}=require('./presentation-expected-v317.cjs');
// Candidate health paints are never projected. Only the uniquely anchored historical
// health pair gains the reviewed separator and colors on the expected side.
const plain=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const rectangle=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function expectedHealthCalls(calls,e){
 if(!calls.length)return[];
 const y=e.y-e.r-12,x=e.x-e.r,w=e.r*2,ratio=Math.max(0,e.hp/e.max),color=e.team?'#e78f6a':'#a3db81';
 assert.deepEqual(calls,[[x,y,w,4,'#16231b'],[x,y,w*ratio,4,color]],'health oracle exact historical pair');
 const healthY=Math.max(0,y);
 return [[x-1,healthY-1,w+2,6,'#0b171c'],[x,healthY,w,4,'#34433e'],[x,healthY,w*ratio,4,e.hp/e.max<.3?'#ffbc78':color]];
}
function adaptHistoricalHealthPaints(paints,entities){
 const expected=plain(paints),replacements=new Map(),used=new Set();let shiftedPairs=0;
 for(const e of entities){
  const y=e.y-e.r-12,x=e.x-e.r,w=e.r*2,fg=w*Math.max(0,e.hp/e.max),color=e.team?'#e78f6a':'#a3db81';
  const indices=[];
  for(let i=0;i<paints.length-1;i++){const a=paints[i],b=paints[i+1];if(a.kind==='fillRect'&&b.kind==='fillRect'&&a.style.color==='#16231b'&&b.style.color===color&&same(a.shape,rectangle(x,y,w,4))&&same(b.shape,rectangle(x,y,fg,4))&&same(a.clips,[])&&same(b.clips,[]))indices.push(i)}
  assert.equal(indices.length,1,'health oracle unique entity-derived adjacent historical pair');
  const i=indices[0];assert.ok(!used.has(i)&&!used.has(i+1),'health oracle cannot adapt one paint twice');used.add(i);used.add(i+1);
  const calls=expectedHealthCalls([[x,y,w,4,'#16231b'],[x,y,fg,4,color]],e);
  replacements.set(i,calls.map(([px,py,pw,ph,paintColor],n)=>{const paint=plain(paints[i+(n===2?1:0)]);paint.shape=rectangle(px,py,pw,ph);paint.style.color=paintColor;return paint}));
  if(y<0)shiftedPairs++;
 }
 const out=[];for(let i=0;i<expected.length;i++){if(replacements.has(i)){out.push(...replacements.get(i));i++}else out.push(expected[i])}
 assert.equal(out.length,paints.length+entities.length,'health oracle inserts exactly one separator per visible health bar');
 return {paints:out,adaptedPairs:entities.length,shiftedPairs};
}
function installHistoricalPresentation(g){installExpectedPresentation(g,{health:false});return g;}
function runSuite(options={}){
const changed=options.sourceText??fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),source=options.baselineText??require('./restore-v296-from-v318.cjs')(changed),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.equal(hash(source),'02c622cdfaf30fb5c9ea854c2c3b4208cc39f4057af4277e229cc009cbb0e2a1','strict historical v296 identity before expected-label adaptation');
let cases=0;const evidence=[];
function mouse(g,type,x,y){g.run('canvas').dispatchEvent({type,clientX:x,clientY:y,button:type==='contextmenu'?2:0,pointerId:1,pointerType:'mouse',isPrimary:true,shiftKey:false,preventDefault(){}})}
// Natural initial world; real start + pointer selection + contextmenu command; no entity/resource mutation.
for(const id of [6,7]){
 const g=installHistoricalPresentation(h.game(source,{expectedLabels:true,expectedDepleted:true}));g.start();let e=g.run('get('+id+')'),start=plain(e);
 mouse(g,'pointerdown',e.x,e.y);mouse(g,'pointerup',e.x,e.y);assert.deepEqual(g.run('[...selection]').join(','),String(id));
 mouse(g,'contextmenu',e.x,0);let goal=plain(e.goal);g.step(15);e=g.run('get('+id+')');
 assert.equal(e.goal,null);assert.equal(e.hp,e.max);assert.ok(e.y-e.r-12<0);
 let paints=h.frame(g),bars=paints.filter(p=>p.kind==='fillRect'&&['#16231b','#a3db81'].includes(p.style.color)&&p.shape[0][0]===e.x-e.r&&p.shape[1][0]===e.x+e.r);
 assert.equal(bars.length,2);const y=e.y-e.r-12;assert.equal(bars[0].shape[0][1],y);
 const fixed=h.game(changed);fixed.start();mouse(fixed,'pointerdown',start.x,start.y);mouse(fixed,'pointerup',start.x,start.y);mouse(fixed,'contextmenu',start.x,0);fixed.step(15);
 const fixedPaints=h.frame(fixed),fixedBars=fixedPaints.filter(p=>p.kind==='fillRect'&&['#34433e','#a3db81'].includes(p.style.color)&&p.shape[0][0]===e.x-e.r&&p.shape[1][0]===e.x+e.r);
 assert.equal(h.world(g),h.world(fixed),'natural route world/input equality');assert.equal(fixedBars.length,2,'natural pointer route emits exact health pair');assert.ok(fixedBars.every(p=>p.shape[0][1]===0&&p.shape[2][1]===4),'natural pointer route retains four-pixel bars');
 const at=fixedPaints.indexOf(fixedBars[0]);assert.equal(fixedPaints[at+1],fixedBars[1],'natural pointer route preserves adjacent health pair');
 const expectedSeparator=plain(fixedBars[0]);expectedSeparator.shape=rectangle(e.x-e.r-1,-1,e.r*2+2,6);expectedSeparator.style.color='#0b171c';assert.deepEqual(fixedPaints[at-1],expectedSeparator,'natural pointer route exact dark separator');
 evidence.push({kind:'natural-start pointer/contextmenu full-game movement witness',id,start:{x:start.x,y:start.y,r:start.r},requested:{x:start.x,y:0},acceptedGoal:goal,arrival:{x:e.x,y:e.y,r:e.r,hp:e.hp},barY:y,originalVisibleHeight:Math.max(0,Math.min(4,y+4)),correctedVisibleHeight:4});cases++;
}
const oldBranch=source.match(/if\(e\.hp<e\.max\|\|selection\.has\(e\.id\)\)\{rect\(e\.x-e\.r,e\.y-e\.r-12,[\s\S]*?\}\}for\(let s of state.shots\)/)[0].replace(/\}for\(let s of state.shots\)$/,'');
const newBranch=changed.slice(changed.indexOf('function render()')).match(/if\(e\.hp[^{}]*\{let healthY=[\s\S]*?\}\}for\(let s of state.shots\)/)[0].replace(/\}for\(let s of state.shots\)$/,'');
if(options.identity!==false)assert.equal(require('./restore-v296-from-v318.cjs')(changed),source,'exact approved v315 source restoration to historical v296');
// Exhaustive bounded branch matrix, all ten canonical roles and both teams.
const defs=h.game(source,{expectedLabels:true,expectedDepleted:true}).run('defs');
for(const [type,d] of Object.entries(defs))for(const team of[0,1])for(const ratio of[-.1,0,.01,.299999,.3,.300001,.99,1,1.1])for(const selected of[false,true])for(const delta of[-12,-8,-4,-.001,0,.001,4,100]){
 const e={id:1,type,team,x:100,y:d.r+12+delta,r:d.r,hp:d.hp*ratio,max:d.hp};const render=branch=>{const calls=[];new Function('e','selection','rect',branch)(e,new Set(selected?[1]:[]),(...a)=>calls.push(a));return calls};const before=JSON.stringify(e),a=render(oldBranch),b=render(newBranch);assert.equal(JSON.stringify(e),before);assert.equal(b.length,a.length?3:0,'health predicate unchanged');assert.deepEqual(b,expectedHealthCalls(a,e),'health branch exact paint semantics');cases++;
}
// Complete real-render comparisons in OFF, direct fallback, and cached modes.
for(const mode of['off','direct','cached'])for(const delta of[-12,-8,-4,-.001,0,.001,100]){
 const games=[source,changed].map((s,i)=>{const g=h.game(s,{mode:mode==='direct'?'absent':'good',expectedLabels:i===0,expectedDepleted:i===0});return i===0?installHistoricalPresentation(g):g});
 for(const g of games){h.richFixture(g);g.run(`for(let e of state.entities){e.y=e.r+12+${delta};unitTrackMemory.set(e,{x:e.x,y:e.y,phase:2})}`);if(mode!=='off')h.toggle(g,true);g.run('Math.random=()=>{throw Error("unexpected RNG")};')}
 const [a,b]=games;let aw=h.world(a),bw=h.world(b),at=h.tracks(a),bt=h.tracks(b);
 for(let n=0;n<3;n++){
 const entities=plain(a.run('state.entities.filter(e=>e.hp<e.max||selection.has(e.id)).map(e=>({x:e.x,y:e.y,r:e.r,hp:e.hp,max:e.max,team:e.team}))'));
 const pa=projectOreDensity(h.frame(a),oreViews(a),{format:'world'}).paints,pb=projectCues(h.frame(b),cueViews(b),{format:'world'}).paints;
 const adapted=adaptHistoricalHealthPaints(pa,entities);assert.deepEqual(pb,adapted.paints,mode+' exact entity-derived expected health paints');
 assert.equal(pa.length+entities.length,pb.length,'one exact separator added per health pair');
 assert.equal(h.world(a),aw);assert.equal(h.world(b),bw);assert.equal(h.tracks(a),at);assert.equal(h.tracks(b),bt);assert.deepEqual(a.recorder.snapshot(),b.recorder.snapshot());assert.deepEqual(a.recorder.current,b.recorder.current);if(delta<0)assert.ok(adapted.shiftedPairs>0);cases++;
 }
}
for(const delta of[-12,-8,-4,-.001,0,.001,100]){const a=h.game(changed),b=h.game(changed,{mode:'absent'});for(const g of[a,b]){h.richFixture(g);g.run(`for(let e of state.entities){e.y=e.r+12+${delta};unitTrackMemory.set(e,{x:e.x,y:e.y,phase:2})}`);h.toggle(g,true);g.run('Math.random=()=>{throw Error("unexpected RNG")};')}h.pairFrames(a,b,{frames:3,move:false,label:'prototype cached/direct exact full-frame parity'});cases++;}
return {passed:cases,failed:0,baselineSha256:hash(source),prototypeSha256:hash(changed),naturalWitnesses:evidence,scope:'2880 branch cases retain all 2240 historical cases and add exact .3 threshold neighbors; 63 complete-frame differential cases apply reviewed non-health presentation to the historical VM, retain strict ore-tail/label/cue adapters, and add only exact entity-derived health separators/colors/clamped Y on the expected side. Includes two natural pointer route witnesses and seven additional 3-frame cached/direct parity scenarios. No real storage/native browser/FPS claims.'};
}
module.exports={runSuite,expectedHealthCalls,adaptHistoricalHealthPaints};
if(require.main===module){try{console.log(JSON.stringify(runSuite(),null,2))}catch(e){console.log(JSON.stringify({passed:0,failed:1,error:e.stack},null,2));process.exitCode=1}}

