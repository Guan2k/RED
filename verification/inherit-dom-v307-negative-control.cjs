'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{loadGame}=require('./vm-environment.cjs'),adapter=require('./inherit-dom-v307.cjs'),previous=require('./inherit-dom-v305.cjs'),normalize=require('./hold-dom-normalization-v307.cjs');
const source=path.join(__dirname,'../index.html'),results=[],compile=s=>Function('assert','classNames','return ('+s+')')(assert,['hidden','active']);
const programs=Object.entries(adapter.programs).map(([name,e])=>({name,dom:compile(e.after),old:compile(previous.programs[name].after)}));
const extract=s=>Function('normalizeHoldAttributes','return ('+s.match(/const dom=(g=>[^\n]+);/)[1]+')')(normalize),plain=f=>g=>JSON.parse(JSON.stringify(f(g)));
programs.push({name:'command-allocation',dom:plain(extract(fs.readFileSync(path.join(__dirname,'command-allocation-feedback-v307.cjs'),'utf8'))),old:plain(extract(fs.readFileSync(path.join(__dirname,'command-allocation-feedback-v305.cjs'),'utf8')))});
const guideProjection=version=>{const text=fs.readFileSync(path.join(__dirname,'beginner-guide-'+version+'.cjs'),'utf8'),body=text.slice(text.indexOf('function retainedDom('),text.indexOf('const world ='));const fn=Function('check','return ('+body+')')((x,m)=>assert.ok(x,m));return g=>fn(g,true)};
programs.push({name:'beginner-guide',dom:guideProjection('v307'),old:guideProjection('v305')});
function test(name,fn){fn();results.push({name,passed:true})}
for(const {name,dom,old}of programs){
 test(name+' physically remove exact four nodes equals previous projection',()=>{const g=loadGame(source).start(),expected=dom(g),nodes=['power','refinery','factory','turret'].map(t=>g.element('buildReason'+t));for(const n of nodes)n.remove();g.elements.splice(0,g.elements.length,...g.elements.filter(n=>!nodes.includes(n)));assert.deepEqual(old(g),expected)});
 for(const type of ['power','refinery','factory','turret']){
  test(name+' reason text excluded '+type,()=>{const g=loadGame(source).start(),before=dom(g);g.element('buildReason'+type).textContent='different';assert.deepEqual(dom(g),before)});
  for(const mode of ['rename','detach','wrong parent','descendant','sibling','wrong tag'])test(name+' retained '+mode+' '+type,()=>{const g=loadGame(source).start(),before=dom(g),n=g.element('buildReason'+type);if(mode==='rename')n.id+='Wrong';if(mode==='detach')n.remove();if(mode==='wrong parent')g.document.body.appendChild(n);if(mode==='descendant')n.appendChild(g.document.createElement('b'));if(mode==='sibling'){const x=g.document.createElement('span');x.id=n.id+'Other';n.parentNode.appendChild(x)}if(mode==='wrong tag')n.tagName='DIV';assert.notDeepEqual(dom(g),before)});
  test(name+' original button retained '+type,()=>{const g=loadGame(source).start(),before=dom(g),b=g.element('buildReason'+type).parentNode;b.disabled=!b.disabled;assert.notDeepEqual(dom(g),before)});
 }
}
for(const[name,e]of Object.entries(adapter.programs))test(name+' original identity lock',()=>{const bytes=fs.readFileSync(path.join(__dirname,name));adapter.adapt(name,bytes);assert.throws(()=>adapter.adapt(name,Buffer.concat([bytes,Buffer.from('\n')])),{code:'ERR_ASSERTION'})});
console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Only four correctly named SPAN nodes under their matching build-card parents excluded. Existing nodes, descendants, detached/renamed/wrong-parent/wrong-tag/similar siblings remain visible; frozen program identity retained.'},null,2));
