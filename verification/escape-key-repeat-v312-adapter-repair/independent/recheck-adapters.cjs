'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(process.argv[2]),base=path.resolve(process.argv[3]);const html=fs.readFileSync(root+'/index.html','utf8');const results=[];
function test(name,fn){try{fn();results.push({name,passed:true})}catch(e){results.push({name,passed:false,error:e.message})}}
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const script=s=>s.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)[1].replace(/function updateVisualPreviewControl\(\)\{[^\n]*\}/,'function updateVisualPreviewControl(){/* gallery sync excluded */}');
const inverse=s=>require(root+'/verification/source-delta-v311.cjs')(require(root+'/verification/source-delta-v312.cjs')(s));
const golden='ddc97779dd1501b51e998f00e901daf1d5797605aaae136eb7f8d28eed303251';
test('approved inverse reaches retained historical script golden',()=>assert.equal(hash(script(inverse(html))),golden));
test('unrelated simulation mutation still rejected by retained historical hash',()=>{const anchor='const SIMULATION_STEP=1/60;';assert.equal(html.split(anchor).length-1,1);const mutant=html.replace(anchor,'const SIMULATION_STEP=1/30;');assert.notEqual(hash(script(inverse(mutant))),golden)});
test('selection negative suite preserves all old mutation targets and assertions',()=>{const old=fs.readFileSync(base+'/verification/selection-key-repeat-negative-v311.cjs','utf8'),cur=fs.readFileSync(root+'/verification/selection-key-repeat-negative-v312.cjs','utf8');const expected=old.replace('selection-key-repeat-v311.cjs','selection-key-repeat-v312.cjs').replace("||e.code==='Space'))\";","||e.code==='Space'||e.key==='Escape'))\";");assert.equal(cur,expected)});
test('all historical verification inputs byte preserved',()=>{const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);for(const f of walk(base+'/verification')){const rel=path.relative(base,f);assert.equal(hash(fs.readFileSync(root+'/'+rel)),hash(fs.readFileSync(f)),rel)}});
test('product remains approved final hash',()=>assert.equal(hash(html),'0f469ecb007cc489df4c012736366a393fa97403b94d5b18679c22b8a9830945'));
const failed=results.filter(r=>!r.passed).length;console.log(JSON.stringify({passed:results.length-failed,failed,results,scope:'Bounded current-adapter and historical-preservation review, not full gate.'},null,2));process.exitCode=failed?1:0;
