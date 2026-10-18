'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=__dirname,base=path.resolve(root,'../../v292-package-tools/RED/index.html'),candidate=path.join(root,'index.html');
const {loadGame}=require(path.resolve(root,'../../v292-package-tools/RED/verification/vm-environment.cjs'));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),source=fs.readFileSync(candidate,'utf8'),original=fs.readFileSync(base,'utf8');
let checks=0;function ok(v,m){assert.ok(v,m);checks++}function eq(a,b,m){assert.deepEqual(a,b,m);checks++}
const oldStart=original.indexOf('function drawUnit(e)'),newStart=source.indexOf('// Draw-only art pilot:'),tail='const terrainAccentTiles';
eq(source.slice(0,newStart),original.slice(0,oldStart),'all source before drawUnit byte-identical');eq(source.slice(source.indexOf(tail)),original.slice(original.indexOf(tail)),'all source after drawUnit byte-identical');
const delta=source.slice(newStart,source.indexOf(tail));ok(!/Math\.random|state\.|selection\.|\.r\s*=|\.angle\s*=|drawImage|clip\(|shadowBlur/.test(delta),'draw-only boundary');
function recorder(g){const events=[],stack=[];let count=0;const c=g.element('map').getContext('2d');for(const k of ['save','restore','translate','rotate','beginPath','moveTo','lineTo','closePath','fill','fillRect','arc','stroke','strokeRect','clip'])c[k]=function(...args){count++;for(const a of args)ok(Number.isFinite(a),'finite drawing argument');if(k==='save')stack.push({fillStyle:this.fillStyle});if(k==='restore'){ok(stack.length>0,'balanced restore');Object.assign(this,stack.pop())}events.push({op:k,args,color:this.fillStyle})};return{events,stack,reset(){events.length=0;count=0},get count(){return count}}}
const g=loadGame(candidate,{seed:777}).start(),b=loadGame(base,{seed:777}).start(),r=recorder(g),br=recorder(b);
const types=['tank','scout','artillery','repair','harvester'],maxByType={};let specimens=0;
g.run('Math.random=()=>{throw Error("Rendering consumed RNG")};');b.run('Math.random=()=>{throw Error("Baseline rendering consumed RNG")};');
const snap=q=>q.run('JSON.stringify({state,uid,groups,selection:[...selection],placement,attackMode,drag,ordinaryCommandMode,appendCommandMode,simulationRemainder})');
for(const type of types)for(const team of [0,1])for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI])for(const hp of [0,1,230])for(const load of [0,90,180]){
 const setup=`globalThis.artFixture={...defs.${type},id:999,type:${JSON.stringify(type)},team:${team},x:0,y:800,angle:${angle},hp:${hp},load:${load}};`;
 g.run(setup);b.run(setup);const before=snap(g),entity=g.run('JSON.stringify(artFixture)');r.reset();br.reset();g.run('drawUnit(artFixture)');b.run('drawUnit(artFixture)');
 eq(snap(g),before,'drawUnit world/input invariant');eq(g.run('JSON.stringify(artFixture)'),entity,'entity invariant');eq(r.stack.length,0,'draw context stack balanced');
 eq(r.events.filter(e=>['save','translate','rotate','restore'].includes(e.op)),br.events.filter(e=>['save','translate','rotate','restore'].includes(e.op)),'same transform sequence');
 ok(r.count<=70,'bounded Canvas command count per vehicle');
 const radius=g.run('artFixture.r'),forward=Math.max(radius+2,{tank:24,scout:17,artillery:34,repair:13,harvester:16}[type]);for(const event of r.events){let points=[];if(event.op==='fillRect'){let [x,y,w,h]=event.args;points=[[x,y],[x+w,y+h]]}else if(['moveTo','lineTo'].includes(event.op))points=[event.args];for(const [x,y]of points)ok(x>=-radius&&x<=forward&&y>=-radius&&y<=radius+4,'local artwork bounds including existing shadow/barrel extent');}eq(r.events.filter(e=>e.op==='clip').length,0,'no clipping changes');
 maxByType[type]={prototype:Math.max(maxByType[type]?.prototype||0,r.count),baseline:Math.max(maxByType[type]?.baseline||0,br.count)};
 g.run('artFixture.x+=10;artFixture.y-=2;drawUnit(artFixture)');b.run('artFixture.x+=10;artFixture.y-=2;drawUnit(artFixture)');eq(g.run('JSON.stringify(unitTrackMemory.get(artFixture))'),b.run('JSON.stringify(unitTrackMemory.get(artFixture))'),'distance-driven track memory identical');specimens++;
}
// Complete render, including paused/selection/FX/edge fixtures; proxy is only a Canvas-call recorder.
for(const fixture of ['','state.paused=true','selection=new Set(state.entities.map(e=>e.id))','state.entities[0].hp=1;state.fx=[{type:"boom",x:0,y:800,t:.2,max:.4}]','state.result="fixture"']){
 const q=loadGame(candidate,{seed:54}).start();q.run(fixture||'void 0');q.run('Math.random=()=>{throw Error("render RNG")};');const before=snap(q);q.run('render();render()');eq(snap(q),before,'full render world/input invariant');
}
// Natural simulation differential: both versions receive the same start and elapsed simulation.
const gameplay=[];
for(const map of ['classic','frontier','canyon','ridge','crossroads','switchback','ring','meridian']){
 const a=loadGame(base,{seed:880}),z=loadGame(candidate,{seed:880});for(const q of[a,z]){q.element('scenario').value=map;q.start();q.run('for(let i=0;i<1800;i++){advanceSimulation(.05);if(i%10===0)render()}');}
 eq(snap(a),snap(z),'90-second world/input differential '+map);eq(a.run('Math.random()'),z.run('Math.random()'),'RNG stream differential '+map);gameplay.push({map,seconds:90,matched:true});
}
const report={passed:true,checks,specimens,sourceSha256:hash(source),baselineSha256:hash(original),sourceScope:'Only drawUnit replacement plus unitArtPoly helper; all prefix/suffix bytes identical',maxCanvasCallsPerType:maxByType,gameplay,limitations:'Synthetic VM Canvas calls; no native raster/layout/clipping/GPU timing/FPS proof. Dead entities are draw-function robustness fixtures, not changed lifecycle behavior.'};
fs.writeFileSync(path.join(root,'art-test-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
