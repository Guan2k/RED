'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{loadGame}=require('./vm-environment.cjs'),adapter=require('./inherit-dom-v310.cjs'),previous=require('./inherit-dom-v309.cjs'),normalize=require('./hold-dom-normalization-v309.cjs');
const source=path.join(__dirname,'../index.html'),results=[],hash=x=>crypto.createHash('sha256').update(x).digest('hex'),sourceHash=hash(fs.readFileSync(source)),compile=s=>Function('assert','classNames','return ('+s+')')(assert,['hidden','active']);
const programs=Object.entries(adapter.programs).map(([name,e])=>({name,dom:compile(e.after),old:compile(previous.programs[name].after)}));
const extract=s=>Function('normalizeHoldAttributes','return ('+s.match(/const dom=(g=>[^\n]+);/)[1]+')')(normalize),plain=f=>g=>JSON.parse(JSON.stringify(f(g)));
programs.push({name:'command-allocation',dom:plain(extract(fs.readFileSync(path.join(__dirname,'command-allocation-feedback-v310.cjs'),'utf8'))),old:plain(extract(fs.readFileSync(path.join(__dirname,'command-allocation-feedback-v309.cjs'),'utf8')))});
const guideFunction=version=>{const text=fs.readFileSync(path.join(__dirname,'beginner-guide-'+version+'.cjs'),'utf8'),body=text.slice(text.indexOf('function retainedDom('),text.indexOf('const world ='));return Function('check','return ('+body+')')((x,m)=>assert.ok(x,m))};
const guide=guideFunction('v310'),oldGuide=guideFunction('v309');programs.push({name:'beginner-guide',dom:g=>guide(g,true),old:g=>oldGuide(g,true)});
function test(name,fn){try{fn()}catch(error){error.message=name+': '+error.message;throw error}results.push({name,passed:true})}
function removeGallery(g){const root=g.element('buildingReferenceGallery'),removed=new Set();const visit=n=>{removed.add(n);n.children.forEach(visit)};visit(root);root.remove();g.elements.splice(0,g.elements.length,...g.elements.filter(n=>!removed.has(n)));return removed}
for(const{name,dom,old}of programs){
 test(name+' physical subtree removal equals exact v309 projection',()=>{const g=loadGame(source).start(),expected=dom(g),removed=removeGallery(g);assert.ok(removed.size>10);assert.deepEqual(old(g),expected)});
 test(name+' exact gallery descendants excluded',()=>{const g=loadGame(source).start(),before=dom(g),root=g.element('buildingReferenceGallery');root.dataset.preview='changed';root.children[0].textContent='changed static hint';root.children.at(-1).appendChild(g.document.createElement('span'));assert.deepEqual(dom(g),before)});
 const mutations={
  'renamed root':g=>{g.element('buildingReferenceGallery').id+='Other'},
  'wrong root tag':g=>{g.element('buildingReferenceGallery').tagName='SECTION'},
  'detached root':g=>g.element('buildingReferenceGallery').remove(),
  'wrong parent':g=>g.document.body.appendChild(g.element('buildingReferenceGallery')),
  'nested rather than direct child':g=>{const w=g.document.createElement('div');g.element('unitReference').appendChild(w);w.appendChild(g.element('buildingReferenceGallery'))},
  'wrong parent tag':g=>{g.element('unitReference').tagName='DIV'},
  'renamed parent':g=>{g.element('unitReference').id+='Other'},
  'detached parent':g=>g.element('unitReference').remove(),
  'duplicate exact root':g=>{const n=g.document.createElement('div');n.id='buildingReferenceGallery';g.element('unitReference').appendChild(n)},
  'duplicate reference parent':g=>{const n=g.document.createElement('details');n.id='unitReference';g.document.body.appendChild(n)},
  'inconsistent root attachment':g=>{const n=g.element('buildingReferenceGallery');n.parentNode.children.splice(n.parentNode.children.indexOf(n),1)},
  'similarly named sibling':g=>{const n=g.document.createElement('div');n.id='buildingReferenceGalleryOther';g.element('unitReference').appendChild(n)},
  'detached descendant':g=>g.element('buildingReferenceGallery').children[0].remove(),
  'old reference text':g=>{g.element('unitReferenceText').textContent+=' changed'},
  'old reference summary':g=>{g.element('unitReference').children.find(n=>n.tagName==='SUMMARY').textContent='changed'},
  'old reference hint':g=>{g.element('unitReference').children.find(n=>n.tagName==='P').textContent='changed'},
  'old reference details attributes':g=>{g.element('unitReference').attributes.open=''},
  'old purchase control':g=>{const n=g.elements.find(n=>n.dataset.unit==='tank');n.disabled=!n.disabled},
  'unrelated style':g=>{g.element('unitReferenceText').style.color='red'}
 };
 for(const[label,mutate]of Object.entries(mutations))test(name+' retains '+label,()=>{const g=loadGame(source).start(),before=dom(g);mutate(g);assert.notDeepEqual(dom(g),before)});
 test(name+' preserves exact v309 vehicle gallery projection',()=>{const g=loadGame(source).start(),before=dom(g),n=g.element('vehicleReferenceGallery');n.dataset.preview='changed';n.children[0].textContent='changed vehicle hint';n.appendChild(g.document.createElement('svg'));assert.deepEqual(dom(g),before)});
 for(const mode of ['rename','wrong tag','detach','wrong parent','duplicate','detached descendant','attachment'])test(name+' preserves v309 vehicle negative '+mode,()=>{const g=loadGame(source).start(),before=dom(g),n=g.element('vehicleReferenceGallery');if(mode==='rename')n.id+='Other';if(mode==='wrong tag')n.tagName='SECTION';if(mode==='detach')n.remove();if(mode==='wrong parent')g.document.body.appendChild(n);if(mode==='duplicate'){const x=g.document.createElement('div');x.id=n.id;g.element('unitReference').appendChild(x)}if(mode==='detached descendant')n.children[0].remove();if(mode==='attachment')n.parentNode.children.splice(n.parentNode.children.indexOf(n),1);assert.notDeepEqual(dom(g),before)});
 test(name+' unrelated SVG remains observable',()=>{const g=loadGame(source).start(),before=dom(g);g.element('unitReference').appendChild(g.document.createElement('svg'));assert.notDeepEqual(dom(g),before)});
 for(const type of ['power','refinery','factory','turret']){
  test(name+' retains v306 exact reason exclusion '+type,()=>{const g=loadGame(source).start(),before=dom(g);g.element('buildReason'+type).textContent='changed';assert.deepEqual(dom(g),before)});
  for(const mode of ['rename','detach','wrong parent','descendant','sibling','wrong tag','old button'])test(name+' retains v306 negative '+mode+' '+type,()=>{const g=loadGame(source).start(),before=dom(g),n=g.element('buildReason'+type);if(mode==='rename')n.id+='Wrong';if(mode==='detach')n.remove();if(mode==='wrong parent')g.document.body.appendChild(n);if(mode==='descendant')n.appendChild(g.document.createElement('b'));if(mode==='sibling'){const x=g.document.createElement('span');x.id=n.id+'Other';n.parentNode.appendChild(x)}if(mode==='wrong tag')n.tagName='DIV';if(mode==='old button')n.parentNode.disabled=!n.parentNode.disabled;assert.notDeepEqual(dom(g),before)});
 }
}
test('beginner unprojected comparator exactly unchanged',()=>{const g=loadGame(source).start();assert.deepEqual(guide(g),oldGuide(g));assert.deepEqual(guide(g,false),oldGuide(g,false));const before=guide(g);g.element('buildingReferenceGallery').dataset.preview='changed';assert.notDeepEqual(guide(g),before)});
for(const[name,e]of Object.entries(adapter.programs))test(name+' historical original identity lock',()=>{const bytes=fs.readFileSync(path.join(__dirname,name));assert.equal(e.originalSha256,previous.programs[name].originalSha256);adapter.adapt(name,bytes);assert.throws(()=>adapter.adapt(name,Buffer.concat([bytes,Buffer.from('\n')])),{code:'ERR_ASSERTION'})});
test('frozen product source untouched',()=>assert.equal(hash(fs.readFileSync(source)),sourceHash));
console.log(JSON.stringify({passed:results.length,failed:0,sourceSha256:sourceHash,results,scope:'Exact attached DIV#buildingReferenceGallery under unique DETAILS#unitReference and its subtree only, verified against physical removal plus v309 projection. Invalid roots, detached descendants, old reference text/summary/controls and unrelated styles remain observable. v309 vehicle gallery projection and v306 reason projection, frozen historical identity locks, and unprojected beginner comparator retained. No CSS stripping.'},null,2));
