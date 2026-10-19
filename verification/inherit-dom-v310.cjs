'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),previous=require('./inherit-dom-v309.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),programs={};
// Only the exact new, correctly attached gallery subtree is eligible. Invalid or
// ambiguous roots remain in the comparator, including detached descendants.
function buildingGalleryProjection(g){
 const roots=g.elements.filter(e=>e.id==='buildingReferenceGallery'),parents=g.elements.filter(e=>e.id==='unitReference');
 const root=roots.length===1?roots[0]:null,parent=parents.length===1?parents[0]:null;
 let valid=!!(root&&parent&&root.tagName==='DIV'&&parent.tagName==='DETAILS'&&root.parentNode===parent);
 if(valid){const seen=new Set();let n=root;while(n!==g.document.body){if(seen.has(n)||!n.parentNode||!n.parentNode.children.includes(n)){valid=false;break}seen.add(n);n=n.parentNode}}
 return element=>{if(!valid)return false;const seen=new Set();for(let n=element;n;n=n.parentNode){if(n===root)return true;if(seen.has(n)||!n.parentNode?.children.includes(n))return false;seen.add(n)}return false};
}
for(const[name,entry]of Object.entries(previous.programs)){
 const edits=[['function dom(g){','function dom(g){const inBuildingGallery=('+buildingGalleryProjection.toString()+')(g);'],['elements=g.elements.filter(e=>!inGallery(e)','elements=g.elements.filter(e=>!inBuildingGallery(e)&&!inGallery(e)'],['e.children.filter(n=>!inGallery(n)','e.children.filter(n=>!inBuildingGallery(n)&&!inGallery(n)']];
 let projection=entry.after;for(const[before,after]of edits){assert.equal(projection.split(before).length-1,1);projection=projection.replace(before,after)}
 let restored=projection;for(const[before,after]of [...edits].reverse())restored=restored.replace(after,before);assert.equal(restored,entry.after,'only exact building gallery subtree projection added; v309 vehicle and v306 reason projections unchanged');
 const original=fs.readFileSync(path.join(__dirname,name),'utf8');assert.equal(hash(original),entry.originalSha256);
 programs[name]={...entry,after:projection,adaptedSha256:hash(original.replace(entry.before,projection))};
}
function adapt(name,bytes){const entry=programs[name];assert.ok(entry,'approved comparator only');const text=Buffer.isBuffer(bytes)?bytes.toString():bytes;assert.equal(hash(text),entry.originalSha256,'frozen original program');assert.equal(text.split(entry.before).length-1,1);const result=text.replace(entry.before,entry.after);assert.equal(hash(result),entry.adaptedSha256);assert.equal(result.replace(entry.after,entry.before),text,'only comparator changed');return result}
module.exports={adapt,programs,buildingGalleryProjection};
