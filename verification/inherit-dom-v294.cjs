'use strict';
// Only the exact optional displayPreview subtree is newly projected.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),previous=require('./inherit-dom-v293.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),programs={};
for(const [name,entry]of Object.entries(previous.programs)){
 const before="'quickSwitchbackBrief']",after="'quickSwitchbackBrief','displayPreview']";
 assert.equal(entry.after.split(before).length-1,2,'exact v293 projection roots and uniqueness guard');
 const projection=entry.after.replaceAll(before,after);
 assert.equal(projection.replaceAll(after,before),entry.after,'only displayPreview subtree added');
 const original=fs.readFileSync(path.join(__dirname,name),'utf8');assert.equal(hash(original),entry.originalSha256,'frozen original program');
 programs[name]={...entry,after:projection,adaptedSha256:hash(original.replace(entry.before,projection))};
}
function adapt(name,bytes){const entry=programs[name];assert.ok(entry,'approved comparator only');const text=Buffer.isBuffer(bytes)?bytes.toString():bytes;assert.equal(hash(text),entry.originalSha256,'frozen original program');assert.equal(text.split(entry.before).length-1,1,'unique frozen DOM comparator');const result=text.replace(entry.before,entry.after);assert.equal(hash(result),entry.adaptedSha256,'exact adapted program');assert.equal(result.replace(entry.after,entry.before),text,'only comparator changed');return result}
module.exports={adapt,programs};
