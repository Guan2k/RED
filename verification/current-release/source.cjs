'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const contract=require('./source-contract.json'),bytes=fs.readFileSync(path.join(__dirname,'changes.json'));
assert.equal(sha(bytes),contract.changesSha256,'reviewed delta identity');
const changes=JSON.parse(bytes);assert.equal(changes.length,contract.boundaries);
function inverse(raw){
 for(const [i,c]of [...changes].reverse().entries()){
  assert.equal(raw.split(c.after).length-1,1,'unique reviewed current boundary '+i);
  raw=raw.replace(c.after,c.before);
 }
 return raw;
}
function restore(raw){
 assert.equal(sha(raw),contract.currentSha256,'exact current index before historical restoration');
 const old=inverse(raw);assert.equal(sha(old),contract.baselineSha256,'exact historical v318 output');return old;
}
function restoreProductFiles(destination){
 const currentRoot=fs.realpathSync(path.resolve(__dirname,'../..')),target=fs.realpathSync(destination),relative=path.relative(currentRoot,target);
 assert.ok(relative!==''&&(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative)),'historical product destination must be outside current package');
 for(const [name,entry]of Object.entries(contract.historicalProductFiles)){
  assert.ok(['src/styles.css','src/script/02-gameplay.jsfrag','src/script/03-renderer.jsfrag'].includes(name),'fixed historical product path');
  const file=path.join(destination,name);let raw=fs.readFileSync(file,'utf8');assert.equal(sha(raw),entry.currentSha256,'historical product input '+name);
  for(const i of entry.inverseIndexes){const c=changes[i];assert.equal(raw.split(c.after).length-1,1,'exact historical fragment inverse');raw=raw.replace(c.after,c.before)}
  assert.equal(sha(raw),entry.baselineSha256,'exact historical product output '+name);fs.writeFileSync(file,raw);
 }
 const receipt=fs.readFileSync(path.join(__dirname,'historical/source-build-receipt.json'));assert.equal(sha(receipt),contract.historicalReceiptSha256,'archived historical build receipt');fs.writeFileSync(path.join(destination,'source-build-receipt.json'),receipt);
 for(const [name,digest]of Object.entries(contract.historicalProductInventory))assert.equal(sha(fs.readFileSync(path.join(destination,name))),digest,'complete historical product inventory '+name);
}
module.exports={sha,contract,changes,inverse,restore,restoreProductFiles};
