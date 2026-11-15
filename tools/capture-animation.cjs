'use strict';
// Optional developer capture tool: npm install playwright outside the player package.
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const [before,after,out]=process.argv.slice(2);if(!out)throw Error('usage: node tools/capture-animation.cjs before.html after.html output-directory');
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const report={browser:browser.version(),viewport:{width:1440,height:1100},deviceScaleFactor:1,theme:'dark',scenario:'classic; deterministic destruction of one HQ and two tanks, simulation frozen for matched effect ages',measurements:[]};
 try{for(const [label,file]of [['before',before],['after',after]]){
  const page=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1,colorScheme:'dark'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{let seed=29419;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};window.requestAnimationFrame=()=>0;});
  await page.goto(pathToFileURL(path.resolve(file)).href);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{reset();state.started=true;$('overlay').classList.add('hidden');state.fx=[];spawnDestructionEffects({id:901,type:'hq',r:40,x:620,y:390});spawnDestructionEffects({id:902,type:'tank',r:17,x:470,y:430});spawnDestructionEffects({id:903,type:'tank',r:17,x:760,y:440});globalThis.captureEffects=JSON.parse(JSON.stringify(state.fx));updateUI();});
  for(const age of [.08,.24,.55,1.3]){
   await page.evaluate(age=>{state.fx=captureEffects.map(f=>({...f,t:f.max-age})).filter(f=>f.t>0);render()},age);
   await page.locator('canvas').first().screenshot({path:path.join(out,`${label}-${age}.png`)});
  }
  await page.screenshot({path:path.join(out,`${label}-page.png`),fullPage:true});
  const performance=await page.evaluate(async()=>{
   const measurements=[];
   for(const count of [60,128,256]){
    state.fx=[];for(let i=0;i<count;i++){const base=captureEffects[i%captureEffects.length];state.fx.push({...base,x:100+(i%12)*85,y:120+Math.floor(i/12)%7*85,t:base.max*.65});}
    const times=[];for(let i=0;i<140;i++){const start=window.performance.now();render();const elapsed=window.performance.now()-start;if(i>=20)times.push(elapsed);await new Promise(resolve=>setTimeout(resolve,0));}
    times.sort((a,b)=>a-b);measurements.push({effects:count,renderCpuMedianMs:times[60],renderCpuP95Ms:times[114],samples:times.length});
   }
   return measurements;
  });
  report.measurements.push({label,performance,errors});if(errors.length)throw Error(errors.join('\n'));await page.close();
 }
 fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
