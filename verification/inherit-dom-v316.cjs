'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),previous=require('./inherit-dom-v314.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),programs={};
// Only five unique, leaf SPAN nodes directly in their unique attached purchase BUTTON.
// Never omit the card, existing labels, unrelated descendants, or any old fields.
function productionReasonProjection(g){
 const attached=node=>{const seen=new Set();for(let n=node;n!==g.document.body;n=n.parentNode){if(!n||seen.has(n)||!n.parentNode||n.parentNode.children.filter(c=>c===n).length!==1)return false;seen.add(n)}return true};
 const roots=[];
 for(const type of ['tank','scout','artillery','repair','harvester']){
  const matches=g.elements.filter(e=>e.id==='productionReason'+type),cards=g.elements.filter(e=>e.dataset.unit===type);
  const node=matches.length===1?matches[0]:null,card=cards.length===1?cards[0]:null;
  if(node&&card&&node.tagName==='SPAN'&&node.children.length===0&&card.tagName==='BUTTON'&&node.parentNode===card&&attached(node))roots.push(node);
 }
 return element=>roots.includes(element);
}
for(const[name,entry]of Object.entries(previous.programs)){
 const edits=[['function dom(g){','function dom(g){const inProductionReason=('+productionReasonProjection.toString()+')(g);'],['elements=g.elements.filter(e=>!inRefineryMiner(e)','elements=g.elements.filter(e=>!inProductionReason(e)&&!inRefineryMiner(e)'],['e.children.filter(n=>!inRefineryMiner(n)','e.children.filter(n=>!inProductionReason(n)&&!inRefineryMiner(n)']];
 let projection=entry.after;for(const[a,b]of edits){assert.equal(projection.split(a).length-1,1);projection=projection.replace(a,b)}
 let undo=projection;for(const[a,b]of [...edits].reverse())undo=undo.replace(b,a);assert.equal(undo,entry.after,'only exact five reason leaf nodes added to prior projection');
 const bytes=fs.readFileSync(path.join(__dirname,name)),inherited=previous.adapt(name,bytes);assert.equal(inherited.split(entry.after).length-1,1);const updated=inherited.replace(entry.after,projection);
 programs[name]={...entry,after:projection,adaptedSha256:hash(updated)};
}
function adapt(name,bytes){assert.ok(programs[name],'approved comparator only');const inherited=previous.adapt(name,bytes),before=previous.programs[name].after,after=programs[name].after;assert.equal(inherited.split(before).length-1,1);const result=inherited.replace(before,after);assert.equal(result.replace(after,before),inherited,'prior repair behavior and all other bytes retained');assert.equal(hash(result),programs[name].adaptedSha256);return result}
module.exports={...previous,programs,adapt,productionReasonProjection};
