'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {loadGame}=require('./no-persistence-vm.cjs');
const source=process.argv[2];if(!source)throw Error('Source required');
let results=[];
function test(name,fn){try{fn();results.push({name,pass:true})}catch(e){results.push({name,pass:false,error:e.stack})}}
function fixture(extra=''){const g=loadGame(source).start();g.run(`groups=[[6,7],[8],[5]];selection=new Set([7]);${extra};updateUI()`);return g}
function snapshot(g){return g.run('JSON.stringify({state:{...state,logs:[]},uid,groups,selection:[...selection],placement,attackMode,drag,ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,simulationRemainder,restartPrompt})')}
const paths={
 direct:(g,i)=>g.run(`controlGroup(${i},true)`),
 ctrl:(g,i)=>g.dispatch('keydown',{key:String(i+1),ctrlKey:true}),
 meta:(g,i)=>g.dispatch('keydown',{key:String(i+1),metaKey:true}),
 ctrlclick:(g,i)=>g.document.querySelectorAll('[data-group]').find(b=>Number(b.dataset.group)===i).click({ctrlKey:true}),
 visible:(g,i)=>g.click('saveControlGroup'+i),
 callback:(g,i)=>g.element('saveControlGroup'+i).onclick(),
};
for(let i=0;i<3;i++)for(const [p,action]of Object.entries(paths))for(const [kind,setup]of Object.entries({empty:'selection.clear()',building:'selection=new Set([1])',enemy:'selection=new Set([17])',missing:'selection=new Set([9999])',dead:'get(7).hp=0;selection=new Set([7])'}))test(`reject ${kind} ${p} group ${i}`,()=>{const g=fixture(setup),before=snapshot(g);action(g,i);assert.equal(snapshot(g),before)});
for(const [p,action]of Object.entries(paths))for(const mode of ["placement='power'","attackMode=true","ordinaryCommandMode=true","appendCommandMode=true","drag={pointerId:73,x:15,y:25}"])test(`rejected ${p} preserves ${mode}`,()=>{const g=fixture(`selection=new Set([1]);${mode}`);const before=snapshot(g);action(g,0);assert.equal(snapshot(g),before)});
for(let i=0;i<3;i++)for(const [p,action]of Object.entries(paths))for(const paused of [false,true])test(`live mixed replacement ${p} ${i} paused=${paused}`,()=>{const g=fixture(`state.paused=${paused};get(8).hp=0;selection=new Set([7,5,1,17,999,8]);globalThis.service=create('repair',0,600,500);selection.add(service.id);updateUI()`),prior=g.run('JSON.stringify(state.entities)'),cash=g.state.cash;action(g,i);assert.deepEqual(JSON.parse(g.run(`JSON.stringify(groups[${i}])`)),[5,7,g.run('service.id')]);assert.equal(g.run('JSON.stringify(state.entities)'),prior);assert.equal(g.state.cash,cash)});
for(const [p,action]of Object.entries(paths))for(const phase of ['state.started=false','restartPrompt=true',"state.result='胜利'"])test(`blocked ${p} ${phase}`,()=>{const g=fixture(phase),before=snapshot(g),logs=JSON.stringify(g.state.logs);action(g,1);assert.equal(snapshot(g),before);assert.equal(JSON.stringify(g.state.logs),logs)});
for(const [p,action]of Object.entries(paths))test(`stale enabled save ${p} rechecks dead selection`,()=>{const g=fixture();assert.equal(g.element('saveControlGroup0').disabled,false);g.run('get(7).hp=0');const before=snapshot(g);action(g,0);assert.equal(snapshot(g),before)});
for(let i=0;i<3;i++)for(const p of ['direct','key','click'])test(`recall unchanged ${p} group ${i}`,()=>{const g=fixture("placement='power';attackMode=true;ordinaryCommandMode=true;drag={pointerId:8,x:10,y:20}"),before=JSON.stringify(g.state.entities),expected=JSON.parse(g.run(`JSON.stringify(groups[${i}])`));if(p==='direct')g.run(`controlGroup(${i},false)`);if(p==='key')g.dispatch('keydown',{key:String(i+1)});if(p==='click')g.document.querySelectorAll('[data-group]').find(b=>Number(b.dataset.group)===i).click();assert.deepEqual(JSON.parse(g.run('JSON.stringify([...selection])')),expected);assert.equal(JSON.stringify(g.state.entities),before);assert.equal(g.run('!placement&&!attackMode&&!ordinaryCommandMode&&!drag'),true)});
const out={source,sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,scope:'Independent synthetic whole-source VM fixtures; lifecycle and hp cases injected explicitly. Persistence UI refresh disabled in harness; persistence API throws; no save/load/import/export/storage operation invoked. No native event or browser fidelity claim.',results};console.log(JSON.stringify(out,null,2));if(out.failed)process.exitCode=1;
