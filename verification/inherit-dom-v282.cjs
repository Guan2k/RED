'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),previous=require('./inherit-dom-v281.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),programs={};
for(const [name,entry]of Object.entries(previous.programs)){
 let after=entry.after.replaceAll("'patrolActionHint']","'patrolActionHint','globalRepeatScopeHint']");
 after=after.replace('return{fields,attributes:attrs',"if(e.id==='repeatProduction'){delete attrs['aria-label'];delete attrs.title;delete attrs['aria-describedby']}return{fields,attributes:attrs");
 const original=fs.readFileSync(path.join(__dirname,name),'utf8');
 programs[name]={...entry,after,adaptedSha256:hash(original.replace(entry.before,after))};
}
function adapt(name,bytes){const entry=programs[name];assert.ok(entry,'approved comparator only');const text=Buffer.isBuffer(bytes)?bytes.toString():bytes;assert.equal(hash(text),entry.originalSha256,'frozen original program');assert.equal(text.split(entry.before).length-1,1);const result=text.replace(entry.before,entry.after);assert.equal(hash(result),entry.adaptedSha256);assert.equal(result.replace(entry.after,entry.before),text,'only comparator changed');return result}
module.exports={adapt,programs};
