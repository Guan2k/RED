'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {loadGame}=require('./vm-environment.cjs'),adapter=require('./inherit-dom-v316.cjs'),previous=require('./inherit-dom-v314.cjs');
const source=path.join(__dirname,'../index.html'),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),sourceHash=hash(fs.readFileSync(source)),results=[];
const compile=text=>Function('assert','classNames','return ('+text+')')(assert,['hidden','active']);
const programs=Object.entries(adapter.programs).map(([name,e])=>({name,dom:compile(e.after),old:compile(previous.programs[name].after)}));
function allocation(version){const text=fs.readFileSync(path.join(__dirname,'command-allocation-feedback-'+version+'.cjs'),'utf8');const fn=Function('require','normalizeHoldAttributes','return ('+text.match(/const dom=(g=>[^\n]+);/)[1]+')')(require,require('./hold-dom-normalization-v312.cjs'));return g=>JSON.parse(JSON.stringify(fn(g)))}
function beginner(version){const text=fs.readFileSync(path.join(__dirname,'beginner-guide-'+version+'.cjs'),'utf8'),body=text.slice(text.indexOf('function retainedDom('),text.indexOf('const world ='));return Function('require','check','return ('+body+')')(require,(x,m)=>assert.ok(x,m))}
const guide=beginner('v316'),oldGuide=beginner('v315');
programs.push({name:'command-allocation',dom:allocation('v316'),old:allocation('v315')},{name:'beginner-guide',dom:g=>guide(g,true),old:g=>oldGuide(g,true)});
const types=['tank','scout','artillery','repair','harvester'];
function test(name,fn){try{fn()}catch(e){e.message=name+': '+e.message;throw e}results.push({name,passed:true})}
const fixture=()=>loadGame(source).start();
for(const {name,dom,old}of programs){
 test(name+' exact physical five-leaf removal equivalence',()=>{const g=fixture(),projected=dom(g),nodes=types.map(t=>g.element('productionReason'+t));for(const n of nodes)n.remove();g.elements.splice(0,g.elements.length,...g.elements.filter(n=>!nodes.includes(n)));assert.deepEqual(old(g),projected)});
 for(const type of types){
  test(name+' valid leaf reason text alone excluded '+type,()=>{const g=fixture(),before=dom(g);g.element('productionReason'+type).textContent='reason changed';assert.deepEqual(dom(g),before)});
  const mutations={
   'wrong id':(g,n)=>{n.id+='Other'},'wrong tag':(g,n)=>{n.tagName='DIV'},'detached':(g,n)=>n.remove(),
   'wrong card':(g,n)=>g.elements.find(e=>e.dataset.unit===types.find(t=>t!==type)).appendChild(n),
   'duplicate id':(g,n)=>{const c=g.document.createElement('span');c.id=n.id;n.parentNode.appendChild(c)},
   'detached duplicate id':(g,n)=>{g.document.createElement('span').id=n.id},
   'inconsistent attachment':(g,n)=>{n.parentNode.children.splice(n.parentNode.children.indexOf(n),1)},
   'duplicate attachment':(g,n)=>n.parentNode.children.push(n),
   'unexpected child not swallowed':(g,n)=>n.appendChild(g.document.createElement('button')),
   'card wrong tag':(g,n)=>{n.parentNode.tagName='DIV'},
   'card duplicate unit':(g,n)=>{g.document.createElement('button').dataset.unit=type},
   'old card disabled':(g,n)=>{n.parentNode.disabled=!n.parentNode.disabled},
   'old card title':(g,n)=>{n.parentNode.title='unexpected'},
   'old card attributes':(g,n)=>{n.parentNode.attributes['data-old-sentinel']='unexpected'},
   'old cost time label':(g,n)=>{n.parentNode.children.find(e=>e!==n).textContent='price corrupted'}
  };
  // Some historical comparators observe title through attributes rather than the property.
  delete mutations['old card title'];
  for(const [label,mutate]of Object.entries(mutations))test(name+' retains '+type+' '+label,()=>{const g=fixture(),before=dom(g);mutate(g,g.element('productionReason'+type));assert.notDeepEqual(dom(g),before)});
 }
 test(name+' old cash remains visible',()=>{const g=fixture(),before=dom(g);g.element('cash').textContent='wrong';assert.notDeepEqual(dom(g),before)});
}
test('unprojected beginner remains exact previous',()=>{const g=fixture();assert.deepEqual(guide(g),oldGuide(g));g.element('productionReasontank').textContent='changed';assert.deepEqual(guide(g),oldGuide(g))});
for(const [name,e]of Object.entries(adapter.programs))test(name+' frozen identity and exact inherited behavior preserved',()=>{const bytes=fs.readFileSync(path.join(__dirname,name)),before=previous.adapt(name,bytes),after=adapter.adapt(name,bytes);assert.equal(after.replace(e.after,previous.programs[name].after),before);assert.throws(()=>adapter.adapt(name,Buffer.concat([bytes,Buffer.from('\n')])),{code:'ERR_ASSERTION'})});
test('unknown comparator rejected',()=>assert.throws(()=>adapter.adapt('unknown.cjs',''),{code:'ERR_ASSERTION'}));
test('runtime bytes unchanged',()=>assert.equal(hash(fs.readFileSync(source)),sourceHash));
console.log(JSON.stringify({passed:results.length,failed:0,results,sourceSha256:sourceHash,scope:'Four actual current DOM comparators. Physical removal equivalence against prior comparators; five uniquely attached leaf reasons only. Malformed/duplicate/detached roots and old purchase/cost/control fields remain observable. No browser claim.'},null,2));
