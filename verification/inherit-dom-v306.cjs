'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),previous=require('./inherit-dom-v305.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),programs={};
const predicate="e=>e.tagName==='SPAN'&&['power','refinery','factory','turret'].some(type=>e.id==='buildReason'+type&&e.parentNode?.dataset.build===type)";
for(const[name,entry]of Object.entries(previous.programs)){
 const before='elements=g.elements.filter(e=>!inPanel(e))',after='elements=g.elements.filter(e=>!inPanel(e)&&!('+predicate+')(e))';
 assert.equal(entry.after.split(before).length-1,1);const childBefore='e.children.filter(n=>!inPanel(n))',childAfter='e.children.filter(n=>!inPanel(n)&&!('+predicate+')(n))';assert.equal(entry.after.split(childBefore).length-1,1);const projection=entry.after.replace(before,after).replace(childBefore,childAfter);
 assert.equal(projection.replace(after,before).replace(childAfter,childBefore),entry.after,'only four exact attached span nodes excluded');
 const original=fs.readFileSync(path.join(__dirname,name),'utf8');assert.equal(hash(original),entry.originalSha256);
 programs[name]={...entry,after:projection,adaptedSha256:hash(original.replace(entry.before,projection))};
}
function adapt(name,bytes){const entry=programs[name];assert.ok(entry,'approved comparator only');const text=Buffer.isBuffer(bytes)?bytes.toString():bytes;assert.equal(hash(text),entry.originalSha256,'frozen original program');assert.equal(text.split(entry.before).length-1,1);const result=text.replace(entry.before,entry.after);assert.equal(hash(result),entry.adaptedSha256);assert.equal(result.replace(entry.after,entry.before),text,'only comparator changed');return result}
module.exports={adapt,programs,predicate};
