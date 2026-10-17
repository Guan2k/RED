'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const source=path.join(__dirname,'../index.html'),html=fs.readFileSync(source,'utf8'),script=path.join(__dirname,'selection-removal.cjs');
function run(file){let p=spawnSync(process.execPath,[script,file],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(p.error,undefined);assert.equal(p.stderr,'');return{status:p.status,report:JSON.parse(p.stdout)}}
let positive=run(source);assert.equal(positive.status,0);assert.equal(positive.report.failed,0);
const controls=[
 ['missing deletion','selection.delete(e.id);selectionRemovalMessage=', 'selectionRemovalMessage=', 'remove exactly chosen entity with "pointer"'],
 ['clear whole selection','selection.delete(e.id);selectionRemovalMessage=', 'selection.clear();selectionRemovalMessage=', 'remove exactly chosen entity with "pointer"'],
 ['cancel existing movement','selection.delete(e.id);selectionRemovalMessage=', 'selection.delete(e.id);e.goal=null;selectionRemovalMessage=', 'remove exactly chosen entity with "pointer"'],
 ['accept replacement object','get(e.id)===e&&selection.has(e.id)','!!get(e.id)&&selection.has(e.id)','click rechecks stale target replacement'],
 ['accept stale displayed value',"$('selectionRemoveTarget').value===String(t.entity.id)&&",'', 'click rechecks stale target value spoof'],
 ['accept another battle','t?.battle===state&&','!!t&&','click rechecks stale target battle'],
 ['accept unselected target','get(e.id)===e&&selection.has(e.id)','get(e.id)===e', 'invalid target clears without selecting replacement unselected'],
 ['skip activation guard','if(!e||!selectionRemovalActivationValid())return','if(!e)return','late "pointer" activation canceled by target change'],
 ['keep choice after target gone','if(!selectionRemovalCurrent())clearSelectionRemovalChoice();','', 'invalid target clears without selecting replacement dead'],
 ['ignore paused removal','function executeSelectionRemoval(){let e=', 'function executeSelectionRemoval(){if(state.paused)return;let e=', 'last entity may be removed paused=true']
];
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-removal-controls-')),results=[];
try{for(const[name,before,after,target]of controls){assert.equal(html.split(before).length-1,1,name+' exact boundary');let file=path.join(tmp,name.replaceAll(' ','-')+'.html');fs.writeFileSync(file,html.replace(before,after));let r=run(file),t=r.report.results.find(x=>x.name===target);results.push({name,target,detected:r.status===1&&t?.passed===false&&t.error.startsWith('AssertionError')})}}
finally{fs.rmSync(tmp,{recursive:true,force:true})}
console.log(JSON.stringify({passed:results.filter(x=>x.detected).length,failed:results.filter(x=>!x.detected).length,positive:{passed:positive.report.passed,assertions:positive.report.assertions},results},null,2));if(results.some(x=>!x.detected))process.exitCode=1;
