'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const source=path.join(__dirname,'../index.html'),html=fs.readFileSync(source,'utf8'),script=path.join(__dirname,'map-pointer-geometry.cjs');
function run(file){const p=spawnSync(process.execPath,[script,file],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(p.error,undefined);const r=JSON.parse(p.stdout);return {status:p.status,report:r}}
const positive=run(source);assert.equal(positive.status,0);assert.equal(positive.report.failed,0);
const controls=[
 ['missing scroll notification',"window.addEventListener('scroll',refreshMapPointerGeometry,{capture:true,passive:true});",'', 'scroll clears stale hover and preview, paused=false'],
 ['missing resize notification',"window.addEventListener('resize',refreshMapPointerGeometry);",'', 'resize clears stale hover and preview, paused=false'],
 ['ignore changed rectangle','changed=mapPointerGeometry&&next.some((value,i)=>value!==mapPointerGeometry[i])','changed=false','scroll clears stale hover and preview, paused=false'],
 ['keep active gesture','if(ordinaryCommandGesture)clearOrdinaryCommand();','','ordinary active gesture canceled on scroll'],
 ['keep ordinary activation',"if(changed){if(ordinaryCommandActivation)ordinaryCommandActivation.canceled=true;if(appendCommandActivation)appendCommandActivation.canceled=true;",'if(changed){', 'late ordinaryCommand key default click cannot rearm'],
 ['keep double-click chain','selectionClickCandidate=null;lastSelectionClick=0;doubleClickSelection=false;drag=null;hoverActive=false;invalidateCoordinatePointer();','drag=null;hoverActive=false;invalidateCoordinatePointer();','layout changes clear completed selection double-click chain']
];
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-map-geometry-controls-')),results=[];
try{for(const [name,before,after,target] of controls){assert.equal(html.split(before).length-1,1,name+' exact edit');const file=path.join(tmp,name.replaceAll(' ','-')+'.html');fs.writeFileSync(file,html.replace(before,after));const r=run(file),test=r.report.results.find(x=>x.name===target);const detected=r.status===1&&test?.passed===false&&test.error.startsWith('AssertionError');results.push({name,target,detected,error:detected?null:test?.error||'target absent'});}}
finally{fs.rmSync(tmp,{recursive:true,force:true})}
console.log(JSON.stringify({passed:results.filter(x=>x.detected).length,failed:results.filter(x=>!x.detected).length,positive:{passed:positive.report.passed,failed:positive.report.failed},results,scope:'Mutations must fail a named behavioral assertion after a clean positive run. Setup errors and unrelated failures are not accepted.'},null,2));if(results.some(x=>!x.detected))process.exitCode=1;
