'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{loadGame}=require('./vm-environment.cjs'),adapter=require('./inherit-dom-v281.cjs');let assertions=0;const results=[];
for(const [name,entry]of Object.entries(adapter.programs)){
 const dom=Function('assert','classNames','return ('+entry.after+')')(assert,['hidden','active']);
 const source=path.join(__dirname,'../index.html');
 for(const [label,mutate,ignored]of [
  ['new hint content only',g=>g.element('patrolActionHint').textContent='changed hint',true],
  ['intentional patrol label',g=>g.element('patrol').textContent='changed action preview',true],
  ['intentional patrol aria association',g=>g.element('patrol').setAttribute('aria-describedby','changed-association'),true],
  ['intentional patrol title',g=>g.element('patrol').title='changed title',true],
  ['patrol disabled retained',g=>g.element('patrol').disabled=!g.element('patrol').disabled,false],
  ['unrelated button label retained',g=>g.element('stop').textContent='wrong stop',false],
  ['patrol other attributes retained',g=>g.element('patrol').setAttribute('data-unrelated','changed'),false],
  ['unrelated child structure retained',g=>g.element('stop').remove(),false]
 ]){const g=loadGame(source,{seed:43801}).start(),before=dom(g);mutate(g);if(ignored)assert.deepEqual(dom(g),before,label);else assert.notDeepEqual(dom(g),before,label);assertions++;results.push({program:name,label,ignored,passed:true})}
}
console.log(JSON.stringify({passed:results.length,failed:0,assertions,results,scope:'The v281 inherited DOM projection omits only the added hint subtree and patrol textContent/title/aria-describedby in addition to the prior four panels and marked detached options. Disabled state, other attributes, unrelated controls and DOM structure remain compared. Packaged original tests remain unchanged.'},null,2));
