'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{loadGame}=require('./vm-environment.cjs'),adapter=require('./inherit-dom-v298.cjs'),previous=require('./inherit-dom-v297.cjs'),normalize=require('./hold-dom-normalization-v298.cjs');
const source=path.join(__dirname,'../index.html'),results=[];let assertions=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);assertions++},neq=(a,b,m)=>{assert.notDeepEqual(a,b,m);assertions++},test=(name,f)=>{f();results.push({name,passed:true})};
const roots=['holdBehaviorHint','rallyHoldBehaviorHint'],ids=['hold','holdOnArrival','rallyHold'],within=(e,p)=>{for(let n=e;n;n=n.parentNode)if(n===p)return true;return false};
const compile=s=>Function('assert','classNames','return ('+s+')')(assert,['hidden','active']);
const programs=Object.entries(adapter.programs).map(([name,e])=>({name,dom:compile(e.after),old:compile(previous.programs[name].after)}));
const extract=s=>Function('normalizeHoldAttributes','return ('+s.match(/const dom=(g=>[^\n]+);/)[1]+')')(normalize),frozen=f=>g=>JSON.parse(JSON.stringify(f(g)));
programs.push({name:'command-allocation-feedback',dom:frozen(extract(fs.readFileSync(path.join(__dirname,'command-allocation-feedback-v298.cjs'),'utf8'))),old:frozen(extract(fs.readFileSync(path.join(__dirname,'command-allocation-feedback-v297.cjs'),'utf8')))});
for(const{name,dom,old}of programs){
 test(name+' exact physical removal and attribute reversal',()=>{const g=loadGame(source).start(),expected=dom(g),panels=roots.map(id=>g.element(id)),excluded=g.elements.filter(e=>panels.some(p=>within(e,p)));eq(excluded.length,2,'only two leaf paragraphs');for(const id of ids){const e=g.element(id);e.attributes=normalize(id,e.attributes)}for(const p of panels)p.remove();g.elements.splice(0,g.elements.length,...g.elements.filter(e=>!excluded.includes(e)));eq(old(g),expected,'exact delta reverses to previous projection')});
 for(const id of roots){
  for(const [field,value]of [['textContent','different'],['hidden',true],['disabled',true]])test(name+' excluded '+id+' '+field,()=>{const g=loadGame(source).start(),before=dom(g);g.element(id)[field]=value;eq(dom(g),before,'only new paragraph ignored')});
  test(name+' wrong root id retained '+id,()=>{const g=loadGame(source).start(),before=dom(g);g.element(id).id+='Wrong';neq(dom(g),before,'renamed node retained')});
  test(name+' similarly named sibling retained '+id,()=>{const g=loadGame(source).start(),before=dom(g),e=g.document.createElement('p');e.id=id+'Other';g.element(id).parentNode.appendChild(e);neq(dom(g),before,'similar sibling retained')});
  test(name+' detached descendant retained '+id,()=>{const g=loadGame(source).start(),e=g.document.createElement('span');g.element(id).appendChild(e);const before=dom(g);e.remove();neq(dom(g),before,'detached descendant retained')});
 }
 for(const id of ids){
  test(name+' exact attribute normalization '+id,()=>{const g=loadGame(source).start(),before=dom(g),e=g.element(id);e.attributes=normalize(id,e.attributes);eq(dom(g),before,'exact new values normalize to original values')});
  for(const attr of ['title','aria-describedby','aria-label','data-boundary'])test(name+' unexpected '+id+' '+attr,()=>{const g=loadGame(source).start(),before=dom(g);g.element(id).setAttribute(attr,'unexpected value');neq(dom(g),before,'unreviewed attribute content remains visible')});
  for(const field of ['textContent','hidden','disabled','value',...(name==='command-allocation-feedback'?[]:['title'])])test(name+' retained '+id+' '+field,()=>{const g=loadGame(source).start(),before=dom(g),e=g.element(id);e[field]=typeof e[field]==='boolean'?!e[field]:'unexpected value';neq(dom(g),before,'existing control property retained')});
 }
 for(const id of ['stop','patrol','clearRally','guardArea','start','scenario'])for(const field of (id==='patrol'&&name!=='command-allocation-feedback'?['disabled']:['textContent','disabled']))test(name+' nearby '+id+' '+field,()=>{const g=loadGame(source).start(),before=dom(g),e=g.element(id);e[field]=field==='disabled'?!e[field]:'unexpected';neq(dom(g),before,'existing neighboring control retained')});
 test(name+' exact title outside control scope retained',()=>{const g=loadGame(source).start(),e=g.element('stop');e.setAttribute('title',g.element('hold').getAttribute('title'));const before=dom(g);e.removeAttribute('title');neq(dom(g),before,'only named controls normalize')});
}
for(const[name,e]of Object.entries(adapter.programs)){
 test(name+' strict original identity',()=>{const bytes=fs.readFileSync(path.join(__dirname,name));adapter.adapt(name,bytes);assert.throws(()=>adapter.adapt(name,Buffer.concat([bytes,Buffer.from('\n')])),{code:'ERR_ASSERTION'});assertions++});
 for(const id of roots)test(name+' duplicate root rejected '+id,()=>{const g=loadGame(source),n=g.document.createElement('p');n.id=id;g.element(id).parentNode.appendChild(n);assert.throws(()=>compile(e.after)(g),/unique added panel/);assertions++});
}
console.log(JSON.stringify({passed:results.length,failed:0,assertions,results,scope:'Exact two added hint paragraphs and exact reviewed per-control attribute-value reversal only. Three current comparator expressions tested against previous projections by physical reversal. Unknown values, neighboring controls, detached descendants, similar IDs and unrelated attributes remain visible; frozen original identities and duplicate-root guards retained.'},null,2));
