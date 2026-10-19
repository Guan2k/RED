'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-group-repeat-negative-')),results=[];
const anchor='e.preventDefault();if(!e.repeat)controlGroup(Number(e.key)-1,e.ctrlKey||e.metaKey);return';
const variants=[
 ['restore repeated activation',anchor,anchor.replace('if(!e.repeat)',''),'repeat preserves exact world and pending input'],
 ['block initial key',anchor,anchor.replace('if(!e.repeat)','if(e.repeat)'),'initial save works'],
 ['repeat Ctrl still activates',anchor,anchor.replace('if(!e.repeat)','if(!e.repeat||e.ctrlKey)'),'repeat preserves exact world and pending input'],
 ['repeat Meta still activates',anchor,anchor.replace('if(!e.repeat)','if(!e.repeat||e.metaKey)'),'repeat preserves exact world and pending input'],
 ['repeat recall still activates',anchor,anchor.replace('if(!e.repeat)','if(!e.repeat||!e.ctrlKey&&!e.metaKey)'),'repeat preserves exact world and pending input'],
 ['repeat paused still activates',anchor,anchor.replace('if(!e.repeat)','if(!e.repeat||state.paused)'),'repeat preserves exact world and pending input'],
 ['repeat group three still activates',anchor,anchor.replace('if(!e.repeat)',"if(!e.repeat||e.key==='3')"),'repeat preserves exact world and pending input'],
 ['unconsumed repeated key',anchor,anchor.replace('e.preventDefault();','if(!e.repeat)e.preventDefault();'),'repeat key consumed'],
 ['missing repeat field blocked',anchor,anchor.replace('if(!e.repeat)','if(e.repeat===false)'),'undefined repeat means first event'],
 ['repeat clears pending command',anchor,anchor.replace('e.preventDefault();','e.preventDefault();if(e.repeat)clearOrdinaryCommand();'),'repeat preserves exact world and pending input'],
 ['repeat writes log feedback',anchor,anchor.replace('e.preventDefault();',"e.preventDefault();if(e.repeat)tell('ignored repeat');"),'repeat preserves exact world and pending input']
];
function run(file){const p=spawnSync(process.execPath,[path.join(__dirname,'control-group-repeat-v309.cjs'),...(file?[file]:[])],{encoding:'utf8',timeout:120000,maxBuffer:4e6});assert.ifError(p.error);assert.equal(p.signal,null);return p}
function check(name,file,expected){const p=run(file);assert.equal(p.status,1,name+' behavioral assertion exit');const message=p.stderr.match(/AssertionError \[ERR_ASSERTION\]: ([^\n]+)/)?.[1];assert.equal(message,expected,name+' precise behavior invariant');results.push({name,passed:true,detectedBy:message})}
try{const normal=run();assert.equal(normal.status,0,normal.stderr);assert.equal(JSON.parse(normal.stdout).failed,0);for(const[name,before,after,expected]of variants){assert.equal(html.split(before).length-1,1,'unique mutation '+name);const file=path.join(temp,results.length+'.html');fs.writeFileSync(file,html.replace(before,after));check(name,file,expected)}const file=path.join(temp,'v291.html');fs.writeFileSync(file,require('./restore-v291-from-v309.cjs')(html));check('exact v291 repeat behavior contrast',file,'repeat preserves exact world and pending input');console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'11 product-source mutations each fail a named behavior assertion after positive success, plus exact-v291 behavior contrast. No identity/syntax/timeout/generic exception detection credited.'},null,2))}finally{fs.rmSync(temp,{recursive:true,force:true})}
