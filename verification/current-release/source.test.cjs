'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {sha,contract,changes,inverse,restore,restoreProductFiles}=require('./source.cjs');
const source=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8'),baseline=restore(source),results=[];
function test(name,f){f();results.push({name,passed:true})}
test('exact current index restores exact archived v318',()=>assert.equal(sha(baseline),contract.baselineSha256));
for(const [i,c]of changes.entries())test('missing or duplicated reviewed boundary rejects '+i,()=>{
 assert.throws(()=>inverse(source.replace(c.after,'BROKEN_BOUNDARY_'+i)));assert.throws(()=>inverse(source+c.after));
});
for(const [before,after]of [['function repeatProductionParallel(){return state.repeatParallel===true}','function repeatProductionParallel(){return true}'],['<h2>部队编队</h2>','<h2>WRONG</h2>']])test('unknown gameplay or markup change cannot disappear '+before,()=>{
 assert.equal(source.split(before).length-1,1);assert.equal(baseline.split(before).length-1,1);
 const changed=source.replace(before,after);assert.equal(inverse(changed),baseline.replace(before,after));assert.throws(()=>restore(changed));
});
test('unrelated trailing data survives inverse and strict restoration rejects',()=>{assert.equal(inverse(source+'\n'),baseline+'\n');assert.throws(()=>restore(source+'\n'))});
test('CSS extension has responsive focus and reduced-motion contracts',()=>{
 const css=source.match(/<style>([\s\S]*?)<\/style>/)[1];
 for(const s of ['@media(max-width:850px)','@media(max-width:480px)','@media(prefers-reduced-motion:reduce)','button:focus-visible,select:focus-visible,input:focus-visible,summary:focus-visible'])assert.ok(css.includes(s),s);
 assert.ok(!/url\s*\(/i.test(css),'no remote assets');
 assert.equal(source.split('</style>')[1].split('<script>')[0],baseline.split('</style>')[1].split('<script>')[0],'all actual markup and control order unchanged');
});
test('complete historical product restoration and mutated fragment refusal',()=>{
 const os=require('node:os'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-product-restore-test-')),root=path.resolve(__dirname,'../..');
 try{
  assert.throws(()=>restoreProductFiles(root),/outside current package/);
  fs.cpSync(path.join(root,'src'),path.join(tmp,'src'),{recursive:true});fs.writeFileSync(path.join(tmp,'index.html'),baseline);restoreProductFiles(tmp);
  for(const [name,digest]of Object.entries(contract.historicalProductInventory))assert.equal(sha(fs.readFileSync(path.join(tmp,name))),digest,name);
  for(const name of Object.keys(contract.historicalProductFiles)){
   fs.cpSync(path.join(root,'src'),path.join(tmp,'src'),{recursive:true});fs.appendFileSync(path.join(tmp,name),'\nUNREVIEWED');assert.throws(()=>restoreProductFiles(tmp));
  }
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
});
console.log(JSON.stringify({passed:results.length,failed:0,sourceSha256:sha(source),baselineSha256:sha(baseline),results,scope:'Current source identity, narrow reverse-delta negative controls, static CSS/markup contracts only; no behavior, native layout, touch or FPS claim.'},null,2));
