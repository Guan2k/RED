'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {loadGame}=require('./no-persistence-vm.cjs');
const [base,source]=process.argv.slice(2);if(!base||!source)throw Error('Base and candidate required');
const results=[];
function test(name,fn){try{fn();results.push({name,pass:true})}catch(e){results.push({name,pass:false,error:e.stack})}}
function fixture(path,spec){const g=loadGame(path,{seed:29191}).start();g.run(`selection=new Set(${JSON.stringify(spec.ids||[6,7])});${spec.setup||''};updateUI();globalThis.allocationCalls=[];globalThis.reasonCalls=[];globalThis.nativeGround=groundGoal;globalThis.nativeReason=mapCommandReason;groundGoal=(e,p,used=[])=>{let i=allocationCalls.length;allocationCalls.push(JSON.stringify({id:e.id||null,r:e.r,p,used}));return ${JSON.stringify(spec.fail||[])}.includes(i)?null:nativeGround(e,p,used)};mapCommandReason=r=>{reasonCalls.push(r);return nativeReason(r)}`);return g}
const core=g=>g.run('JSON.stringify({state,uid,groups,selection:[...selection],placement,attackMode,drag,ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,simulationRemainder,restartPrompt,navigation:state.entities.map(e=>[e.id,navigationMemory.get(e)])})');
const read=(g,key)=>JSON.parse(g.run(`JSON.stringify(${key})`));
function invoke(g,spec,route){const p=spec.point||{x:600,y:680};if(route==='coordinate'){for(const [id,value]of [['coordinateCommandX',p.x],['coordinateCommandY',p.y]]){g.element(id).value=String(value);g.element(id).dispatchEvent({type:'input'})}g.click(spec.attack?'coordinateAttackExecute':'coordinateCommandExecute');}else if(route==='ordinary'){g.click('ordinaryCommand');g.element('map').dispatchEvent({type:'pointerdown',button:0,isPrimary:true,pointerId:8,clientX:p.x,clientY:p.y});g.element('map').dispatchEvent({type:'pointerup',button:0,isPrimary:true,pointerId:8,clientX:p.x,clientY:p.y});}else g.run(`issue(${JSON.stringify(p)},${!!spec.attack},${!!spec.append})`)}
const cases=[
 {name:'all vehicles fail',fail:[0,1],vehicle:2},
 {name:'partial vehicles fail',fail:[1],vehicle:1},
 {name:'all factories fail',ids:[4],fail:[0],factory:1},
 {name:'partial factories fail',ids:[4],setup:"globalThis.otherFactory=create('factory',0,500,700);selection.add(otherFactory.id)",fail:[1],factory:1},
 {name:'mixed both fail',ids:[1,4,6,7],fail:[0,1,2],factory:1,vehicle:2},
 {name:'mixed partial vehicle failure',ids:[1,4,6,7],fail:[2],vehicle:1},
 {name:'mixed factory failure vehicles accepted',ids:[1,4,6,7],fail:[0],factory:1},
 {name:'unrelated buildings not failures',ids:[1,2,3,6],fail:[0],vehicle:1},
 {name:'ore accepted remaining vehicle fails',ids:[5,6],point:{x:420,y:640},fail:[0],vehicle:1},
 {name:'escort accepted factory fails',ids:[4,6,7],point:{x:350,y:660},fail:[0],factory:1},
 {name:'repair follow accepted factory fails',ids:[4],setup:"globalThis.service=create('repair',0,600,500);selection.add(service.id)",point:{x:320,y:540},fail:[0],factory:1},
 {name:'all success',ids:[4,6,7]},
 {name:'enemy target',ids:[4,6,7],point:{x:930,y:300},fail:[0,1,2]},
 {name:'ore only accepted',ids:[5],point:{x:420,y:640}},
 {name:'escort only accepted',ids:[6,7],point:{x:350,y:660}},
 {name:'empty selection',ids:[]},
 {name:'building only',ids:[1,2,3]},
];
for(const spec of cases)for(const route of ['direct','coordinate','ordinary'])for(const paused of [false,true])test(`${spec.name} ${route} paused=${paused}`,()=>{
 const s={...spec,setup:(spec.setup||'')+`;state.paused=${paused}`};const a=fixture(base,s),b=fixture(source,s);invoke(a,s,route);invoke(b,s,route);
 assert.equal(core(b),core(a),'world/input/log exact parity');assert.deepEqual(read(b,'allocationCalls'),read(a,'allocationCalls'),'same allocator calls and arguments');
 const before=a.element('mapCommandReceipt').textContent,after=b.element('mapCommandReceipt').textContent;
 if(spec.vehicle||spec.factory){assert.notEqual(after,before,'persistent receipt must gain explanation');const reasons=read(b,'reasonCalls').join(';');if(spec.vehicle)assert.match(reasons,new RegExp(`(?:${spec.vehicle}[^;；]*安全落点|安全落点[^;；]*${spec.vehicle})`),'vehicle failure count');if(spec.factory)assert.match(reasons,new RegExp(`(?:${spec.factory}[^;；]*安全集结|安全集结[^;；]*${spec.factory})`),'factory failure count');assert.doesNotMatch(reasons,/无法抵达|路线不通|不可达|路径不存在/,'no route-impossibility claim');
 const receipt=after;b.run("for(let i=0;i<8;i++)tell('unrelated log '+i);updateUI()");assert.equal(b.element('mapCommandReceipt').textContent,receipt,'receipt survives log churn');b.click('stop');assert.match(b.element('mapCommandReceipt').textContent,/^停止回执/,'stop replaces receipt');
 b.run('groundGoal=nativeGround;selection=new Set([6]);issue({x:500,y:700})');assert.doesNotMatch(b.element('mapCommandReceipt').textContent,/未找到安全|找不到安全/,'next map replaces failure');
 }else assert.equal(after,before,'unaffected receipt exact parity');
});
for(const spec of [
 {name:'attack all vehicles fail',attack:true,fail:[0,1],vehicle:2},
 {name:'rock rejection',setup:'terrainObstacles=()=>[{x:600,y:680,r:40}]'},
 {name:'append',append:true},
 {name:'placement cancel',setup:"placement='power'"},
 {name:'blocked restart',setup:'restartPrompt=true'},
 {name:'blocked unstarted',setup:'state.started=false'},
 {name:'blocked terminal',setup:"state.result='胜利'"},
])test(spec.name,()=>{const a=fixture(base,spec),b=fixture(source,spec);invoke(a,spec,'direct');invoke(b,spec,'direct');assert.equal(core(b),core(a));assert.deepEqual(read(b,'allocationCalls'),read(a,'allocationCalls'));if(spec.vehicle)assert.match(read(b,'reasonCalls').join(';'),/2.*安全落点|安全落点.*2/);else assert.equal(b.element('mapCommandReceipt').textContent,a.element('mapCommandReceipt').textContent)});
const out={source,sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,scope:'Independent differential whole-source synthetic VM fixtures; scripted allocator-null cases and explicit lifecycle fixtures, not natural obstacle or browser reproduction. Actual allocator retained for nonfailed calls. Persistence UI refresh suppressed before bootstrap; no persistence operation executed.',results};console.log(JSON.stringify(out,null,2));if(out.failed)process.exitCode=1;
