'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),{loadGame}=require('./vm-environment.cjs'),adapter=require('./inherit-dom-v283.cjs'),previous=require('./inherit-dom-v282.cjs');
const source=path.join(__dirname,'../index.html'),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),sourceHash=hash(fs.readFileSync(source)),results=[];let assertions=0;
function equal(a,b,m){assert.deepEqual(a,b,m);assertions++}function different(a,b,m){assert.notDeepEqual(a,b,m);assertions++}function ok(a,m){assert.ok(a,m);assertions++}
for(const[name,entry]of Object.entries(adapter.programs)){
 const compile=text=>Function('assert','classNames','return ('+text+')')(assert,['hidden','active']),dom=compile(entry.after),oldDom=compile(previous.programs[name].after);
 {
  const g=loadGame(source,{seed:43801}).start(),button=g.element('selectAllFactories');ok(button&&button.parentNode,'new button exists in actual product tree');
  const child=g.document.createElement('span');child.id='allFactoriesBoundaryChild';button.appendChild(child);
  const nested=g.document.createElement('span');nested.id='allFactoriesBoundaryGrandchild';child.appendChild(nested);
  const projected=dom(g),old=oldDom(g),excluded=[button,child,nested];
  for(const e of excluded){ok(old.elements.some(x=>x.fields.id===e.id),'v282 projection includes new node '+e.id);ok(!projected.elements.some(x=>x.fields.id===e.id),'v283 projection excludes exact subtree node '+e.id)}
  for(const id of ['selectIdleFactories','repeatProduction','factoryRepeat','factoryRepeatTarget','patrol','stop'])equal(projected.elements.filter(x=>x.fields.id===id).length,1,'existing control remains '+id);
  const elements=[...g.elements],parent=button.parentNode,children=[...parent.children];
  button.remove();g.elements.splice(0,g.elements.length,...elements.filter(e=>!excluded.includes(e)));
  equal(oldDom(g),projected,'v283 equals v282 after physical removal of only the new subtree and index rebuild');
  g.elements.splice(0,g.elements.length,...elements);parent.children.splice(0,parent.children.length,...children);button.parentNode=parent;
  equal(dom(g),projected,'restored source tree has identical v283 projection');
  results.push({name:name+': direct new subtree removal',program:name,passed:true});
 }
 for(const[label,mutate,ignored]of [
  ['new button text',g=>g.element('selectAllFactories').textContent='changed new label',true],
  ['new button disabled',g=>g.element('selectAllFactories').disabled=!g.element('selectAllFactories').disabled,true],
  ['new button attributes',g=>g.element('selectAllFactories').setAttribute('data-boundary','changed'),true],
  ['new button child',g=>g.element('selectAllFactories').appendChild(g.document.createElement('span')),true],
  ['new button removal',g=>g.element('selectAllFactories').remove(),true],
  ['idle factory label retained',g=>g.element('selectIdleFactories').textContent='wrong idle label',false],
  ['idle factory disabled retained',g=>g.element('selectIdleFactories').disabled=!g.element('selectIdleFactories').disabled,false],
  ['idle factory attribute retained',g=>g.element('selectIdleFactories').setAttribute('data-boundary','changed'),false],
  ['idle factory removal retained',g=>g.element('selectIdleFactories').remove(),false],
  ['global disabled retained',g=>g.element('repeatProduction').disabled=!g.element('repeatProduction').disabled,false],
  ['global value retained',g=>g.element('repeatProduction').value='tank',false],
  ['global unrelated attribute retained',g=>g.element('repeatProduction').setAttribute('data-boundary','changed'),false],
  ['factory local value retained',g=>g.element('factoryRepeat').value='tank',false],
  ['factory local label retained',g=>g.element('factoryRepeat').setAttribute('aria-label','wrong local label'),false],
  ['patrol disabled retained',g=>g.element('patrol').disabled=!g.element('patrol').disabled,false],
  ['stop label retained',g=>g.element('stop').textContent='wrong stop',false],
  ['unrelated descendant retained',g=>g.element('stop').appendChild(g.document.createElement('span')),false],
  ['existing active element retained',g=>g.element('stop').focus(),false],
  ['document visibility retained',g=>g.document.hidden=!g.document.hidden,false]
 ]){const g=loadGame(source,{seed:43801}).start(),before=dom(g);mutate(g);if(ignored)equal(dom(g),before,label);else different(dom(g),before,label);results.push({name:name+': '+label,program:name,label,ignored,passed:true})}
 {
  const g=loadGame(source,{seed:43801}).start(),duplicate=g.document.createElement('button');duplicate.id='selectAllFactories';g.element('selectAllFactories').parentNode.appendChild(duplicate);assert.throws(()=>dom(g),/unique added panel/);assertions++;results.push({name:name+': duplicate new ID rejected',program:name,passed:true});
 }
}
equal(hash(fs.readFileSync(source)),sourceHash,'product source unchanged');
console.log(JSON.stringify({passed:results.length,failed:0,assertions,results,scope:'Only selectAllFactories and its descendants are additionally excluded from the frozen v282 DOM projection. Physical removal is compared directly with the old projection, including rebuilt indexes. Existing idle-factory/global/local/patrol/stop controls, unrelated attributes and descendants, active element and document visibility remain compared. Original packaged programs are hash-locked and unmodified. Excluded button behavior is covered by the separate all-factories suite.'},null,2));
