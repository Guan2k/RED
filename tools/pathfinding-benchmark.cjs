'use strict';
// Node-only search microbenchmark; not a browser frame-rate or input-latency measurement.
const fs=require('node:fs'),path=require('node:path');
const baseline=fs.readFileSync(path.join(__dirname,'fixtures/pathfinding-baseline.cjs'),'utf8');
const source=fs.readFileSync(path.join(__dirname,'../src/script/02-gameplay.jsfrag'),'utf8');
const current=['approachDestination','movementSegmentClear','findMovementRoute'].map(name=>source.split(/\r?\n/).find(line=>line.startsWith('function '+name+'('))).join('\n');
function compile(code,walls){
  return new Function('movementObstacles','terrainObstacles','dist','clamp','WIDTH','HEIGHT','module',code+'\nreturn findMovementRoute;')(
    ()=>walls,()=>walls,(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),(n,a,b)=>Math.max(a,Math.min(b,n)),1200,800,{exports:{}});
}
function median(values){return values.sort((a,b)=>a-b)[Math.floor(values.length/2)];}
const results=[];
for(const [name,walls] of [
  ['direct',[]],
  ['detour',Array.from({length:16},(_,i)=>({x:600,y:20+i*40,r:25}))],
  ['unreachable',Array.from({length:21},(_,i)=>({x:600,y:i*40,r:25}))]
]){
  const routes=[compile(baseline,walls),compile(current,walls)],samples=[[],[]],iterations=150;
  const start={x:100,y:100,r:12},end={x:1100,y:100};
  for(const route of routes)for(let i=0;i<50;i++)route(start,end);
  for(let round=0;round<9;round++)for(const index of (round%2?[1,0]:[0,1])){
    const begin=performance.now();
    for(let i=0;i<iterations;i++)routes[index](start,end);
    samples[index].push((performance.now()-begin)/iterations);
  }
  const beforeMs=median(samples[0]),afterMs=median(samples[1]);
  results.push({name,beforeMedianMs:beforeMs,afterMedianMs:afterMs,ratio:afterMs/beforeMs,samples:9,searchesPerSample:iterations});
}
console.log(JSON.stringify({node:process.version,baseline:'ddc54de',scope:'Native Node search microbenchmark; no browser FPS guarantee.',results},null,2));
