'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-construction-reasons-')),results=[];
const helper=html.match(/function constructionCardReason\(type\)\{[^\n]+/)[0];
try{for(const [name,before,after]of [
 ['missing funding reason',"'资金不足，还差 '+Math.ceil(defs[type].cost-state.cash)+'资金'","'资金不足'"],
 ['fraction rounded down','Math.ceil(defs[type].cost-state.cash)','Math.floor(defs[type].cost-state.cash)'],
 ['terminal funding precedence',"if(state.result)return'战局已结束';if(restartPrompt)","if(state.result)return'资金不足';if(restartPrompt)"],
 ['available stale text',"Math.ceil(defs[type].cost-state.cash)+'资金':''}","Math.ceil(defs[type].cost-state.cash)+'资金':'资金不足'}"]
]){assert.equal(helper.split(before).length-1,1,name+' exact mutation');const file=path.join(tmp,name+'.html');fs.writeFileSync(file,html.replace(helper,helper.replace(before,after)));const r=spawnSync(process.execPath,[path.join(__dirname,'construction-reasons-v313.cjs'),file],{encoding:'utf8'});assert.equal(r.status,1);const report=JSON.parse(r.stdout);assert.ok(report.failed>0);results.push({name,passed:true,detectedFailures:report.failed})}}finally{fs.rmSync(tmp,{recursive:true,force:true})}
console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Four exact reason-only mutations detected by focused current-source tests.'},null,2));
