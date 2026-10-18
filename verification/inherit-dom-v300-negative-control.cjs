'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{loadGame}=require('./vm-environment.cjs'),adapter=require('./inherit-dom-v300.cjs'),previous=require('./inherit-dom-v299.cjs'),normalize=require('./hold-dom-normalization-v300.cjs');
const source=path.join(__dirname,'../index.html'),results=[];let assertions=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);assertions++},neq=(a,b,m)=>{assert.notDeepEqual(a,b,m);assertions++},test=(name,f)=>{f();results.push({name,passed:true})};
const root='beginnerSurvivalGuide',within=(e,p)=>{for(let n=e;n;n=n.parentNode)if(n===p)return true;return false};
const compile=s=>Function('assert','classNames','return ('+s+')')(assert,['hidden','active']);
const programs=Object.entries(adapter.programs).map(([name,e])=>({name,dom:compile(e.after),old:compile(previous.programs[name].after)}));
const extract=s=>Function('normalizeHoldAttributes','return ('+s.match(/const dom=(g=>[^\n]+);/)[1]+')')(normalize),frozen=f=>g=>JSON.parse(JSON.stringify(f(g)));
programs.push({name:'command-allocation-feedback',dom:frozen(extract(fs.readFileSync(path.join(__dirname,'command-allocation-feedback-v300.cjs'),'utf8'))),old:frozen(extract(fs.readFileSync(path.join(__dirname,'command-allocation-feedback-v299.cjs'),'utf8')))});
for(const{name,dom,old}of programs){
 test(name+' physical removal exactly equals previous projection',()=>{const g=loadGame(source).start(),expected=dom(g),panel=g.element(root),excluded=g.elements.filter(e=>within(e,panel));eq(excluded.length,11,'exact static guide subtree size');panel.remove();g.elements.splice(0,g.elements.length,...g.elements.filter(e=>!excluded.includes(e)));eq(old(g),expected,'only guide removed; all old transformations exact')});
 for(const id of [root,'beginnerSurvivalScope'])for(const [field,value]of [['textContent','different'],['hidden',true],['disabled',true]])test(name+' excluded exact descendant '+id+' '+field,()=>{const g=loadGame(source).start(),before=dom(g);g.element(id)[field]=value;eq(dom(g),before,'new subtree excluded only')});
 test(name+' renamed root retained',()=>{const g=loadGame(source).start(),before=dom(g);g.element(root).id+='Wrong';neq(dom(g),before,'renamed root is no longer excluded')});
 test(name+' similarly named sibling retained',()=>{const g=loadGame(source).start(),before=dom(g),e=g.document.createElement('p');e.id=root+'Other';g.element(root).parentNode.appendChild(e);neq(dom(g),before,'similar sibling retained')});
 test(name+' detached original descendant retained',()=>{const g=loadGame(source).start(),before=dom(g);g.element('beginnerSurvivalScope').remove();neq(dom(g),before,'detached original descendant retained')});
 test(name+' new detached descendant retained',()=>{const g=loadGame(source).start(),e=g.document.createElement('span');g.element(root).appendChild(e);const before=dom(g);e.remove();neq(dom(g),before,'detached new descendant retained')});
 for(const id of ['unitReference','controlsHelp','repeatReserve','repeatTarget','hold','holdOnArrival','rallyHold','repeatParallel','start','scenario']){
  for(const field of ['textContent','hidden','disabled','value'])test(name+' retained '+id+' '+field,()=>{const g=loadGame(source).start(),before=dom(g),e=g.element(id);e[field]=typeof e[field]==='boolean'?!e[field]:'unexpected';neq(dom(g),before,'old control property retained')});
  for(const attr of ['data-boundary','aria-describedby','title'])test(name+' retained '+id+' '+attr,()=>{const g=loadGame(source).start(),before=dom(g);g.element(id).setAttribute(attr,'unexpected');neq(dom(g),before,'unknown original-control attribute retained')});
 }
 test(name+' parent attribute retained',()=>{const g=loadGame(source).start(),before=dom(g);g.element(root).parentNode.setAttribute('data-boundary','changed');neq(dom(g),before,'existing container retained')});
}
for(const[name,e]of Object.entries(adapter.programs)){
 test(name+' strict frozen source identity',()=>{const bytes=fs.readFileSync(path.join(__dirname,name));adapter.adapt(name,bytes);assert.throws(()=>adapter.adapt(name,Buffer.concat([bytes,Buffer.from('\n')])),{code:'ERR_ASSERTION'});assertions++});
 test(name+' duplicate guide root rejected',()=>{const g=loadGame(source),n=g.document.createElement('details');n.id=root;g.element(root).parentNode.appendChild(n);assert.throws(()=>compile(e.after)(g),/unique added panel/);assertions++});
}
console.log(JSON.stringify({passed:results.length,failed:0,assertions,results,scope:'Current actual two inherited comparator functions and compact feedback comparator. Exactly one guide root/descendants newly excluded, physical removal matches frozen v299 projections; prior hold/scope normalizations unchanged. All surrounding controls/attributes, similarly named nodes and detached descendants remain checked. No native browser claim.'},null,2));
