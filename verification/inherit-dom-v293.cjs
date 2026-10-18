'use strict';
// Exact new mission button/brief roots plus exact introductory count text only.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),previous=require('./inherit-dom-v289.cjs');
const oldText="六项快速任务均有参考；按钮只填开局配置，建造、护矿与维修仍需自行操作。更改选项后请按实际条件调整；这些思路不保证获胜。机动作战不能新建己方炮塔。",newText="七项快速任务均有参考；按钮只填开局配置，建造、护矿与维修仍需自行操作。更改选项后请按实际条件调整；这些思路不保证获胜。机动作战不能新建己方炮塔。";
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),programs={};
for(const [name,entry]of Object.entries(previous.programs)){
 const before="'openingPractice']",after="'openingPractice','quickSwitchback','quickSwitchbackBrief']";
 assert.equal(entry.after.split(before).length-1,2,'exact v289 projection roots and uniqueness guard');
 let projection=entry.after.replaceAll(before,after);
 assert.equal(projection.replaceAll(after,before),entry.after,'only two mission roots added');
 const anchor="if(e.id==='patrol'){delete fields.textContent;";
 const normalization="if(e.tagName==='P'&&e.parentNode?.id==='quickMissionTips'&&fields.textContent==="+JSON.stringify(newText)+")fields.textContent="+JSON.stringify(oldText)+";";
 assert.equal(projection.split(anchor).length-1,1);projection=projection.replace(anchor,normalization+anchor);
 const original=fs.readFileSync(path.join(__dirname,name),'utf8');assert.equal(hash(original),entry.originalSha256,'frozen original program');
 programs[name]={...entry,after:projection,adaptedSha256:hash(original.replace(entry.before,projection))};
}
function adapt(name,bytes){const entry=programs[name];assert.ok(entry,'approved comparator only');const text=Buffer.isBuffer(bytes)?bytes.toString():bytes;assert.equal(hash(text),entry.originalSha256,'frozen original program');assert.equal(text.split(entry.before).length-1,1,'unique frozen DOM comparator');const result=text.replace(entry.before,entry.after);assert.equal(hash(result),entry.adaptedSha256,'exact adapted program');assert.equal(result.replace(entry.after,entry.before),text,'only comparator changed');return result}
module.exports={adapt,programs};
