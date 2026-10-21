'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{loadGame}=require('./vm-environment.cjs'),adapter=require('./inherit-dom-v317.cjs'),previous=require('./inherit-dom-v316.cjs');
const source=path.join(__dirname,'../index.html'),html=fs.readFileSync(source,'utf8'),baseline=require('./restore-v316-from-v318.cjs')(html),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),results=[];
assert.equal(hash(html),'7eda2c8962fe223b1397f90afdaf8beb47049342c1aa3979ee5ccbef8cee5234');
const compile=text=>Function('assert','classNames','return ('+text+')')(assert,['hidden','active']);
const programs=Object.entries(adapter.programs).map(([name,e])=>({name,dom:compile(e.after),old:compile(previous.programs[name].after)}));
function allocation(version){const text=fs.readFileSync(path.join(__dirname,'command-allocation-feedback-'+version+'.cjs'),'utf8');const fn=Function('require','normalizeHoldAttributes','return ('+text.match(/const dom=(g=>[^\n]+);/)[1]+')')(require,require('./hold-dom-normalization-v315.cjs'));return g=>JSON.parse(JSON.stringify(fn(g)))}
function beginner(version){const text=fs.readFileSync(path.join(__dirname,'beginner-guide-'+version+'.cjs'),'utf8'),body=text.slice(text.indexOf('function retainedDom('),text.indexOf('const world ='));return Function('require','check','return ('+body+')')(require,(x,m)=>assert.ok(x,m))}
const guide=beginner('v318'),oldGuide=beginner('v316');programs.push({name:'command-allocation',dom:allocation('v318'),old:allocation('v316')},{name:'beginner-guide',dom:g=>guide(g,true),old:g=>oldGuide(g,true)});
const os=require('node:os'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-v317-dom-')),oldFile=path.join(temp,'v316.html');fs.writeFileSync(oldFile,baseline);
const fixture=()=>loadGame(source).start(),oldFixture=()=>loadGame(oldFile).start();
const cases=[];function test(name,f){cases.push({name,f})}
const graph=g=>g.elements.map(n=>({fields:Object.fromEntries(Object.entries(n).filter(([k,v])=>v===null||['number','string','boolean'].includes(typeof v))),attributes:{...n.attributes},style:{...n.style},dataset:{...n.dataset},parent:g.elements.indexOf(n.parentNode),children:n.children.map(x=>g.elements.indexOf(x))}));
for(const {name,dom,old}of programs){
 test(name+' exact frozen old ordered graph equivalence',()=>assert.deepEqual(dom(fixture()),old(oldFixture())));
 test(name+' comparison does not mutate live graph',()=>{const g=fixture(),before=graph(g),elements=[...g.elements],active=g.document.activeElement;dom(g);assert.deepEqual(graph(g),before);assert.deepEqual(g.elements,elements);assert.equal(g.document.activeElement,active)});
 const mutations={
  'duplicate panel':g=>{const n=g.document.createElement('section');n.id='battleCommandPanel';g.document.body.appendChild(n)},
  'detached panel':g=>g.element('battleCommandPanel').remove(),
  'wrong panel parent':g=>g.document.body.appendChild(g.element('battleCommandPanel')),
  'panel unexpected field':g=>g.element('battleCommandPanel').attributes.extra='bad',
  'heading unexpected child':g=>g.element('battleCommandHeading').appendChild(g.document.createElement('button')),
  'row reordered':g=>g.element('attack').parentNode.children.reverse(),
  'rows reordered':g=>g.element('battleCommandPanel').children.reverse(),
  'nested unexpected child':g=>g.element('selectArmy').appendChild(g.document.createElement('span')),
  'wrong child parent':g=>{g.element('attack').parentNode=g.element('selection')},
  'duplicate flat node':g=>g.elements.push(g.element('selectArmy')),
  'wrong flat order':g=>{const a=g.elements.indexOf(g.element('selectArmy')),b=g.elements.indexOf(g.element('selectMiners'));[g.elements[a],g.elements[b]]=[g.elements[b],g.elements[a]]},
  'production reordered':g=>g.elements.find(n=>n.dataset.unit==='tank').parentNode.children.reverse(),
  'old unrelated value':g=>{g.element('cash').textContent='corrupt'},
  'old unrelated parent':g=>g.element('cash').parentNode=g.element('selection')
 };
 // Allocation's inherited contract has never observed parent pointers; all other
 // comparators retain that stronger assertion. Do not pretend to strengthen it.
 if(name==='command-allocation')delete mutations['old unrelated parent'];
 for(const id of ['selection','selectArmy','ordinaryCommand','attack','selectAllDamagedCombat','selectIdle'])mutations['retains old fields '+id]=g=>g.element(id).attributes.sentinel='corrupt';
 for(const type of ['tank','scout','artillery','repair','harvester'])mutations['retains production '+type]=g=>g.elements.find(n=>n.dataset.unit===type).disabled=!g.elements.find(n=>n.dataset.unit===type).disabled;
 for(const [label,mutate]of Object.entries(mutations))test(name+' rejects '+label,()=>{const g=fixture(),before=dom(g);mutate(g);let after;try{after=dom(g)}catch(e){assert.equal(e.code,'ERR_ASSERTION');return}assert.notDeepEqual(after,before)});
}
for(const[name,e]of Object.entries(adapter.programs))test(name+' exact prior comparator bytes except projection',()=>{const bytes=fs.readFileSync(path.join(__dirname,name)),old=previous.adapt(name,bytes),current=adapter.adapt(name,bytes);assert.equal(current.replace(e.after,previous.programs[name].after),old);assert.throws(()=>adapter.adapt(name,Buffer.concat([bytes,Buffer.from('\n')])),{code:'ERR_ASSERTION'})});
test('unprojected beginner preserves live current DOM',()=>{const g=fixture();assert.deepEqual(guide(g),oldGuide(g))});
test('product source unchanged',()=>assert.equal(fs.readFileSync(source,'utf8'),html));
// Bound test-only VM lifetime with isolated four-case child processes. Neither
// the product, old assertions, nor the historical VM timeout are modified.
const batchSize=4,batch=process.env.RED_V317_DOM_BATCH;
if(batch!==undefined){for(const {name,f} of cases.slice(Number(batch)*batchSize,(Number(batch)+1)*batchSize)){try{f()}catch(e){e.message=name+': '+e.message;throw e}results.push({name,passed:true})}}
else{const {spawnSync}=require('node:child_process');for(let i=0;i<Math.ceil(cases.length/batchSize);i++){const child=spawnSync(process.execPath,[__filename],{encoding:'utf8',env:{...process.env,RED_V317_DOM_BATCH:String(i)},maxBuffer:8*1024*1024});assert.equal(child.status,0,'isolated DOM batch '+i+': '+child.stderr);const report=JSON.parse(child.stdout);assert.equal(report.failed,0);assert.equal(report.sourceSha256,hash(html));assert.deepEqual(report.results.map(r=>r.name),cases.slice(i*batchSize,(i+1)*batchSize).map(c=>c.name),'exact batch case inventory');assert.ok(report.results.every(r=>r.passed===true));results.push(...report.results)}assert.equal(results.length,cases.length,'every registered case executed exactly once')}
fs.rmSync(temp,{recursive:true,force:true});
console.log(JSON.stringify({passed:results.length,failed:0,sourceSha256:hash(html),results,scope:'Four actual DOM comparators. Exact ordered cloned-graph relocation only; all original fields and subtrees retained. No runtime/source rewrite. Separate product layout acceptance remains required.'},null,2));
