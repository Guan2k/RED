'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),previous=require('./inherit-dom-v277.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const programs={};
for(const [name,entry]of Object.entries(previous.programs)){
 let after=entry.after.replaceAll("'coordinateConstructionPanel']","'coordinateConstructionPanel','patrolActionHint']");
 if(name==='repair-button-repeat.cjs')after=after.replace('return{fields,attributes:{...e.attributes}',"if(e.id==='patrol'){delete fields.textContent;delete fields.title}const attrs={...e.attributes};if(e.id==='patrol')delete attrs['aria-describedby'];return{fields,attributes:attrs");
 else after=after.replace('return{fields,attributes:attrs',"if(e.id==='patrol'){delete fields.textContent;delete fields.title;delete attrs['aria-describedby']}return{fields,attributes:attrs");
 programs[name]={...entry,after,adaptedSha256:hash(require('node:fs').readFileSync(require('node:path').join(__dirname,name),'utf8').replace(entry.before,after))};
}
function adapt(name,bytes){const entry=programs[name];assert.ok(entry,'approved comparator only');const text=Buffer.isBuffer(bytes)?bytes.toString():bytes;assert.equal(hash(text),entry.originalSha256,'frozen original source');assert.equal(text.split(entry.before).length-1,1);const adapted=text.replace(entry.before,entry.after);assert.equal(adapted.replace(entry.after,entry.before),text,'only comparator adapted');return adapted}
module.exports={programs,adapt};
