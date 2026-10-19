let assertions=0;const countingAssert=new Proxy(require('node:assert/strict'),{get:(t,k)=>typeof t[k]==='function'? (...a)=>{assertions++;return t[k](...a)}:t[k]});
'use strict';
// NEW behavioral negative controls. Mutate in-memory text only; never edit product.
const fs=require('node:fs'),path=require('node:path'),assert=countingAssert,crypto=require('node:crypto');
const {runSuite,replaceOnce,game,richFixture,toggle,frame}=require('./render-preview-v309.cjs');
const sourceFile=path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),source=fs.readFileSync(sourceFile,'utf8'),baseline=require('./restore-v293.cjs')(require('./restore-v294.cjs')(require('./restore-v295.cjs')(require('./restore-v296-from-v309.cjs')(source)))),results=[];
const buildingFunction=source.slice(source.indexOf('function drawBuildingPreview(e){'),source.indexOf('const unitTrackMemory'));
const mutants=[
  ['building-drops-construction-progress', buildingFunction, buildingFunction.replace('drawConstructionProgress(e);',''), '^building-dynamics/power$'],
  ['building-drops-factory-progress', buildingFunction, buildingFunction.replace('drawFactoryProgress(e)',''), '^building-dynamics/factory$'],
  ['building-loses-turret-angle', buildingFunction, buildingFunction.replace('ctx.rotate(e.angle);',''), '^building-dynamics/turret$'],
  ['building-restores-before-construction', buildingFunction, buildingFunction.replace('if(e.build){','ctx.restore();ctx.save();if(e.build){'), '^building-dynamics/turret$'],
  ['building-failed-cache-retries', 'if(buildingArtPathCache!==undefined)return;', 'if(buildingArtPathCache)return;', '^building-failure/cache-construction-latch$'],
  ['building-initializer-removed', 'if(vehicleArtPreview){initializeUnitArtPaths();initializeBuildingArtPaths()}', 'if(vehicleArtPreview){initializeUnitArtPaths()}', '^lifecycle/default-off'],
  ['building-mutates-world', 'function drawBuildingPreview(e){', 'function drawBuildingPreview(e){state.cash++;', '^cached-render/full-frame-all-units'],
  ['building-consumes-rng', 'function drawBuildingPreview(e){', 'function drawBuildingPreview(e){Math.random();', '^cached-render/full-frame-all-units'],
  ['building-branch-ignored', ':(vehicleArtPreview?drawBuildingPreview(e):drawBuilding(e));', ':drawBuilding(e);', '^cached-render/full-frame-all-units'],
  ['building-cached-fill-alpha', 'buildingArtPathCache?.[index];if(path){try{ctx.fill(path);continue}', 'buildingArtPathCache?.[index];if(path){try{ctx.globalAlpha=.5;ctx.fill(path);continue}', '^cached-render/full-frame-all-units'],
  ['default-on', 'let vehicleArtPreview=false;', 'let vehicleArtPreview=true;', '^lifecycle/default-off'],
  ['eager-path-allocation','let unitArtPathCache;','let unitArtPathCache;initializeUnitArtPaths();','^lifecycle/default-off'],
  ['render-ignores-preview-checkbox','defs[e.type].speed?(vehicleArtPreview?drawUnitPreview(e):drawUnit(e)):(vehicleArtPreview?drawBuildingPreview(e):drawBuilding(e))','defs[e.type].speed?drawUnit(e):drawBuilding(e)','^cached-render/full-frame-all-units'],
  ['preview-mutates-world','function drawUnitPreview(e){','function drawUnitPreview(e){state.cash+=1;','^cached-render/full-frame-all-units'],
  ['preview-consumes-rng','function drawUnitPreview(e){','function drawUnitPreview(e){Math.random();','^cached-render/full-frame-all-units'],
  ['preview-skips-track-phase','let phase=unitTrackPhase(e),r=e.r,color=', 'let phase=0,r=e.r,color=','^track-phase/'],
  ['preview-double-track-read','let phase=unitTrackPhase(e),r=e.r,color=', 'let phase=unitTrackPhase(e)+0*unitTrackPhase(e),r=e.r,color=','^track-phase/'],
  ['failed-cache-rebuilds','if(unitArtPathCache!==undefined)return;','if(unitArtPathCache)return;','^failure/cache-latches-constructor:5$'],
  ['fill-failure-not-latched','catch{unitArtPathCache=null}}ctx.beginPath();','catch{}}ctx.beginPath();','^failure/fill-path-latches-at-2$'],
  ['following-shot-consumes-stale-current-path',"for(let s of state.shots)circle(s.x,s.y,3,'#ffedac');","for(let s of state.shots){ctx.arc(s.x,s.y,3,0,Math.PI*2);ctx.fillStyle='#ffedac';ctx.fill()}",'^cached-render/full-frame-all-units'],
  ['following-unit-consumes-stale-current-path','ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);\n  rect(-r+2', 'ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);ctx.stroke();\n  rect(-r+2','^cached-render/full-frame-all-units'],
  ['next-frame-terrain-consumes-stale-current-path',"function drawTerrain(){let meridian=", "function drawTerrain(){ctx.stroke();let meridian=",'^cached-render/full-frame-polygon-tail-no-effects'],
  ['cached-fill-changes-alpha', 'unitArtPathCache[cacheIndex]:null;if(path){try{ctx.fill(path);return}', 'unitArtPathCache[cacheIndex]:null;if(path){try{ctx.globalAlpha=.5;ctx.fill(path);return}', '^cached-render/full-frame-all-units'],
  ['fallback-path-missing-begin', '}}ctx.beginPath();unitArtTrace(ctx,points);ctx.fill()}', '}}unitArtTrace(ctx,points);ctx.fill()}', '^cached-render/full-frame-all-units'],
  ['new-round-resets-choice','function start(){clearImportReadReceipt();','function start(){vehicleArtPreview=false;clearImportReadReceipt();','^lifecycle/new-round'],
  ['cached-path-wrong-geometry','let path=new Path2D();unitArtTrace(path,points);return path','let path=new Path2D();unitArtTrace(path,points);path.lineTo(999,999);return path','^cached-render/full-frame-all-units']
];
// Expected behavioral rejection, not merely any exception or nonzero failure count.
const expectedDiagnostics={
"building-drops-construction-progress":{"failureClass": "AssertionError", "caseName": "building-dynamics/power", "failureCode": "ERR_ASSERTION", "firstLine": "building dynamic tail equals original power"},
"building-drops-factory-progress":{"failureClass": "AssertionError", "caseName": "building-dynamics/factory", "failureCode": "ERR_ASSERTION", "firstLine": "building dynamic tail equals original factory"},
"building-loses-turret-angle":{"failureClass": "AssertionError", "caseName": "building-dynamics/turret", "failureCode": "ERR_ASSERTION", "firstLine": "building dynamic tail equals original turret"},
"building-restores-before-construction":{"failureClass": "AssertionError", "caseName": "building-dynamics/turret", "failureCode": "ERR_ASSERTION", "firstLine": "building dynamic tail equals original turret"},
"building-failed-cache-retries":{"failureClass": "AssertionError", "caseName": "building-failure/cache-construction-latch", "failureCode": "ERR_ASSERTION", "firstLine": "building failed cache never reconstructed"},

  'building-initializer-removed':{failureClass:'AssertionError',caseName:'lifecycle/default-off-lazy-cache-real-change-handler',failureCode:'ERR_ASSERTION',firstLine:'enabling preview initializes building cache'},
  'building-mutates-world':{failureClass:'AssertionError',caseName:'cached-render/full-frame-all-units-hp-shots-effects',failureCode:'ERR_ASSERTION',firstLine:'all-units-hp-shots-effects does not alter world/input'},
  'building-consumes-rng':{failureClass:'Error',caseName:'cached-render/full-frame-all-units-hp-shots-effects',failureCode:null,firstLine:'Render or preview toggle consumed RNG'},
  'building-branch-ignored':{failureClass:'AssertionError',caseName:'cached-render/full-frame-all-units-hp-shots-effects',failureCode:'ERR_ASSERTION',firstLine:'enabled preview renderer uses building bodies'},
  'building-cached-fill-alpha':{failureClass:'AssertionError',caseName:'cached-render/full-frame-all-units-hp-shots-effects',failureCode:'ERR_ASSERTION',firstLine:'all-units-hp-shots-effects frame 0 paint order, geometry, styles and clip state'},
  "default-on": {
    "failureClass": "AssertionError",
    "caseName": "lifecycle/default-off-lazy-cache-real-change-handler",
    "failureCode": "ERR_ASSERTION",
    "firstLine": "fresh page has preview off and an uninitialized cache"
  },
  "eager-path-allocation": {
    "failureClass": "AssertionError",
    "caseName": "lifecycle/default-off-lazy-cache-real-change-handler",
    "failureCode": "ERR_ASSERTION",
    "firstLine": "fresh page has preview off and an uninitialized cache"
  },
  "render-ignores-preview-checkbox": {
    "failureClass": "AssertionError",
    "caseName": "cached-render/full-frame-all-units-hp-shots-effects",
    "failureCode": "ERR_ASSERTION",
    "firstLine": "enabled preview renderer uses cached vehicle paths"
  },
  "preview-mutates-world": {
    "failureClass": "AssertionError",
    "caseName": "cached-render/full-frame-all-units-hp-shots-effects",
    "firstLine": "all-units-hp-shots-effects does not alter world/input",
    "failureCode": "ERR_ASSERTION"
  },
  "preview-consumes-rng": {
    "failureClass": "Error",
    "caseName": "cached-render/full-frame-all-units-hp-shots-effects",
    "firstLine": "Render or preview toggle consumed RNG",
    "failureCode": null
  },
  "preview-skips-track-phase": {
    "failureClass": "AssertionError",
    "caseName": "track-phase/visible-unit-phase-and-one-call-per-frame-across-toggles",
    "firstLine": "exactly one track-phase update per visible vehicle",
    "failureCode": "ERR_ASSERTION"
  },
  "preview-double-track-read": {
    "failureClass": "AssertionError",
    "caseName": "track-phase/visible-unit-phase-and-one-call-per-frame-across-toggles",
    "firstLine": "exactly one track-phase update per visible vehicle",
    "failureCode": "ERR_ASSERTION"
  },
  "failed-cache-rebuilds": {
    "failureClass": "AssertionError",
    "caseName": "failure/cache-latches-constructor:5",
    "firstLine": "failed cache never reconstructed",
    "failureCode": "ERR_ASSERTION"
  },
  "fill-failure-not-latched": {
    "failureClass": "AssertionError",
    "caseName": "failure/fill-path-latches-at-2",
    "failureCode": "ERR_ASSERTION",
    "firstLine": "failed path fill is never retried after its latch"
  },
  "following-shot-consumes-stale-current-path": {
    "failureClass": "AssertionError",
    "caseName": "cached-render/full-frame-all-units-hp-shots-effects",
    "firstLine": "all-units-hp-shots-effects frame 0 paint order, geometry, styles and clip state",
    "failureCode": "ERR_ASSERTION"
  },
  "following-unit-consumes-stale-current-path": {
    "failureClass": "AssertionError",
    "caseName": "cached-render/full-frame-all-units-hp-shots-effects",
    "firstLine": "all-units-hp-shots-effects frame 0 paint order, geometry, styles and clip state",
    "failureCode": "ERR_ASSERTION"
  },
  "next-frame-terrain-consumes-stale-current-path": {
    "failureClass": "AssertionError",
    "caseName": "cached-render/full-frame-polygon-tail-no-effects",
    "firstLine": "polygon-tail-no-effects frame 1 paint order, geometry, styles and clip state",
    "failureCode": "ERR_ASSERTION"
  },
  "cached-fill-changes-alpha": {
    "failureClass": "AssertionError",
    "caseName": "cached-render/full-frame-all-units-hp-shots-effects",
    "firstLine": "all-units-hp-shots-effects frame 0 paint order, geometry, styles and clip state",
    "failureCode": "ERR_ASSERTION"
  },
  "fallback-path-missing-begin": {
    "failureClass": "AssertionError",
    "caseName": "cached-render/full-frame-all-units-hp-shots-effects",
    "firstLine": "all-units-hp-shots-effects frame 0 paint order, geometry, styles and clip state",
    "failureCode": "ERR_ASSERTION"
  },
  "new-round-resets-choice": {
    "failureClass": "AssertionError",
    "caseName": "lifecycle/new-round-retains-choice-fresh-page-starts-off",
    "failureCode": "ERR_ASSERTION",
    "firstLine": "new round preserves enabled preview choice"
  },
  "cached-path-wrong-geometry": {
    "failureClass": "AssertionError",
    "caseName": "cached-render/full-frame-all-units-hp-shots-effects",
    "firstLine": "all-units-hp-shots-effects frame 0 paint order, geometry, styles and clip state",
    "failureCode": "ERR_ASSERTION"
  }
};
function intendedFailure(result,expected){
  if(result.name!==expected.caseName||result.passed!==false)return false;
  if(result.errorName!==expected.failureClass||result.errorCode!==expected.failureCode)return false;
  return expected.exactMessage!==undefined?result.error===expected.exactMessage:result.error.split('\n')[0]===expected.firstLine;
}
const prerequisites=new Map();
for(const[name,before,after,filter]of mutants){try{
  const expected=expectedDiagnostics[name];
  if(!prerequisites.has(filter))prerequisites.set(filter,runSuite({sourceText:source,baselineText:baseline,filter}));
  const prerequisite=prerequisites.get(filter);
  assert.equal(prerequisite.failed,0,'unmodified selected case must pass first');
  assert.deepEqual(prerequisite.results.map(x=>x.name),[expected.caseName],'exact unmodified selected-case prerequisite');
  const mutated=replaceOnce(source,before,after),report=runSuite({sourceText:mutated,baselineText:baseline,filter});
  assert.equal(report.results.length,1,'exactly the intended selected case executes');
  assert.equal(report.failed,1,'one intended behavioral rejection required');
  assert.ok(intendedFailure(report.results[0],expected),'must match intended failure class and narrowly anchored diagnostic; got '+report.results[0].stack);
  // This originally unlabeled assertion also has an independent renderer witness.
  if(name==='render-ignores-preview-checkbox'){
    const probe=game(mutated);probe.start();richFixture(probe);toggle(probe,true);frame(probe);
    assert.equal(probe.run('vehicleArtPreview'),true,'checkbox really enables lexical preference');
    assert.equal(probe.recorder.stats.pathFills,0,'ignored rendering branch never uses enabled path cache');
    assert.equal(probe.run('unitArtPathCache.length'),10,'cache exists despite ignored rendering branch');
  }
  results.push({name,passed:true,prerequisite:expected.caseName,rejectedBy:[expected.caseName],failureClass:expected.failureClass,failureCode:expected.failureCode,firstReason:report.results[0].error.split('\n')[0]});
}catch(e){results.push({name,passed:false,error:e.message})}}
try{
  for(const expected of Object.values(expectedDiagnostics)){
    for(const failureClass of ['TypeError','SyntaxError','ReferenceError'])assert.equal(intendedFailure({name:expected.caseName,passed:false,error:expected.exactMessage??expected.firstLine,errorName:failureClass,errorCode:expected.failureCode,stack:failureClass+': unrelated setup exception'},expected),false,'generic setup errors never count');
    assert.equal(intendedFailure({name:expected.caseName,passed:false,error:'Unrelated assertion failure',errorName:expected.failureClass,errorCode:expected.failureCode,stack:expected.failureClass+': Unrelated assertion failure'},expected),false,'wrong semantic failure never counts');
  }
  results.push({name:'diagnostic-gates-reject-unrelated-errors',passed:true,cases:104});
}catch(e){results.push({name:'diagnostic-gates-reject-unrelated-errors',passed:false,error:e.message})}
assert.equal(new Set(results.map(x=>x.name)).size,results.length);
assert.equal(fs.readFileSync(sourceFile,'utf8'),source,'product source never edited');
const report={assertions,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),results,scope:'In-memory behavioral mutations tested by complete product render/lifecycle execution, with passing unmodified selected-case prerequisites and exact intended exception-class/semantic-diagnostic gates. No product file mutations, real browser, storage/save/load/import/export, pixel/FPS claim.'};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
