'use strict';
// Reuse the existing parameterized pilot's source-authorizing VM, not another DOM fork.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../../index.html'));
const expected=hash(fs.readFileSync(source)),loads=[];
const {createLoader}=require('../parameterized-pilot/vm-environment-provenance.cjs');
const loadGame=createLoader((actual,raw,options)=>{
 assert.equal(actual,source,'only requested candidate may load');
 assert.equal(hash(raw),expected,'candidate bytes cannot change during suite');
 return {sourceSha256:expected,seed:options.seed??198199};
},(receipt,script)=>loads.push({...receipt,scriptSha256:hash(script)}));
process.on('exit',()=>{
 if(process.env.RED_STABLE_RECEIPT)fs.writeFileSync(process.env.RED_STABLE_RECEIPT,JSON.stringify({schema:1,sourceSha256:expected,compiledLoads:loads.length,loads},null,2)+'\n');
});
module.exports={loadGame};
