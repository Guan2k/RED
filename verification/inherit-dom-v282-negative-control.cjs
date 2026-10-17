'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{loadGame}=require('./vm-environment.cjs'),adapter=require('./inherit-dom-v282.cjs');const results=[];
for(const[name,entry]of Object.entries(adapter.programs)){
 const dom=Function('assert','classNames','return ('+entry.after+')')(assert,['hidden','active']);
 for(const[label,mutate,ignored]of [
 ['new fixed hint',g=>g.element('globalRepeatScopeHint').textContent='new scope',true],
 ['global aria label',g=>g.element('repeatProduction').setAttribute('aria-label','other label'),true],
 ['global title',g=>g.element('repeatProduction').setAttribute('title','other tooltip'),true],
 ['global description link',g=>g.element('repeatProduction').setAttribute('aria-describedby','other link'),true],
 ['global disabled retained',g=>g.element('repeatProduction').disabled=!g.element('repeatProduction').disabled,false],
 ['global value retained',g=>g.element('repeatProduction').value='tank',false],
 ['unrelated attribute retained',g=>g.element('repeatProduction').setAttribute('data-unrelated','wrong'),false],
 ['local control label retained',g=>g.element('factoryRepeat').setAttribute('aria-label','wrong'),false]
 ]){const g=loadGame(path.join(__dirname,'../index.html'),{seed:43801}).start(),before=dom(g);mutate(g);if(ignored)assert.deepEqual(dom(g),before,label);else assert.notDeepEqual(dom(g),before,label);results.push({program:name,label,ignored,passed:true})}
}
console.log(JSON.stringify({passed:results.length,failed:0,assertions:results.length,results,scope:'Only new global scope hint subtree and repeatProduction aria-label/title/aria-describedby are additionally excluded. Disabled, value, unrelated attributes and local factory controls remain compared; direct new tests cover all excluded fields.'},null,2));
