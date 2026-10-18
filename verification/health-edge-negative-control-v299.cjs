'use strict';const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');const {runSuite}=require('./health-edge-v299.cjs');const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),baseline=require('./restore-v296-from-v299.cjs')(source),results=[];
const bg="rect(e.x-e.r,healthY,e.r*2,4,'#16231b');",fg="rect(e.x-e.r,healthY,e.r*2*Math.max(0,e.hp/e.max),4,e.team?'#e78f6a':'#a3db81')";
const mutants=[
 ['remove-clamp','Math.max(0,e.y-e.r-12)','e.y-e.r-12','natural pointer route retains four-pixel bars'],
 ['wrong-min','Math.max(0,e.y-e.r-12)','Math.min(0,e.y-e.r-12)','natural pointer route retains four-pixel bars'],
 ['only-background',fg,fg.replace('healthY','e.y-e.r-12'),'natural pointer route retains four-pixel bars'],
 ['changed-width',bg,bg.replace('e.r*2,','e.r*2+1,'),'natural pointer route emits original health pair'],
 ['changed-predicate','if(e.hp<e.max||selection.has(e.id)){let healthY','if(e.hp<e.max){let healthY','natural pointer route emits original health pair'],
 ['unnecessary-inset','Math.max(0,e.y-e.r-12)','Math.max(1,e.y-e.r-12)','natural pointer route retains four-pixel bars'],
 ['changed-world','let healthY=Math.max(0,e.y-e.r-12);','let healthY=Math.max(0,e.y-e.r-12);state.cash++;','natural route world/input equality'],
 ['rng','let healthY=Math.max(0,e.y-e.r-12);','let healthY=Math.max(0,e.y-e.r-12);Math.random();','unexpected RNG'],
 ['reordered-pair',bg+fg,fg+';'+bg.slice(0,-1),'health branch exact paint semantics'],
 ['changed-ratio',fg,fg.replace('Math.max(0,e.hp/e.max)','Math.min(1,Math.max(0,e.hp/e.max))'),'health branch exact paint semantics']
];
for(const[name,before,after,message]of mutants){assert.equal(source.split(before).length-1,1);try{runSuite({sourceText:source.replace(before,after),baselineText:baseline,identity:false});throw Error('mutant survived')}catch(e){const accepted=(e.name==='AssertionError'||name==='rng'&&e.name==='Error')&&e.message.includes(message);results.push({name,passed:accepted,diagnostic:e.message.split('\n')[0],errorName:e.name});}}
const report={passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,results,scope:'In-memory behavioral mutants; exact named assertion diagnostics required. Historical product files unchanged.'};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
