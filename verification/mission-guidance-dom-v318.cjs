'use strict';
// Comparison-only projection: exactly the five reviewed static LI/STRONG pairs.
// Never changes candidate source, live nodes, control fields or original briefing.
const assert=require('node:assert/strict');
const ids=['switchbackReinforcementHint','switchbackProductionHint','switchbackRepairHint','switchbackHoldHint','switchbackEvidenceHint'];
const ownKeys=['tagName','children','parentNode','style','dataset','attributes','value','textContent','hidden','disabled','isContentEditable','listeners','id','classList'].sort();
function nodes(g){
 const unique=id=>{const found=g.elements.filter(n=>n.id===id);assert.equal(found.length,1,'unique reviewed guidance node '+id);return found[0]};
 const brief=unique('quickSwitchbackBrief');assert.equal(brief.tagName,'SECTION');
 assert.equal(brief.children.length,3,'existing briefing child inventory');assert.deepEqual(brief.children.map(n=>n.tagName),['H4','P','UL']);
 const list=brief.children[2];assert.ok(list.parentNode===brief,'list parent identity');assert.equal(list.children.length,8,'three retained plus five new list items');
 const selected=[];
 function pristine(n,tag,attributes){
  assert.deepEqual(Object.keys(n).sort(),ownKeys,'no unexpected guidance fields');assert.equal(n.tagName,tag);assert.deepEqual(n.attributes,attributes);assert.deepEqual(n.style,{});assert.deepEqual(n.dataset,{});assert.deepEqual(n.listeners,{});
  assert.equal(n.id,attributes.id||'');assert.equal(n.value,'');assert.equal(n.textContent,'');assert.equal(n.hidden,false);assert.equal(n.disabled,false);assert.equal(n.isContentEditable,false);assert.equal(n.classList.contains('hidden'),false);assert.equal(n.classList.contains('active'),false);
  assert.equal(g.elements.filter(x=>x===n).length,1,'unique flat node identity');
 }
 for(const [i,id]of ids.entries()){
  const item=unique(id);pristine(item,'LI',{id});assert.ok(item.parentNode===list,'note parent identity');assert.ok(list.children[i+3]===item,'exact appended note order');assert.equal(item.children.length,1,'one text label only');
  const label=item.children[0];pristine(label,'STRONG',{});assert.ok(label.parentNode===item,'label parent identity');assert.equal(label.children.length,0,'no nested controls/content');selected.push(item,label);
 }
 const at=g.elements.indexOf(selected[0]);assert.ok(at>=0);assert.ok(selected.every((node,i)=>g.elements[at+i]===node),'exact flat ten-node order');
 // Preserve and verify complete attachment instead of accepting detached lookalikes.
 const seen=new Set();for(let node=list;node!==g.document.body;node=node.parentNode){assert.ok(node&&!seen.has(node)&&node.parentNode,'attached acyclic briefing');seen.add(node);assert.equal(node.parentNode.children.filter(n=>n===node).length,1)}
 return selected;
}
function predicate(g){const excluded=new Set(nodes(g));return node=>excluded.has(node)}
module.exports={ids,nodes,predicate};
