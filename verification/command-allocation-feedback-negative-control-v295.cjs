'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-feedback-negative-')),results=[];
const variants=[
 ['remove vehicle reason',"if(failedTroops)reasons.push(failedTroops+'辆车未找到安全落点');",'', 'all vehicles fail'],
 ['remove factory reason',"if(failedFactories)reasons.push(failedFactories+'座工厂未找到安全集结点');",'', 'one factory fails'],
 ['wrong vehicle count',"reasons.push(failedTroops+'辆车未找到安全落点')","reasons.push((failedTroops+1)+'辆车未找到安全落点')",'all vehicles fail'],
 ['wrong factory count',"reasons.push(failedFactories+'座工厂未找到安全集结点')","reasons.push((failedFactories+1)+'座工厂未找到安全集结点')",'one factory fails'],
 ['count ore assignment as failure','failedTroops=troops.length-used.length-followed-guarded-assigned','failedTroops=troops.length-used.length-followed-guarded','ore accepted despite all ground failures'],
 ['count escort as failure','failedTroops=troops.length-used.length-followed-guarded-assigned','failedTroops=troops.length-used.length-followed-assigned','escort accepted despite factory failure'],
 ['count repair follow as failure','failedTroops=troops.length-used.length-followed-guarded-assigned','failedTroops=troops.length-used.length-guarded-assigned','repair follow accepted despite vehicle failure'],
 ['drop separator',"mapCommandReason(reasons.join('；'))","mapCommandReason(reasons.join(''))",'mixed all fail']
];
function run(file){const p=spawnSync(process.execPath,[path.join(__dirname,'command-allocation-feedback-v295.cjs'),...(file?[file]:[])],{encoding:'utf8',timeout:120000,maxBuffer:4e6});assert.ifError(p.error);assert.equal(p.signal,null);return p}
try{let p=run();assert.equal(p.status,0,p.stderr);for(const[name,before,after,expected]of variants){assert.equal(html.split(before).length-1,1,name+' unique');let file=path.join(temp,results.length+'.html');fs.writeFileSync(file,html.replace(before,after));p=run(file);assert.equal(p.status,1,name);let message=p.stderr.match(/AssertionError \[ERR_ASSERTION\]: ([^\n]+)/)?.[1];assert.equal(message,'exact receipt counts '+expected,name+' exact behavior assertion');results.push({name,passed:true,detectedBy:message})}console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Eight source mutations detected by named receipt behavior assertions; no generic execution error or source hash failure counted.'},null,2));}finally{fs.rmSync(temp,{recursive:true,force:true})}
