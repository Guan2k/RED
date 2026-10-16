'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-weakest-negative-'));
try{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),file=path.join(dir,'index.html');
 function run(text){fs.writeFileSync(file,text);const p=spawnSync(process.execPath,[path.join(__dirname,'weakest-selection.cjs'),file],{encoding:'utf8',maxBuffer:16*1024*1024});if(p.error)throw p.error;assert.equal(p.status,1);return JSON.parse(p.stdout)}
 const baseline=run(require('./restore-v253.cjs')(html));assert.equal(baseline.failed,27);assert.equal(baseline.passed,11);assert.equal(baseline.sourceSha256,'eb6b462a6605f7305156e41df8922b39b375ffae85110a0687b95b6f92f66f41');
 const cases=[
 ['healthy candidates included','if(canSetFirePriority(e)&&e.hp<e.max&&(!critical','if(canSetFirePriority(e)&&e.hp<=e.max&&(!critical','full-health-only selection disables and direct invocation preserves modes'],
 ['tie direction reversed','e.id<critical.id','e.id>critical.id','equal ratios choose lowest stable ID even when entity and selection order reversed'],
 ['support units included','if(canSetFirePriority(e)&&e.hp<e.max&&(!critical','if(e.team===0&&e.hp>0&&e.hp<e.max&&(!critical','ineligible weaker selected unit ignored repair ']
 ];const mutations=[];for(const [label,before,after,expected]of cases){assert.equal(html.split(before).length-1,1);const r=run(html.replace(before,after));assert.ok(r.results.some(x=>x.name===expected&&x.status==='fail'),expected);mutations.push({label,failed:r.failed,expectedFailure:expected})}
 console.log(JSON.stringify({passed:4,failed:0,evidence:{baselineSha256:baseline.sourceSha256,featureScopeFailures:26,boundaryFailures:1,baselinePasses:11,mutations},scope:'Exact baseline plus deliberately broken candidate controls; simulated DOM.'},null,2));
}finally{fs.rmSync(dir,{recursive:true,force:true})}
