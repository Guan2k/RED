'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),html=fs.readFileSync(source,'utf8');
const guard="||e.code==='Space'||e.key==='Escape')){if(e.code==='Space')e.preventDefault();return}";
const cases=[
 ['restore old repeated Escape cancellation',guard,"||e.code==='Space')){if(e.code==='Space')e.preventDefault();return}",'held Escape preserves new attack, paused=false'],
 ['block first Escape too',guard,"||e.code==='Space'||e.key==='Escape')){if(e.code==='Space')e.preventDefault();return}if(e.key==='Escape')return;",'first Escape false cancels attack'],
 ['stop canceling pending attack',"if(e.key==='Escape'){cancelCommandSpaceActivations();resetSelectionClicks();cancelRestart();placement=null;attackMode=false;drag=null;clearOrdinaryCommand()}","if(e.key==='Escape'){cancelCommandSpaceActivations();resetSelectionClicks();cancelRestart();placement=null;drag=null;clearOrdinaryCommand()}",'first Escape false cancels attack'],
 ['stop returning from restart on first Escape',"resetSelectionClicks();cancelRestart();placement=null;attackMode=false;drag=null;clearOrdinaryCommand()}","resetSelectionClicks();placement=null;attackMode=false;drag=null;clearOrdinaryCommand()}",'held Escape preserves newly opened restart, paused=false']
];
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-escape-neg-')),results=[];
try{for(const [name,before,after,expected] of cases){assert.equal(html.split(before).length-1,1,'unique mutation '+name);const p=path.join(tmp,'index.html');fs.writeFileSync(p,html.replace(before,after));const run=cp.spawnSync(process.execPath,[path.join(__dirname,'escape-key-repeat-v315.cjs'),p],{encoding:'utf8'});assert.equal(run.status,1,'mutant rejected '+name);assert.equal(run.stderr,'','no unrelated execution failure');const report=JSON.parse(run.stdout);assert.ok(report.results.some(r=>r.name===expected&&!r.passed),'specific failed assertion '+name);results.push({name,passed:true,rejectedBy:expected,failedCases:report.failed})}}finally{fs.rmSync(tmp,{recursive:true,force:true})}
console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Four precise source mutations, rejected by designated behavioral cases. Not additional gameplay scenarios or native browser coverage.'},null,2));
