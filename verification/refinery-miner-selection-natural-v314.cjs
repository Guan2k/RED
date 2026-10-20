'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{loadGame}=require('./vm-environment.cjs');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),g=loadGame(source,{seed:31301}).start(),events=[];
const read=e=>JSON.parse(g.run(`JSON.stringify(${e})`));
const world=()=>g.run('JSON.stringify({state,uid,groups,simulationRemainder,nav:state.entities.map(e=>[e.id,navigationMemory.get(e)]),deliveries:state.entities.map(e=>[e.id,harvesterDeliveries.get(e)])})');
let pointerId=0;function map(type,p,extra={}){g.element('map').dispatchEvent({type,clientX:p.x,clientY:p.y,pointerId,button:0,isPrimary:true,pointerType:'mouse',detail:1,...extra})}
function select(p){pointerId++;for(let type of ['pointerdown','pointerup','click'])map(type,p)}
function order(p){map('contextmenu',p,{button:2})}
const ref1=read('structures(0,"refinery")[0]'),initialMiner=read('ownHarvesters()[0]'),p={x:450,y:720};
assert.equal(g.run(`constructionPreview('refinery',${JSON.stringify(p)}).canBuild`),true);
g.document.querySelectorAll('[data-build]').find(b=>b.dataset.build==='refinery').click();select(p);
assert.equal(g.state.cash,1050);assert.equal(g.run('structures(0,"refinery").length'),2);events.push({action:'paid refinery build',cash:g.state.cash,t:g.state.t});
g.document.querySelectorAll('[data-unit]').find(b=>b.dataset.unit==='harvester').click();assert.equal(g.run('state.queue.some(q=>q.type==="harvester")'),true);
for(let i=0;i<600&&g.run('ownHarvesters().length<2||structures(0,"refinery").some(e=>e.build)');i++)g.step(.05);
assert.equal(g.run('ownHarvesters().length'),2);assert.equal(g.run('structures(0,"refinery").every(e=>!e.build)'),true);
events.push({action:'legal simulation completion',t:g.state.t,miners:read('ownHarvesters().map(e=>({id:e.id,x:e.x,y:e.y}))')});
const miners=read('ownHarvesters()');select(miners[0]);order({x:230,y:640});select(miners[1]);order({x:500,y:730});
for(let i=0;i<300;i++){g.step(.05);if(g.run('refineryMinerCohort(structures(0,"refinery")[0]).length===1&&refineryMinerCohort(structures(0,"refinery")[1]).length===1'))break}
assert.equal(g.run('refineryMinerCohort(structures(0,"refinery")[0]).length'),1);assert.equal(g.run('refineryMinerCohort(structures(0,"refinery")[1]).length'),1);
g.click('pause');
for(let ref of read('structures(0,"refinery")')){select(ref);assert.equal(g.run('selection.size'),1);let refs=read('structures(0,"refinery")'),ms=read('ownHarvesters()'),ids=ms.filter(m=>{let best=null,d=Infinity;for(let r of refs){let v=Math.hypot(r.x-m.x,r.y-m.y);if(v<d){best=r;d=v}}return best.id===ref.id}).map(m=>m.id);assert.equal(ids.length,1);let before=world(),orders=read('ownHarvesters().map(e=>({id:e.id,goal:e.goal,manual:e.manual,returnCargo:e.returnCargo,oreIndex:e.oreIndex,load:e.load}))');g.click('selectRefineryMiners');assert.deepEqual(read('[...selection]'),ids);assert.equal(world(),before);events.push({action:'selected live nearest cohort without changing either fleet orders',refinery:ref.id,selected:ids,orders,t:g.state.t})}
console.log(JSON.stringify({sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),passed:true,events,scope:'One legal full-source VM gameplay witness. Paid build and production, simulated completion/movement, map selection and ordinary commands use registered UI. No gameplay injection, persistence, native browser or release claim.'},null,2));
