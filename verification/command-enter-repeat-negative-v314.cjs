'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),cp=require('node:child_process');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),html=fs.readFileSync(source,'utf8');
const guard="if(e.key==='Enter'&&e.repeat&&!e.isComposing&&e.keyCode!==229){e.preventDefault();return}";
assert.equal(html.split(guard).length-1,1,'unique candidate guard');
const mutations=[
 ['remove repeat protection','', 'attack: behavioral Escape cancellation survives held Enter'],
 ['block fresh Enter',guard.replace('&&e.repeat',''),'power: first Enter, repeats, Escape, repeats, fresh Enter'],
 ['block composing Enter',guard.replace('&&!e.isComposing',''),'attack: IME {"isComposing":true} Enter repeat untouched'],
 ['block legacy composing Enter',guard.replace('&&e.keyCode!==229',''),'power: IME {"keyCode":229} Enter repeat untouched'],
 ['block all repeated keys',guard.replace("e.key==='Enter'&&",''),'factory: unrelated key repeat untouched by local handler'],
 ['return without canceling native default',guard.replace('e.preventDefault();',''),'attack: behavioral held Enter preserves armed mode']
];
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-enter-negative-')),results=[];
try{for(const [name,replacement,expected] of mutations){const file=path.join(dir,'mutant.html');fs.writeFileSync(file,html.replace(guard,replacement));const r=cp.spawnSync(process.execPath,[path.join(__dirname,'command-enter-repeat-v314.cjs'),file],{encoding:'utf8'});assert.equal(r.status,1,name);const data=JSON.parse(r.stdout);assert.ok(data.results.some(x=>x.name===expected&&!x.passed),name+': expected boundary must fail');results.push({name,detected:true,failed:data.failed,expected})}}finally{fs.rmSync(dir,{recursive:true,force:true})}
console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Synthetic VM mutation sensitivity only; no native browser or release acceptance.'},null,2));
