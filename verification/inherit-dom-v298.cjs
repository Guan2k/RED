'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),previous=require('./inherit-dom-v297.cjs'),normalize=require('./hold-dom-normalization-v298.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),programs={};
for(const [name,entry]of Object.entries(previous.programs)){
 const before="'displayPreview']",after="'displayPreview','holdBehaviorHint','rallyHoldBehaviorHint']";
 assert.equal(entry.after.split(before).length-1,2,'exact previous projection roots and uniqueness guard');
 let projection=entry.after.replaceAll(before,after);
 const anchor='return{fields,attributes:attrs';assert.equal(projection.split(anchor).length-1,1);
 const addition='const normalizedHoldAttrs=('+normalize.toString()+')(e.id,attrs);';
 projection=projection.replace(anchor,addition+'return{fields,attributes:normalizedHoldAttrs');
 assert.equal(projection.replace(addition+'return{fields,attributes:normalizedHoldAttrs',anchor).replaceAll(after,before),entry.after,'only exact hold additions projected');
 const original=fs.readFileSync(path.join(__dirname,name),'utf8');assert.equal(hash(original),entry.originalSha256);
 programs[name]={...entry,after:projection,adaptedSha256:hash(original.replace(entry.before,projection))};
}
function adapt(name,bytes){const entry=programs[name];assert.ok(entry,'approved comparator only');const text=Buffer.isBuffer(bytes)?bytes.toString():bytes;assert.equal(hash(text),entry.originalSha256,'frozen original program');assert.equal(text.split(entry.before).length-1,1);const result=text.replace(entry.before,entry.after);assert.equal(hash(result),entry.adaptedSha256);assert.equal(result.replace(entry.after,entry.before),text,'only comparator changed');return result}
module.exports={adapt,programs};
