'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-health-negative-'));
try{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),file=path.join(dir,'index.html');
 function run(text){fs.writeFileSync(file,text);const p=spawnSync(process.execPath,[path.join(__dirname,'selection-health.cjs'),file],{encoding:'utf8',maxBuffer:16*1024*1024});if(p.error)throw p.error;assert.equal(p.status,1);return JSON.parse(p.stdout)}
 const baseline=run(require('./restore-v252.cjs')((sourceText=>require('./restore-v253.cjs')(sourceText.includes('ORIGINAL RTS / v0.271')?require('./restore-v270.cjs')(sourceText):sourceText))(html)));assert.equal(baseline.failed,29);assert.equal(baseline.passed,4);assert.equal(baseline.sourceSha256,'20a0108a9f0d496da8e02520481a8f9d8f53da197ba33c5c5cd665f9bbd0ac2a');
 const cases=[
 ['50% boundary excluded','if(e.hp<=e.max*.5)critical++','if(e.hp<e.max*.5)critical++','single vehicle exact threshold and downward percentage 0.5'],
 ['rounding shows injured as full','Math.floor(lowest*1000)/10','Math.round(lowest*1000)/10','single vehicle exact threshold and downward percentage 0.999999'],
 ['noncombat selection included','function selectedCombatHealthSummary(selected){let units=selected.filter(canSetFirePriority);','function selectedCombatHealthSummary(selected){let units=selected.filter(e=>e.hp>0);','ineligible selected repair  does not change combat summary']
 ];
 const mutations=[];for(const [label,before,after,expected]of cases){assert.equal(html.split(before).length-1,1);const r=run(html.replace(before,after));assert.ok(r.results.some(x=>x.name===expected&&x.status==='fail'),expected);mutations.push({label,failed:r.failed,expectedFailure:expected})}
 console.log(JSON.stringify({passed:4,failed:0,evidence:{baselineSha256:baseline.sourceSha256,missingFeatureFailures:28,boundaryFailures:1,baselinePasses:4,mutations},scope:'Exact baseline plus deliberately broken candidate controls; simulated DOM.'},null,2));
}finally{fs.rmSync(dir,{recursive:true,force:true})}
