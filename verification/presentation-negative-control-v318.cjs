'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {runSuite}=require('./presentation-v318.cjs'),html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),results=[];
function exact(s,a,b){assert.equal(s.split(a).length-1,1,'unique semantic mutation anchor');return s.replace(a,b)}
const mutants=[
 ['route geometry',"ctx.moveTo(e.x,e.y);for(let p of path)","ctx.moveTo(e.x+1,e.y);for(let p of path)"],
 ['route width',"ctx.strokeStyle=path.length>1?'#80d4e0':e.attackMove?'#e9be72':'#aee099';ctx.lineWidth=1.5;","ctx.strokeStyle=path.length>1?'#80d4e0':e.attackMove?'#e9be72':'#aee099';ctx.lineWidth=2;"],
 ['old entity-interleaved route layer',require('./changes-v317.json')[13].after,require('./changes-v317.json')[13].before],
 ['terrain base palette',"frontier?'#5b553c':'#30423b'","frontier?'#5b553c':'#30423c'"],
 ['terrain road width',"ctx.strokeStyle='#24332b';ctx.lineWidth=76","ctx.strokeStyle='#24332b';ctx.lineWidth=75"],
 ['building foundation light',"rect(-r-3,-r-3,r*2+6,2,'#82958a');","rect(-r-3,-r-3,r*2+6,3,'#82958a');"],
 ['unit highlight color',"e.team?'#d58a71':'#adc5ad'","e.team?'#d58a71':'#adc5ac'"],
 ['selection frame outline',"ctx.strokeStyle='#b9f5d2';ctx.lineWidth=1;ctx.strokeRect(x,y,w,w);","ctx.strokeStyle='#b9f5d2';ctx.lineWidth=2;ctx.strokeRect(x,y,w,w);"],
 ['health separator width',"rect(e.x-e.r-1,healthY-1,e.r*2+2,6,'#0b171c');","rect(e.x-e.r-1,healthY-1,e.r*2+1,6,'#0b171c');"],
 ['critical threshold',"4,e.hp/e.max<.3?'#ffbc78'","4,e.hp/e.max<=.3?'#ffbc78'"],
 ['order receipt marker',"rect(f.x-2,f.y-2,4,4,'#e3ffea');","rect(f.x-2,f.y-2,3,4,'#e3ffea');"],
 ['unrelated world mutation',"function drawTerrain(){","function drawTerrain(){state.cash++;"],
 ['unrelated input mutation',"function drawTerrain(){","function drawTerrain(){attackMode=!attackMode;"],
 ['unexpected RNG',"function drawTerrain(){","function drawTerrain(){Math.random();"],
 ['unrelated shot color',"circle(s.x,s.y,3,'#ffedac')","circle(s.x,s.y,3,'#ffffff')"]
];
const target='render/classic/off',positive=runSuite({only:target});assert.equal(positive.failed,0,'named full candidate render prerequisite');
for(const [name,a,b]of mutants){const r=runSuite({sourceText:exact(html,a,b),only:target,identity:false});assert.equal(r.results.length,1);assert.equal(r.results[0].name,target);assert.equal(r.results[0].passed,false,'behavior must reject '+name);results.push({name,passed:true,target,errorName:r.results[0].errorName});}
const expected=require('./presentation-expected-v317.cjs'),historical=require('./restore-v314-from-v318.cjs')(html);
for(const name of ['drawBuilding','drawBuildingPreview','drawUnit','drawTerrain','render']){
 const original=expected.extract(historical,name),adapted=expected.adaptFunction(original,name);assert.throws(()=>expected.adaptFunction(adapted,name),{code:'ERR_ASSERTION'});results.push({name:'expected adapter rejects double transform '+name,passed:true});
 const untouched=original.replace('{','{/* unrelated sentinel remains visible */'),preserved=expected.adaptFunction(untouched,name);assert.equal(preserved,adapted.replace('{','{/* unrelated sentinel remains visible */'));assert.notEqual(preserved,adapted);results.push({name:'expected adapter preserves unrelated bytes '+name,passed:true});
}
console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'Named full-render behavioral detections without candidate identity gate. Expected host and all comparison assertions unchanged. Includes unrelated paint, world, input and RNG mutations.'},null,2));
