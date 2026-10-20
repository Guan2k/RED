'use strict';
// Exact current-only behavior adapter; no new DOM projection or field filtering.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),previous=require('./inherit-dom-v313.cjs'),change=require('./repair-repeat-case-v314.json');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),name='repair-button-repeat.cjs',original=fs.readFileSync(path.join(__dirname,name)),old=previous.programs[name];
assert.equal(hash(original),'d986a5331fab751b0a5e2f70d9a49dd5b7d753149558e9f9f39055a7f3adfbce','frozen repair program identity');
const inherited=previous.adapt(name,original);assert.equal(hash(inherited),'f8259e98c7462190609248c1558968f04ecc8f55edbfcb7530c3acef3233a113','exact previously reviewed DOM projection');assert.equal(inherited.split(change.before).length-1,1,'unique exact historical behavior case');
const updated=inherited.replace(change.before,change.after);assert.equal(updated.split(change.after).length-1,1);assert.equal(updated.replace(change.after,change.before),inherited,'only one exact case changes');
assert.equal(hash(updated),'90e02a2cae03da2df0b0dfdaab6380a1beb502ffa5a81fc5021fd65ac5fed687','exact reviewed current case output');
const programs={...previous.programs,[name]:{...old,adaptedSha256:hash(updated)}};
function adapt(file,bytes){const inherited=previous.adapt(file,bytes);if(file!==name)return inherited;assert.equal(hash(inherited),'f8259e98c7462190609248c1558968f04ecc8f55edbfcb7530c3acef3233a113');assert.equal(inherited.split(change.before).length-1,1);const result=inherited.replace(change.before,change.after);assert.equal(hash(result),programs[name].adaptedSha256);assert.equal(result.replace(change.after,change.before),inherited);return result}
module.exports={...previous,programs,adapt};
