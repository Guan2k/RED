'use strict';
// Six explicit focused dispatches change. The entire remaining historical gate is retained.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Module=require('node:module');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function prepare(){
 const contract=require('./release-contract.json'),root=path.resolve(__dirname,'../..');
 for(const [name,digest] of Object.entries(contract.files))assert.equal(hash(fs.readFileSync(path.join(root,name))),digest,'release dependency identity '+name);
 const filename=path.join(root,contract.historicalRunner),original=fs.readFileSync(filename,'utf8');let program=original;
 for(const [before,after] of contract.dispatch){
  assert.equal(program.split("'"+before+"'").length-1,1,'exactly one old dispatch '+before);
  assert.equal(program.split("'"+after+"'").length-1,0,'no existing new dispatch '+after);
  program=program.replace("'"+before+"'","'"+after+"'");
 }
 let restored=program;
 for(const [before,after] of contract.dispatch){assert.equal(program.split("'"+after+"'").length-1,1);restored=restored.replace("'"+after+"'","'"+before+"'")}
 assert.equal(restored,original,'all other gates retained byte-for-byte');
 return {filename,program,dispatch:contract.dispatch};
}
if(require.main===module){
 const prepared=prepare();
 if(process.argv.includes('--dispatch-check'))console.log(JSON.stringify({passed:6,failed:0,results:prepared.dispatch.map(([historical,stable])=>({name:historical,passed:true,stable})),scope:'Dispatch structure and dependency integrity only; no behavioral gate executed.'},null,2));
 else {const runner=new Module(prepared.filename,module);runner.filename=prepared.filename;runner.paths=Module._nodeModulePaths(path.dirname(prepared.filename));runner._compile(prepared.program,prepared.filename);}
}
module.exports={prepare};
