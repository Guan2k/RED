'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),previous=require('./inherit-dom-v312.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),programs={};
// Remove only the two new mining controls, never the surrounding overview.
// Each root is independently unique, correctly tagged, and directly attached.
function refineryMinerProjection(g){
 const parents=g.elements.filter(e=>e.id==='harvesterFleetOverview');
 const parent=parents.length===1?parents[0]:null;
 const attached=node=>{const seen=new Set();for(let n=node;n!==g.document.body;n=n.parentNode){if(!n||seen.has(n)||!n.parentNode||n.parentNode.children.filter(c=>c===n).length!==1)return false;seen.add(n)}return true};
 const roots=[];
 if(parent&&parent.tagName==='DETAILS'&&attached(parent))for(const[id,tag]of [['selectRefineryMiners','BUTTON'],['refineryMinerSelectionHelp','P']]){
  const matches=g.elements.filter(e=>e.id===id),root=matches.length===1?matches[0]:null;
  if(root&&root.tagName===tag&&root.parentNode===parent&&attached(root))roots.push(root);
 }
 return element=>{const seen=new Set();for(let n=element;n;n=n.parentNode){if(roots.includes(n))return true;if(seen.has(n)||!n.parentNode||n.parentNode.children.filter(c=>c===n).length!==1)return false;seen.add(n)}return false};
}
for(const[name,entry]of Object.entries(previous.programs)){
 const edits=[['function dom(g){','function dom(g){const inRefineryMiner=('+refineryMinerProjection.toString()+')(g);'],['elements=g.elements.filter(e=>!inBuildingGallery(e)','elements=g.elements.filter(e=>!inRefineryMiner(e)&&!inBuildingGallery(e)'],['e.children.filter(n=>!inBuildingGallery(n)','e.children.filter(n=>!inRefineryMiner(n)&&!inBuildingGallery(n)']];
 let projection=entry.after;for(const[before,after]of edits){assert.equal(projection.split(before).length-1,1);projection=projection.replace(before,after)}
 let restored=projection;for(const[before,after]of [...edits].reverse())restored=restored.replace(after,before);assert.equal(restored,entry.after,'only exact refinery miner button and help projections added; v312 projection unchanged');
 const original=fs.readFileSync(path.join(__dirname,name),'utf8');assert.equal(hash(original),entry.originalSha256);
 programs[name]={...entry,after:projection,adaptedSha256:hash(original.replace(entry.before,projection))};
}
function adapt(name,bytes){const entry=programs[name];assert.ok(entry,'approved comparator only');const text=Buffer.isBuffer(bytes)?bytes.toString():bytes;assert.equal(hash(text),entry.originalSha256,'frozen original program');assert.equal(text.split(entry.before).length-1,1);const result=text.replace(entry.before,entry.after);assert.equal(hash(result),entry.adaptedSha256);assert.equal(result.replace(entry.after,entry.before),text,'only comparator changed');return result}
module.exports={adapt,programs,refineryMinerProjection};
