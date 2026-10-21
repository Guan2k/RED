'use strict';
const assert=require('node:assert/strict');
const keys=['build:power','build:refinery','build:factory','build:turret','unit:tank','unit:scout','unit:artillery','unit:repair','unit:harvester'];
function cards(g){
 const nodes=g.elements.filter(n=>n.dataset.unit||n.dataset.build);assert.equal(nodes.length,9,'exact nine live cards');const byKey=new Map();
 for(const n of nodes){assert.equal(n.tagName,'BUTTON','card remains a button');assert.ok(Boolean(n.dataset.unit)!==Boolean(n.dataset.build),'one card data identity');const key=n.dataset.unit?'unit:'+n.dataset.unit:'build:'+n.dataset.build;assert.ok(keys.includes(key),'known card identity '+key);assert.ok(!byKey.has(key),'unique card identity '+key);assert.ok(n.parentNode&&n.parentNode.children.filter(x=>x===n).length===1,'attached once '+key);byKey.set(key,n)}
 assert.equal(byKey.size,keys.length);
 for(const group of [keys.slice(0,4),keys.slice(4)]){const expected=group.map(k=>byKey.get(k)),parent=expected[0].parentNode;assert.equal(parent.tagName,'DIV');assert.ok(expected.every(n=>n.parentNode===parent),'same original card group');assert.ok(parent.children.length===expected.length&&parent.children.every((n,i)=>n===expected[i]),'exact original within-group card order')}
 assert.notEqual(byKey.get(keys[0]).parentNode,byKey.get(keys[4]).parentNode,'distinct construction and production groups');
 return keys.map(identity=>({n:byKey.get(identity),key:'title',kind:'card',identity}));
}
function snapshot(g){return cards(g).map(({n,key,kind,identity})=>({kind,key,identity,value:n[key],disabled:n.disabled,hidden:n.hidden,display:n.style.display,attributes:n.attributes}))}
module.exports={cards,snapshot,keys};
