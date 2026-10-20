'use strict';
// Independently authored boundary probes. Expected equivalence uses physical
// deletion followed by the frozen v312 comparators, not a second predicate.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {loadGame}=require('./vm-environment.cjs'),adapter=require('./inherit-dom-v313.cjs'),previous=require('./inherit-dom-v312.cjs');
const source=path.join(__dirname,'../index.html'),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),sourceHash=hash(fs.readFileSync(source)),results=[];
const compile=text=>Function('assert','classNames','return ('+text+')')(assert,['hidden','active']);
const plain=fn=>g=>JSON.parse(JSON.stringify(fn(g)));
const programs=Object.entries(adapter.programs).map(([name,e])=>({name,dom:compile(e.after),old:compile(previous.programs[name].after)}));
function allocation(version){const text=fs.readFileSync(path.join(__dirname,'command-allocation-feedback-'+version+'.cjs'),'utf8');return plain(Function('normalizeHoldAttributes','return ('+text.match(/const dom=(g=>[^\n]+);/)[1]+')')(require('./hold-dom-normalization-v312.cjs')))}
function beginner(version){const text=fs.readFileSync(path.join(__dirname,'beginner-guide-'+version+'.cjs'),'utf8'),body=text.slice(text.indexOf('function retainedDom('),text.indexOf('const world ='));return Function('check','return ('+body+')')((x,m)=>assert.ok(x,m))}
const guide=beginner('v313'),oldGuide=beginner('v312');
programs.push({name:'command-allocation',dom:allocation('v313'),old:allocation('v312')},{name:'beginner-guide',dom:g=>guide(g,true),old:g=>oldGuide(g,true)});
function test(name,fn){try{fn()}catch(error){error.message=name+': '+error.message;throw error}results.push({name,passed:true})}
function fixture(){const g=loadGame(source).start();for(const id of ['selectRefineryMiners','refineryMinerSelectionHelp']){const child=g.document.createElement('span');child.textContent='independent nested fixture';g.element(id).appendChild(child);const grandchild=g.document.createElement('b');grandchild.textContent='nested leaf';child.appendChild(grandchild)}return g}
function removeNewRoots(g){const removed=new Set();function collect(n){removed.add(n);for(const child of n.children)collect(child)}for(const id of ['selectRefineryMiners','refineryMinerSelectionHelp']){const root=g.element(id);collect(root);root.remove()}g.elements.splice(0,g.elements.length,...g.elements.filter(n=>!removed.has(n)));assert.equal(removed.size,6)}
for(const {name,dom,old} of programs){
 test(name+' physical removal exactly equals v312 comparator',()=>{const g=fixture(),expected=dom(g);removeNewRoots(g);assert.deepEqual(old(g),expected)});
 for(const id of ['selectRefineryMiners','refineryMinerSelectionHelp']){
  test(name+' excludes only valid '+id+' subtree',()=>{const g=fixture(),before=dom(g),n=g.element(id);n.textContent='new';n.disabled=!n.disabled;n.style.color='red';n.dataset.changed='yes';n.attributes.title='changed';n.children[0].children[0].textContent='changed descendant';n.appendChild(g.document.createElement('i'));assert.deepEqual(dom(g),before)});
  const changes={
   'renamed root':(g,n)=>{n.id+='Other'},
   'incorrect root tag':(g,n)=>{n.tagName='SECTION'},
   'detached root':(g,n)=>n.remove(),
   'wrong parent':(g,n)=>g.document.body.appendChild(n),
   'nested non-direct root':(g,n)=>{const wrap=g.document.createElement('div');n.parentNode.appendChild(wrap);wrap.appendChild(n)},
   'duplicate root':(g,n)=>{const copy=g.document.createElement(n.tagName);copy.id=n.id;n.parentNode.appendChild(copy)},
   'detached duplicate root':(g,n)=>{const copy=g.document.createElement(n.tagName);copy.id=n.id},
   'inconsistent root attachment':(g,n)=>{n.parentNode.children.splice(n.parentNode.children.indexOf(n),1)},
   'duplicate attachment':(g,n)=>n.parentNode.children.push(n),
   'similarly named sibling':(g,n)=>{const copy=g.document.createElement(n.tagName);copy.id=n.id+'Other';n.parentNode.appendChild(copy)},
   'detached descendant':(g,n)=>n.children[0].remove(),
   'detached grandchild':(g,n)=>n.children[0].children[0].remove(),
   'moved descendant':(g,n)=>g.document.body.appendChild(n.children[0]),
   'inconsistent descendant attachment':(g,n)=>{n.children.splice(0,1)}
  };
  for(const [label,change] of Object.entries(changes))test(name+' retains '+id+' '+label,()=>{const g=fixture(),before=dom(g);change(g,g.element(id));assert.notDeepEqual(dom(g),before)});
 }
 for(const [label,change]of Object.entries({
  'wrong overview tag':(g,p)=>{p.tagName='DIV'},
  'renamed overview':(g,p)=>{p.id+='Other'},
  'detached overview':(g,p)=>p.remove(),
  'duplicate overview':(g,p)=>{const copy=g.document.createElement('details');copy.id=p.id;g.document.body.appendChild(copy)},
  'inconsistent overview attachment':(g,p)=>{p.parentNode.children.splice(p.parentNode.children.indexOf(p),1)},
  'old overview attributes':(g,p)=>{p.attributes.open=''},
  'old overview style':(g,p)=>{p.style.color='red'},
  'old work text':g=>{g.element('harvesterFleetWork').textContent+=' changed'},
  'old work phase control':g=>{g.element('harvesterWorkPhase').value='changed'},
  'old phase selection control':g=>{g.element('selectHarvesterWorkPhase').disabled=!g.element('selectHarvesterWorkPhase').disabled},
  'old mining help':g=>{g.element('harvesterWorkSelectionHelp').textContent+=' changed'},
  'unrelated button':(g,p)=>{const n=g.document.createElement('button');n.id='otherMiningAction';p.appendChild(n)}
 }))test(name+' retains '+label,()=>{const g=fixture(),before=dom(g);change(g,g.element('harvesterFleetOverview'));assert.notDeepEqual(dom(g),before)});
 // Prior exclusions must continue to be bounded, not swallowed by the new rule.
 for(const id of ['vehicleReferenceGallery','buildingReferenceGallery']){
  test(name+' keeps prior exact gallery '+id,()=>{const g=fixture(),before=dom(g);g.element(id).children[0].textContent='prior gallery change';assert.deepEqual(dom(g),before)});
  test(name+' keeps prior detached gallery descendant '+id,()=>{const g=fixture(),before=dom(g);g.element(id).children[0].remove();assert.notDeepEqual(dom(g),before)});
 }
 test(name+' keeps old purchase control observable',()=>{const g=fixture(),before=dom(g),n=g.elements.find(n=>n.dataset.unit==='tank');n.disabled=!n.disabled;assert.notDeepEqual(dom(g),before)});
}
test('beginner unprojected comparator remains exact v312',()=>{const g=fixture();assert.deepEqual(guide(g),oldGuide(g));assert.deepEqual(guide(g,false),oldGuide(g,false));for(const id of ['selectRefineryMiners','refineryMinerSelectionHelp']){const before=guide(g);g.element(id).textContent+=' changed';assert.notDeepEqual(guide(g),before);assert.deepEqual(guide(g),oldGuide(g))}});
for(const [name,e]of Object.entries(adapter.programs))test(name+' frozen identity and rejection',()=>{const bytes=fs.readFileSync(path.join(__dirname,name));assert.equal(e.originalSha256,previous.programs[name].originalSha256);adapter.adapt(name,bytes);assert.throws(()=>adapter.adapt(name,Buffer.concat([bytes,Buffer.from('\n')])),{code:'ERR_ASSERTION'})});
test('runtime source identity unchanged',()=>assert.equal(hash(fs.readFileSync(source)),sourceHash));
console.log(JSON.stringify({passed:results.length,failed:0,sourceSha256:sourceHash,results,scope:'Exact unique attached BUTTON#selectRefineryMiners and P#refineryMinerSelectionHelp subtrees under unique DETAILS#harvesterFleetOverview only. Independent malformed-root, parent, attachment and detached-descendant boundaries; physical deletion equivalence against all four frozen v312 comparators; unprojected beginner comparator and existing gallery boundaries preserved.'},null,2));
