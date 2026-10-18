import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dist, clamp } from './src/geometry.mjs';
import { root, marker, exportSuffix, sha256, assemble, build } from './build.mjs';
const template = readFileSync(join(root, 'src/index.template.html'), 'utf8');
const module = readFileSync(join(root, 'src/geometry.mjs'), 'utf8');
const manifest = JSON.parse(readFileSync(join(root, 'build-manifest.json'), 'utf8'));
test('distance: identical, negative and 3-4-5 coordinates; inputs unchanged', () => {
  const a = Object.freeze({x:-3,y:-4}), b = Object.freeze({x:0,y:0});
  assert.equal(dist(a,b),5); assert.equal(dist(b,a),5); assert.equal(dist(a,a),0);
});
test('clamp: lower, interior, upper, equal bounds and infinities', () => {
  for (const [n,a,b,want] of [[-1,0,10,0],[5,0,10,5],[11,0,10,10],[3,2,2,2],[-Infinity,0,10,0],[Infinity,0,10,10]]) assert.equal(clamp(n,a,b),want);
  assert.ok(Number.isNaN(clamp(NaN,0,10)));
});
test('repeated assembly exactly matches frozen baseline hash and size', () => {
  const a=build(), b=build(); assert.deepEqual(a,b); assert.equal(a.length,456018);
  assert.equal(sha256(a),'e5edd8f7384d37a356071c66c6788e681f3e45ad9ab224a52a783692b5ca0884');
  assert.ok(!a.includes(Buffer.from(marker))); assert.ok(!a.includes(Buffer.from(exportSuffix)));
});
for (const [name, value] of [['missing',template.replace(marker,'')],['duplicate',template+marker],['changed',template.replace(marker,marker.replace('GEOMETRY','OTHER'))]]) {
  test(`${name} template marker rejected`,()=>assert.throws(()=>assemble(value,module,manifest),/exactly one unchanged marker/));
}
test('changed template outside marker rejected',()=>assert.throws(()=>assemble(template+' ',module,manifest),/template hash mismatch/));
test('changed module implementation rejected',()=>assert.throws(()=>assemble(template,module.replace('Math.hypot','Math.max'),manifest),/module hash mismatch/));
test('missing or duplicate export footer rejected',()=>{
  assert.throws(()=>assemble(template,module.replace(exportSuffix,''),manifest),/terminal named export/);
  assert.throws(()=>assemble(template,module+exportSuffix,manifest),/terminal named export/);
});
test('wrong output identity and unsupported manifest rejected',()=>{
  assert.throws(()=>assemble(template,module,{...manifest,baselineSha256:'0'.repeat(64)}),/baseline identity mismatch/);
  assert.throws(()=>assemble(template,module,{...manifest,schemaVersion:2}),/unsupported manifest/);
});
test('missing source input rejected',()=>{
  const dir=mkdtempSync(join(tmpdir(),'red-pilot-missing-'));
  try { mkdirSync(join(dir,'src')); writeFileSync(join(dir,'src/index.template.html'),template); assert.throws(()=>build(dir),/ENOENT/); }
  finally { rmSync(dir,{recursive:true,force:true}); }
});
