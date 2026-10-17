'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),{loadGame}=require('./vm-environment.cjs'),adapter=require('./inherit-dom-v289.cjs'),previous=require('./inherit-dom-v283.cjs');
const source=path.join(__dirname,'../index.html'),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),sourceHash=hash(fs.readFileSync(source)),results=[];let assertions=0;
function equal(a,b,m){assert.deepEqual(a,b,m);assertions++}function different(a,b,m){assert.notDeepEqual(a,b,m);assertions++}function ok(a,m){assert.ok(a,m);assertions++}
function within(node,root){for(let n=node;n;n=n.parentNode)if(n===root)return true;return false}
for(const[name,entry]of Object.entries(adapter.programs)){
 const compile=text=>Function('assert','classNames','return ('+text+')')(assert,['hidden','active']),dom=compile(entry.after),oldDom=compile(previous.programs[name].after);
 equal(entry.after.replaceAll("'selectAllFactories','openingPractice']","'selectAllFactories']"),previous.programs[name].after,'the entire previous projection is retained except the exact new root');
 {
  const g=loadGame(source,{seed:43801}).start(),panel=g.element('openingPractice');ok(panel&&panel.parentNode,'new panel exists in actual product tree');equal(panel.tagName,'DETAILS','new root is details');
  const child=g.document.createElement('span');child.id='openingPracticeBoundaryChild';panel.appendChild(child);
  const nested=g.document.createElement('span');nested.id='openingPracticeBoundaryGrandchild';child.appendChild(nested);
  const projected=dom(g),old=oldDom(g),excluded=g.elements.filter(e=>within(e,panel));
  ok(excluded.length>=9,'actual complete panel plus synthetic descendants');
  for(const e of excluded){ok(old.elements.some(x=>x.fields.id===e.id),'v283 projection includes new node '+e.id);ok(!projected.elements.some(x=>x.fields.id===e.id),'v289 projection excludes exact subtree node '+e.id)}
  for(const id of ['guide','selectIdleFactories','repeatProduction','factoryRepeat','factoryRepeatTarget','patrol','stop','battleReport'])equal(projected.elements.filter(x=>x.fields.id===id).length,1,'existing node remains '+id);
  const elements=[...g.elements],parent=panel.parentNode,children=[...parent.children];
  panel.remove();g.elements.splice(0,g.elements.length,...elements.filter(e=>!excluded.includes(e)));
  equal(oldDom(g),projected,'v289 equals v283 after physical removal of only openingPractice and descendants with rebuilt indexes');
  g.elements.splice(0,g.elements.length,...elements);parent.children.splice(0,parent.children.length,...children);panel.parentNode=parent;
  equal(dom(g),projected,'restored source tree has identical v289 projection');
  results.push({name:name+': direct full subtree removal',program:name,excludedIds:excluded.map(e=>e.id),passed:true});
 }
 const mutations=[
  ...['openingPracticeSummary','openingPracticeHarvest','openingPracticeProduction','openingPracticeCapture','openingPracticeStatus','openingPracticeNote'].map(id=>[id+' text',g=>g.element(id).textContent='changed text',true]),
  ['new panel open',g=>g.element('openingPractice').open=!g.element('openingPractice').open,true],
  ['new panel hidden',g=>g.element('openingPractice').hidden=!g.element('openingPractice').hidden,true],
  ['new panel disabled',g=>g.element('openingPractice').disabled=!g.element('openingPractice').disabled,true],
  ['new panel accessible association',g=>g.element('openingPractice').setAttribute('aria-describedby','changed-association'),true],
  ['new paragraph live attribute',g=>g.element('openingPracticeHarvest').setAttribute('aria-live','assertive'),true],
  ['new panel other attributes',g=>g.element('openingPractice').setAttribute('data-boundary','changed'),true],
  ['new panel dataset',g=>g.element('openingPractice').dataset.boundary='changed',true],
  ['new panel style',g=>g.element('openingPractice').style.display='none',true],
  ['new panel class',g=>g.element('openingPractice').classList.add('active'),true],
  ['new panel primitive',g=>g.element('openingPractice').boundaryValue=42,true],
  ['new panel child',g=>g.element('openingPractice').appendChild(g.document.createElement('span')),true],
  ['new panel removal',g=>g.element('openingPractice').remove(),true],
  ['new panel wrong ID retained',g=>g.element('openingPractice').id='openingPracticeWrong',false],
  ['former child detached retained',g=>g.element('openingPracticeSummary').remove(),false],
  ['similarly named sibling retained',g=>{const p=g.element('openingPractice').parentNode,n=g.document.createElement('p');n.id='openingPracticeUnrelated';p.appendChild(n)},false],
  ['guide text retained',g=>g.element('guide').textContent='wrong guide',false],
  ['guide hidden retained',g=>g.element('guide').hidden=!g.element('guide').hidden,false],
  ['guide attributes retained',g=>g.element('guide').setAttribute('aria-live','assertive'),false],
  ['guide style retained',g=>g.element('guide').style.display='none',false],
  ['guide child retained',g=>g.element('guide').appendChild(g.document.createElement('span')),false],
  ['guide removal retained',g=>g.element('guide').remove(),false],
  ['idle factory label retained',g=>g.element('selectIdleFactories').textContent='wrong idle label',false],
  ['idle factory disabled retained',g=>g.element('selectIdleFactories').disabled=!g.element('selectIdleFactories').disabled,false],
  ['global disabled retained',g=>g.element('repeatProduction').disabled=!g.element('repeatProduction').disabled,false],
  ['global value retained',g=>g.element('repeatProduction').value='tank',false],
  ['global unrelated attribute retained',g=>g.element('repeatProduction').setAttribute('data-boundary','changed'),false],
  ['factory local value retained',g=>g.element('factoryRepeat').value='tank',false],
  ['factory local label retained',g=>g.element('factoryRepeat').setAttribute('aria-label','wrong local label'),false],
  ['patrol disabled retained',g=>g.element('patrol').disabled=!g.element('patrol').disabled,false],
  ['stop label retained',g=>g.element('stop').textContent='wrong stop',false],
  ['existing report open retained',g=>g.element('battleReport').open=!g.element('battleReport').open,false],
  ['existing report hidden retained',g=>g.element('battleReport').hidden=!g.element('battleReport').hidden,false],
  ['existing active element retained',g=>g.element('stop').focus(),false],
  ['document visibility retained',g=>g.document.hidden=!g.document.hidden,false]
 ];
 for(const[label,mutate,ignored]of mutations){const g=loadGame(source,{seed:43801}).start(),before=dom(g);mutate(g);if(ignored)equal(dom(g),before,label);else different(dom(g),before,label);results.push({name:name+': '+label,program:name,label,ignored,passed:true})}
 {
  const g=loadGame(source,{seed:43801}).start(),duplicate=g.document.createElement('details');duplicate.id='openingPractice';g.element('openingPractice').parentNode.appendChild(duplicate);assert.throws(()=>dom(g),/unique added panel/);assertions++;results.push({name:name+': duplicate new ID rejected',program:name,passed:true});
 }
 const original=fs.readFileSync(path.join(__dirname,name));equal(hash(adapter.adapt(name,original)),entry.adaptedSha256,'exact temporary adapter hash');assert.throws(()=>adapter.adapt(name,Buffer.concat([original,Buffer.from('\n')])),{code:'ERR_ASSERTION'});assertions++;
}
assert.throws(()=>adapter.adapt('unapproved.cjs',''),{code:'ERR_ASSERTION'});assertions++;
equal(hash(fs.readFileSync(source)),sourceHash,'product source unchanged');
console.log(JSON.stringify({passed:results.length,failed:0,assertions,results,scope:'Only openingPractice and its exact descendants are additionally excluded from the frozen v283 DOM projection. Full physical subtree removal is directly compared with the old projection after index rebuilding. No additional primitive, attribute, style, dataset, class, focus or document fields are ignored. Tests cover the six named panel texts and subtree field changes, duplicate root rejection, detached former descendants, similarly named siblings, guide and existing control/report/focus/visibility differences. Separate opening-practice positive and mutation suites directly verify the displayed subtree.'},null,2));
