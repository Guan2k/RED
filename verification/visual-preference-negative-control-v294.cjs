'use strict';const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),suite=path.join(__dirname,'visual-preference-v294.cjs'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-preview-pref-mutants-')),results=[];
const variants=[
 ['browser hint removed','id="vehicleArtPreview" type="checkbox" autocomplete="off"','id="vehicleArtPreview" type="checkbox"', 'form restoration discouraged by explicit browser hint'],
 ['UI omits restored-checkbox repair','updateVisualPreviewControl();updateOpeningPractice();','updateOpeningPractice();','UI checkbox follows session flag'],
 ['UI adopts restored checkbox',"if(control.checked!==vehicleArtPreview)control.checked=vehicleArtPreview","vehicleArtPreview=control.checked",'UI checkbox follows session flag'],
 ['stable sync repeated assignment',"if(control.checked!==vehicleArtPreview)control.checked=vehicleArtPreview","control.checked=vehicleArtPreview",'stable checkbox sync writes zero'],
 ['default renderer enabled','let vehicleArtPreview=false;','let vehicleArtPreview=true;','fresh renderer default legacy'],
 ['panel expanded','<details id="displayPreview" class="controls-help">','<details id="displayPreview" class="controls-help" open>','display panel initially closed'],
 ['markup checkbox checked','id="vehicleArtPreview" type="checkbox"','id="vehicleArtPreview" type="checkbox" checked','markup default unchecked'],
 ['missing label linkage','<label for="vehicleArtPreview">','<label>','one explicit accessible label'],
 ['missing help linkage','aria-describedby="vehicleArtPreviewHelp"','aria-describedby="wrongHelp"','accessible help linkage'],
 ['ignored change',"vehicleArtPreview=$('vehicleArtPreview').checked;","vehicleArtPreview=false;",'registered change sets session preview'],
 ['toggle consumes RNG',"vehicleArtPreview=$('vehicleArtPreview').checked;","vehicleArtPreview=$('vehicleArtPreview').checked;Math.random();",'preference change consumes no RNG'],
 ['toggle changes economy',"vehicleArtPreview=$('vehicleArtPreview').checked;","vehicleArtPreview=$('vehicleArtPreview').checked;state.cash++;",'preference change leaves complete battle and commands unchanged'],
 ['toggle clears selection',"vehicleArtPreview=$('vehicleArtPreview').checked;","vehicleArtPreview=$('vehicleArtPreview').checked;selection.clear();",'preference change leaves complete battle and commands unchanged'],
 ['new round resets flag','function start(){clearImportReadReceipt();','function start(){vehicleArtPreview=false;clearImportReadReceipt();','new round retains session preference'],
 ['checkbox keyboard routed to battle',"['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)","['SELECT','TEXTAREA'].includes(document.activeElement.tagName)",'checkbox native key not intercepted']
];
function run(p){return spawnSync(process.execPath,[suite,...(p?[p]:[])],{encoding:'utf8',maxBuffer:4*1024*1024})}
try{let normal=run();assert.equal(normal.status,0,normal.stderr);for(const[name,before,after,message]of variants){assert.equal(html.split(before).length-1,1,'unique mutation '+name);const p=path.join(dir,results.length+'.html');fs.writeFileSync(p,html.replace(before,after));const x=run(p);assert.equal(x.status,1,name+' intended assertion exit');assert.equal(x.stderr.match(/AssertionError \[ERR_ASSERTION\]: ([^\n]*)/)?.[1],message,name+' exact semantic failure '+x.stderr.slice(0,600));results.push({name,passed:true,detectedBy:message})}console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Exact semantic mutations with successful positive prerequisite. No storage-write mutation or native browser action; generic errors/hash/syntax failures not credited.'},null,2))}finally{fs.rmSync(dir,{recursive:true,force:true})}
