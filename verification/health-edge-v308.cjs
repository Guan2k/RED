'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {oreViews,projectOreDensity}=require('./ore-density-normalization-v308.cjs');
const h=require('./render-preview-v308.cjs');
const {cueViews,projectCues}=require('./building-cue-normalization-v301.cjs');
function runSuite(options={}){
const changed=options.sourceText??fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),source=options.baselineText??require('./restore-v296-from-v308.cjs')(changed),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.equal(hash(source),'02c622cdfaf30fb5c9ea854c2c3b4208cc39f4057af4277e229cc009cbb0e2a1','strict historical v296 identity before expected-label adaptation');
let cases=0;const evidence=[];
const plain=x=>JSON.parse(JSON.stringify(x));
function mouse(g,type,x,y){g.run('canvas').dispatchEvent({type,clientX:x,clientY:y,button:type==='contextmenu'?2:0,pointerId:1,pointerType:'mouse',isPrimary:true,shiftKey:false,preventDefault(){}})}
// Natural initial world; real start + pointer selection + contextmenu command; no entity/resource mutation.
for(const id of [6,7]){
 const g=h.game(source,{expectedLabels:true});g.start();let e=g.run('get('+id+')'),start=plain(e);
 mouse(g,'pointerdown',e.x,e.y);mouse(g,'pointerup',e.x,e.y);assert.deepEqual(g.run('[...selection]').join(','),String(id));
 mouse(g,'contextmenu',e.x,0);let goal=plain(e.goal);g.step(15);e=g.run('get('+id+')');
 assert.equal(e.goal,null);assert.equal(e.hp,e.max);assert.ok(e.y-e.r-12<0);
 let paints=h.frame(g),bars=paints.filter(p=>p.kind==='fillRect'&&['#16231b','#a3db81'].includes(p.style.color)&&p.shape[0][0]===e.x-e.r&&p.shape[1][0]===e.x+e.r);
 assert.equal(bars.length,2);const y=e.y-e.r-12;assert.equal(bars[0].shape[0][1],y);
 const fixed=h.game(changed);fixed.start();mouse(fixed,'pointerdown',start.x,start.y);mouse(fixed,'pointerup',start.x,start.y);mouse(fixed,'contextmenu',start.x,0);fixed.step(15);let fixedBars=h.frame(fixed).filter(p=>p.kind==='fillRect'&&['#16231b','#a3db81'].includes(p.style.color)&&p.shape[0][0]===e.x-e.r&&p.shape[1][0]===e.x+e.r);assert.equal(h.world(g),h.world(fixed),'natural route world/input equality');assert.equal(fixedBars.length,2,'natural pointer route emits original health pair');assert.ok(fixedBars.every(p=>p.shape[0][1]===0&&p.shape[2][1]===4),'natural pointer route retains four-pixel bars');
 evidence.push({kind:'natural-start pointer/contextmenu full-game movement witness',id,start:{x:start.x,y:start.y,r:start.r},requested:{x:start.x,y:0},acceptedGoal:goal,arrival:{x:e.x,y:e.y,r:e.r,hp:e.hp},barY:y,originalVisibleHeight:Math.max(0,Math.min(4,y+4)),correctedVisibleHeight:4});cases++;
}
const oldBranch=source.match(/if\(e\.hp<e\.max\|\|selection\.has\(e\.id\)\)\{rect\(e\.x-e\.r,e\.y-e\.r-12,[\s\S]*?\}\}for\(let s of state.shots\)/)[0].replace(/\}for\(let s of state.shots\)$/,'');
const newBranch=changed.slice(changed.indexOf('function render()')).match(/if\(e\.hp[^{}]*\{let healthY=[\s\S]*?\}\}for\(let s of state.shots\)/)[0].replace(/\}for\(let s of state.shots\)$/,'');
if(options.identity!==false)assert.equal(require('./restore-v297-from-v308.cjs')(changed).replace(newBranch,oldBranch).replace('v0.297','v0.296'),source,'sole generated source difference is health y plus version');
// Exhaustive bounded branch matrix, all ten canonical roles and both teams.
const defs=h.game(source,{expectedLabels:true}).run('defs');
for(const [type,d] of Object.entries(defs))for(const team of[0,1])for(const ratio of[-.1,0,.01,.3,.99,1,1.1])for(const selected of[false,true])for(const delta of[-12,-8,-4,-.001,0,.001,4,100]){
 const e={id:1,type,team,x:100,y:d.r+12+delta,r:d.r,hp:d.hp*ratio,max:d.hp};const render=branch=>{const calls=[];new Function('e','selection','rect',branch)(e,new Set(selected?[1]:[]),(...a)=>calls.push(a));return calls};const before=JSON.stringify(e),a=render(oldBranch),b=render(newBranch);assert.equal(JSON.stringify(e),before);assert.equal(a.length,b.length,'health predicate unchanged');assert.deepEqual(b,a.map(v=>v.map((x,i)=>i===1?Math.max(0,x):x)),'health branch exact paint semantics');cases++;
}
// Complete real-render comparisons in OFF, direct fallback, and cached modes.
for(const mode of['off','direct','cached'])for(const delta of[-12,-8,-4,-.001,0,.001,100]){
 const games=[source,changed].map((s,i)=>h.game(s,{mode:mode==='direct'?'absent':'good',expectedLabels:i===0}));
 for(const g of games){h.richFixture(g);g.run(`for(let e of state.entities){e.y=e.r+12+${delta};unitTrackMemory.set(e,{x:e.x,y:e.y,phase:2})}`);if(mode!=='off')h.toggle(g,true);g.run('Math.random=()=>{throw Error("unexpected RNG")};')}
 const [a,b]=games;let aw=h.world(a),bw=h.world(b),at=h.tracks(a),bt=h.tracks(b);
 for(let n=0;n<3;n++){
 const entities=plain(a.run('state.entities.filter(e=>e.hp<e.max||selection.has(e.id)).map(e=>({x:e.x,y:e.y,r:e.r,hp:e.hp,max:e.max,team:e.team}))'));
 const pa=projectOreDensity(h.frame(a),oreViews(a),{format:'world'}).paints,pb=projectCues(h.frame(b),cueViews(b),{format:'world'}).paints;assert.equal(pa.length,pb.length);const expected=plain(pa);let changedPaints=0;const used=new Set();
 const shape=(e,w)=>[[e.x-e.r,e.y-e.r-12],[e.x-e.r+w,e.y-e.r-12],[e.x-e.r+w,e.y-e.r-8],[e.x-e.r,e.y-e.r-8]];
 for(const e of entities){let bg=shape(e,e.r*2),fg=shape(e,e.r*2*Math.max(0,e.hp/e.max));const matches=[];for(let i=0;i<pa.length-1;i++)if(pa[i].kind==='fillRect'&&pa[i+1].kind==='fillRect'&&pa[i].style.color==='#16231b'&&pa[i+1].style.color===(e.team?'#e78f6a':'#a3db81')&&JSON.stringify(pa[i].shape)===JSON.stringify(bg)&&JSON.stringify(pa[i+1].shape)===JSON.stringify(fg)&&pa[i].clips.length===0&&pa[i+1].clips.length===0)matches.push(i);assert.equal(matches.length,1,'unique entity-derived adjacent health pair');let i=matches[0];assert.ok(!used.has(i));used.add(i);if(e.y-e.r-12<0){for(const j of[i,i+1])expected[j].shape=expected[j].shape.map(([x,y])=>[x,y-(e.y-e.r-12)]);changedPaints+=2}}
 assert.deepEqual(pb,expected,mode+' exact entity-derived expected health paints');

 assert.equal(h.world(a),aw);assert.equal(h.world(b),bw);assert.equal(h.tracks(a),at);assert.equal(h.tracks(b),bt);assert.deepEqual(a.recorder.snapshot(),b.recorder.snapshot());assert.deepEqual(a.recorder.current,b.recorder.current);if(delta<0)assert.ok(changedPaints>0);cases++;
 }
}
for(const delta of[-12,-8,-4,-.001,0,.001,100]){const a=h.game(changed),b=h.game(changed,{mode:'absent'});for(const g of[a,b]){h.richFixture(g);g.run(`for(let e of state.entities){e.y=e.r+12+${delta};unitTrackMemory.set(e,{x:e.x,y:e.y,phase:2})}`);h.toggle(g,true);g.run('Math.random=()=>{throw Error("unexpected RNG")};')}h.pairFrames(a,b,{frames:3,move:false,label:'prototype cached/direct exact full-frame parity'});cases++;}
return {passed:cases,failed:0,baselineSha256:hash(source),prototypeSha256:hash(changed),naturalWitnesses:evidence,scope:'2240 branch cases plus 63 complete-frame differential cases with strictly validated historical ore-tail omission and explicit expected-side low-ore label adaptation and retained exact v301 cue normalization across OFF/direct/cache and two natural-start pointer command witnesses; seven additional 3-frame cached/direct parity scenarios. No real storage/native browser/FPS claims.'};
}
module.exports={runSuite};
if(require.main===module){try{console.log(JSON.stringify(runSuite(),null,2))}catch(e){console.log(JSON.stringify({passed:0,failed:1,error:e.stack},null,2));process.exitCode=1}}

