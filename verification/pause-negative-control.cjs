'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-pause-negative-'));
try{
 const file=path.join(dir,'index.html');fs.writeFileSync(file,require('./restore-v250.cjs')(require('./restore-v251.cjs')(require('./restore-v252.cjs')(require('./restore-v253.cjs')(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'))))));
 const run=spawnSync(process.execPath,[path.join(__dirname,'pause-ui.cjs'),file],{encoding:'utf8'});if(run.error)throw run.error;assert.equal(run.status,1);
 const report=JSON.parse(run.stdout);assert.equal(report.failed,21);assert.equal(report.passed,7);
 const failed=new Set(report.results.filter(x=>x.status==='fail').map(x=>x.name));
 for(const id of ['selection','electricityStatus','repairWorkSummary','orderedRouteStatus','harvesterFleetWork','postOverviewStatus','productionCapacity'])for(const verb of ['pause','resume'])assert.ok(failed.has(`button ${verb} immediately refreshes ${id}`));
 console.log(JSON.stringify({passed:1,failed:0,evidence:{baselineSha256:report.sourceSha256,expectedBaselineFailures:report.failed,behaviorFailures:20,boundaryFailure:1},scope:'Exact v250 negative control; intentionally failing baseline is detected.'},null,2));
}finally{fs.rmSync(dir,{recursive:true,force:true})}
