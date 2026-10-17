'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const source=path.join(__dirname,'../index.html'),html=fs.readFileSync(source,'utf8'),script=path.join(__dirname,'coordinate-command.cjs');
function run(file){const p=spawnSync(process.execPath,[script,file],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(p.error,undefined);assert.equal(p.signal,null);assert.equal(p.stderr,'');const r=JSON.parse(p.stdout);assert.equal(r.results.length,r.passed+r.failed);assert.equal(r.results.filter(t=>t.passed).length,r.passed);assert.equal(p.status,r.failed?1:0);return {status:p.status,report:r}}
const positive=run(source);assert.equal(positive.status,0);assert.equal(positive.report.failed,0);
const controls=[
  [
    "accept out of range",
    "x<=WIDTH&&y>=0&&y<=HEIGHT",
    "true&&y>=0&&true",
    "reject invalid coordinates [\"1201\",\"540\"]"
  ],
  [
    "omit current reason",
    "function coordinateCommandReason(){return ordinaryCommandReason()||",
    "function coordinateCommandReason(){return ''||",
    "current gate restart"
  ],
  [
    "ignore canceled activation",
    "function validCoordinateCommandActivation(){let a=coordinateCommandActivation;return !a||a.battle===state&&!a.canceled&&!a.consumed",
    "function validCoordinateCommandActivation(){let a=coordinateCommandActivation;return !a||a.battle===state&&!a.consumed",
    "late \" \" click rejected after Escape"
  ],
  [
    "capture append semantics",
    "issue(p,false,false);updateUI()}\nfor(let id of [",
    "issue(p,false,true);updateUI()}\nfor(let id of [",
    "ordinary parity ore paused=false"
  ],
  [
    "allow held Enter",
    "if(e.repeat){e.preventDefault();if(!coordinateCommandActivation)",
    "if(e.repeat){if(!coordinateCommandActivation)",
    "held Enter is prevented and does not issue repeated orders"
  ],
  [
    "keep fields on new game",
    "for(let id of ['coordinateCommandX','coordinateCommandY'])$(id).value='';",
    "",
    "normal cancel preserves typed coordinates and new game clears them"
  ],
  [
    "execute while editing",
    "$(id).oninput=()=>{cancelCoordinateCommandActivation();updateCoordinateCommandControl()}",
    "$(id).oninput=()=>{cancelCoordinateCommandActivation();updateCoordinateCommandControl();executeCoordinateCommand()}",
    "accept bounded integer parser [\"450\",\"540\"]"
  ]
];
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-coordinate-command-controls-')),results=[];
try{for(const [name,before,after,target] of controls){assert.equal(html.split(before).length-1,1,name+' exact edit');const file=path.join(tmp,name.replaceAll(' ','-')+'.html');fs.writeFileSync(file,html.replace(before,after));const r=run(file),test=r.report.results.find(x=>x.name===target);const detected=r.status===1&&test?.passed===false&&test.error.startsWith('AssertionError');results.push({name,target,detected,error:detected?null:test?.error||'target absent'});}}
finally{fs.rmSync(tmp,{recursive:true,force:true})}
console.log(JSON.stringify({passed:results.filter(x=>x.detected).length,failed:results.filter(x=>!x.detected).length,positive:{passed:positive.report.passed,failed:positive.report.failed},results,scope:'Mutations must fail a named behavioral assertion after a clean positive run. Setup errors and unrelated failures are not accepted.'},null,2));if(results.some(x=>!x.detected))process.exitCode=1;
