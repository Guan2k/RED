'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{loadGame}=require('./vm-environment.cjs'),{cards,snapshot}=require('./card-field-targets-v317.cjs');
const source=path.join(__dirname,'../index.html'),fresh=()=>loadGame(source,{seed:31707}),plain=x=>JSON.parse(JSON.stringify(x)),results=[];
function test(name,fn){fn();results.push({name,passed:true})}
const baseline=plain(snapshot(fresh()));
test('exact inventory and actual live identities retained',()=>{const g=fresh(),targets=cards(g);assert.equal(targets.length,9);assert.equal(new Set(targets.map(t=>t.n)).size,9);assert.ok(targets.every(t=>g.elements.includes(t.n)));assert.deepEqual(plain(snapshot(g)),baseline)});
for(const [name,mutate]of [
 ['wrong card title',n=>n.title='wrong'],['wrong disabled state',n=>n.disabled=!n.disabled],['wrong hidden state',n=>n.hidden=!n.hidden],['wrong display state',n=>n.style.display='none'],['wrong original data attribute',n=>n.attributes['data-unit']='repair'],['extra card attribute',n=>n.attributes['aria-label']='wrong']
])test(name+' is observable',()=>{const g=fresh(),n=g.elements.find(n=>n.dataset.unit==='tank');mutate(n);assert.notDeepEqual(plain(snapshot(g)),baseline)});
for(const [name,mutate]of [
 ['missing card',g=>g.elements.splice(g.elements.findIndex(n=>n.dataset.unit==='tank'),1)],
 ['duplicate card',g=>g.elements.push(g.elements.find(n=>n.dataset.unit==='tank'))],
 ['duplicate semantic key',g=>g.elements.find(n=>n.dataset.unit==='scout').dataset.unit='tank'],
 ['unknown semantic key',g=>g.elements.find(n=>n.dataset.unit==='tank').dataset.unit='unknown'],
 ['both card kinds',g=>g.elements.find(n=>n.dataset.unit==='tank').dataset.build='power'],
 ['within-group order changed',g=>{const p=g.elements.find(n=>n.dataset.unit==='tank').parentNode;[p.children[0],p.children[1]]=[p.children[1],p.children[0]]}],
 ['detached card',g=>{const n=g.elements.find(n=>n.dataset.unit==='tank');n.parentNode.children.splice(n.parentNode.children.indexOf(n),1)}],
 ['wrong card parent',g=>g.elements.find(n=>n.dataset.unit==='tank').parentNode=g.elements.find(n=>n.dataset.build==='power').parentNode],
 ['wrong tag',g=>g.elements.find(n=>n.dataset.unit==='tank').tagName='DIV']
])test(name+' rejected before field comparison',()=>{const g=fresh();mutate(g);assert.throws(()=>cards(g),{code:'ERR_ASSERTION'})});
console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Strict nine-card keyed field alignment only. Live nodes are retained for write spies; exact within-group order/attachment and full compared fields remain checked. Full tree layout remains covered separately by product and projection tests.'},null,2));
