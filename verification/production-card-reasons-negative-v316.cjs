'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),html=fs.readFileSync(source,'utf8'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-production-reasons-')),results=[];
const assignment="setReadonlyPanelProperty($('productionReason'+b.dataset.unit),'textContent',purchaseReason);";
try{
 assert.equal(html.split(assignment).length,2,'exactly one availability text assignment');
 for(const [name,replacement]of [['missing-update',''],['stale-after-recovery','if(purchaseReason)'+assignment]]){
  const file=path.join(dir,name+'.html');fs.writeFileSync(file,html.replace(assignment,replacement));
  const r=spawnSync(process.execPath,[path.join(__dirname,'production-card-reasons-v316.cjs'),file],{encoding:'utf8'});assert.equal(r.status,1,name+' must fail assertions');const report=JSON.parse(r.stdout);assert.ok(report.failed>0);results.push({name,rejected:true,failedCases:report.failed});
 }
 console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Mutation controls only; not browser evidence.'},null,2));
}finally{fs.rmSync(dir,{recursive:true,force:true})}
