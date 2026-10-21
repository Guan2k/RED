'use strict';
// Each mutation must fail its named behavioral assertion, never just a checksum or process crash.
const {fs,path,assert,exact,helper}=require('./depleted-ore-v315-support.cjs'),os=require('node:os'),{spawnSync}=require('node:child_process');
const source=fs.readFileSync(path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),'utf8'),results=[];
const changeHelper=(s,a,b)=>exact(s,helper,exact(helper,a,b));
const geometry='helper/exact-zero-negative-geometry',positive='helper/positive-never-marked',style='helper/nondefault-context-restored',purity='helper/full-state-command-purity',invoke='render/ground-layer-invocation';
const mutations=[
 ['positive ore incorrectly marked',s=>changeHelper(s,'o.amount<=0','o.amount<=.001'),positive],
 ['zero ore omitted',s=>changeHelper(s,'o.amount<=0','o.amount<0'),geometry],
 ['negative ore omitted',s=>changeHelper(s,'o.amount<=0','o.amount===0'),geometry],
 ['fill radius wrong',s=>changeHelper(s,"32,'#62685a'","33,'#62685a'"),geometry],
 ['outline radius wrong',s=>changeHelper(s,'31.5,0','32,0'),geometry],
 ['fill color wrong',s=>changeHelper(s,'#62685a','#62685b'),geometry],
 ['fill alpha wrong',s=>changeHelper(s,'globalAlpha=.38','globalAlpha=.39'),geometry],
 ['outline alpha wrong',s=>changeHelper(s,'globalAlpha=.62','globalAlpha=.63'),geometry],
 ['outline color wrong',s=>changeHelper(s,'#8a8e78','#8a8e79'),geometry],
 ['outline dash wrong',s=>changeHelper(s,'[8,10]','[8,9]'),geometry],
 ['outline width wrong',s=>changeHelper(s,'lineWidth=1;','lineWidth=2;'),geometry],
 ['hatch geometry wrong',s=>changeHelper(s,'x+12','x+13'),geometry],
 ['hatch width wrong',s=>changeHelper(s,'lineWidth=1.3','lineWidth=1.4'),geometry],
 ['hatch alpha wrong',s=>changeHelper(s,'globalAlpha=.65','globalAlpha=.66'),geometry],
 ['hatch color wrong',s=>changeHelper(s,'#939580','#939581'),geometry],
 ['hatches retain dash',s=>changeHelper(s,'ctx.setLineDash([]);',''),geometry],
 ['context style leak',s=>changeHelper(s,'ctx.restore()','void 0'),style],
 ['world cash mutation',s=>changeHelper(s,'ctx.save();','state.cash--;ctx.save();'),purity],
 ['ore amount mutation',s=>changeHelper(s,'ctx.save();','o.amount--;ctx.save();'),purity],
 ['command selection mutation',s=>changeHelper(s,'ctx.save();','selection.add(999);ctx.save();'),purity],
 ['missing ground invocation',s=>exact(s,'drawCoordinateGrid();drawDepletedOreBeds();drawRocks();','drawCoordinateGrid();drawRocks();'),invoke],
 ['wrong ground order',s=>exact(s,'drawCoordinateGrid();drawDepletedOreBeds();drawRocks();','drawCoordinateGrid();drawRocks();drawDepletedOreBeds();'),invoke],
 ['positive mine changed',s=>exact(s,"circle(o.x,o.y,33,'#746544')","circle(o.x,o.y,34,'#746544')"),invoke]
];
let tmp;try{tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-depleted-negative-v315-'));for(const [name,mutate,target] of mutations){try{const file=path.join(tmp,'mutated.html');fs.writeFileSync(file,mutate(source));const r=spawnSync(process.execPath,[path.join(__dirname,'depleted-ore-v315.cjs'),file,target],{encoding:'utf8',maxBuffer:8*1024*1024});assert.equal(r.status,1,'mutation must exit as assertion failure: '+r.stderr);assert.equal(r.stderr,'','no setup/runtime crash');const evidence=JSON.parse(r.stdout);assert.equal(evidence.results.length,1);const failed=evidence.results[0];assert.equal(failed.name,target);assert.equal(failed.passed,false);assert.equal(failed.errorCode,'ERR_ASSERTION','named semantic assertion required');results.push({name,passed:true,target,detectedAssertion:failed.error.split('\n')[0]})}catch(e){results.push({name,passed:false,error:e.stack})}}}finally{if(tmp)fs.rmSync(tmp,{recursive:true,force:true})}
const failed=results.filter(r=>!r.passed).length;console.log(JSON.stringify({passed:results.length-failed,failed,mutations:mutations.length,results,scope:'Targeted behavioral mutation controls. All run solely against temporary candidate copies; no historical suite/source edits or real storage.'},null,2));process.exitCode=failed?1:0;
