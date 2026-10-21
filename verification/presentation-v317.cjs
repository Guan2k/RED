'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const h=require('./render-preview-v317.cjs'),expected=require('./presentation-expected-v317.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),baseline=require('./restore-v314-from-v317.cjs')(source);
assert.equal(hash(baseline),'d0fa1baa9faed8be2a05f050b2289ea5a419654b4d95f48cef0ff2742e52091d','exact frozen v314 expected host');
const complete=g=>g.run('JSON.stringify({state,uid,groups,selection:[...selection],placement,attackMode,drag,ordinaryCommandMode,appendCommandMode,ordinaryCommandGesture,restartPrompt,resumeAfterCancel,simulationRemainder,mouse,hoverActive,durable:durableBattleSignature()})');
function runSuite({sourceText=source,only,identity=true}={}){
 const results=[];function test(name,fn){if(only&&name!==only)return;try{results.push({name,passed:true,...fn()})}catch(e){results.push({name,passed:false,errorName:e.name,errorCode:e.code||null,error:e.stack})}}
 if(identity)test('source/exact-reviewed-presentation-functions',()=>{
  assert.equal(require('./restore-v314-from-v317.cjs')(sourceText),baseline);
  for(const name of ['drawBuilding','drawBuildingPreview','drawUnit','drawTerrain','render'])assert.equal(expected.extract(sourceText,name),expected.expectedFunctionSource(baseline,name),'exact expected-only visual edits '+name);
  for(const name of ['drawBuildingFoundation','drawSelectionFrame'])assert.equal(expected.extract(sourceText,name),name==='drawBuildingFoundation'?expected.foundation:expected.selection,'explicit independent helper '+name);
  for(const name of ['drawConstructionProgress','drawFactoryProgress','drawFactoryRallies','drawUnitPreview','initializeUnitArtPaths','oreLabelLayout','drawDepletedOreBeds'])assert.equal(expected.extract(sourceText,name),expected.extract(baseline,name),'unchanged existing behavior '+name);
  const script=x=>x.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)[1];let expectedScript=script(baseline);
  for(const name of ['drawBuilding','drawBuildingPreview','drawUnit','drawTerrain','render']){const original=expected.extract(expectedScript,name);assert.equal(expectedScript.split(original).length-1,1);expectedScript=expectedScript.replace(original,expected.expectedFunctionSource(expectedScript,name));}
  expectedScript=expectedScript.replace('function drawBuilding(e){','// Presentation only: fixed north-west light, no filters, gradients or simulation writes.\n'+expected.foundation+'\n'+expected.selection+'\nfunction drawBuilding(e){');
  const oldTiles='const terrainAccentTiles=[];for(let y=0;y<HEIGHT;y+=40)for(let x=0;x<WIDTH;x+=40)if(Math.sin(x*13+y*27)>.2)terrainAccentTiles.push([x,y]);',newTiles='const terrainAccentTiles=[];for(let y=0;y<HEIGHT;y+=80)for(let x=0;x<WIDTH;x+=80)if(Math.sin(x*13+y*27)>.55)terrainAccentTiles.push([x,y]);';assert.equal(expectedScript.split(oldTiles).length-1,1);expectedScript=expectedScript.replace(oldTiles,newTiles);
  const reasonAnchor="let purchaseReason=productionPurchaseReason(b.dataset.unit);",reasonWrite="setReadonlyPanelProperty($('productionReason'+b.dataset.unit),'textContent',purchaseReason);";
  assert.equal(expectedScript.split(reasonAnchor).length-1,1,'unique prior reason computation');
  assert.equal(expectedScript.includes(reasonWrite),false,'prior script lacks new DOM write');
  expectedScript=expectedScript.replace(reasonAnchor,reasonAnchor+reasonWrite);
  expectedScript=expectedScript.replace('function render(){',expected.routePrefix+'function render(){');
  assert.equal(expected.extract(sourceText,'drawCurrentOrderPaths'),expected.routeHelper,'exact independently reviewed route helper');
  assert.equal(script(sourceText),expectedScript,'entire executable script retains every non-reviewed byte, including gameplay/input/storage logic');
  return{baselineSha256:hash(baseline),sourceSha256:hash(sourceText)};
 });
 test('css/scoped-presentation-accessibility-contract',()=>{const css=sourceText.match(/<style>([\s\S]*?)<\/style>/)[1];for(const marker of ['button:focus-visible, select:focus-visible, input:focus-visible, summary:focus-visible','outline: 3px solid var(--ui-focus);','#map:focus-visible','@media (pointer: coarse)','min-height: 44px;','@media (prefers-reduced-motion: reduce) { button { transition: none; } }','@media (max-width: 560px)','@media (max-width: 850px)'])assert.ok(css.includes(marker),'retained responsive/focus contract '+marker);assert.ok(!/url\s*\(/i.test(css),'no remote asset');assert.ok(!/\b(?:animation|animation-name)\s*:/i.test(css),'no new automatic animation');return{nativeLayoutClaim:false}});
 for(const map of ['classic','frontier','canyon','ridge','crossroads','switchback','ring','meridian'])for(const mode of ['off','direct','cached'])test(`render/${map}/${mode}`,()=>{
  const options={mode:mode==='direct'?'absent':'good'},a=h.game(sourceText,options),b=h.game(baseline,options);expected.installExpectedPresentation(b);
  for(const g of [a,b]){g.element('scenario').value=map;g.start();h.richFixture(g);if(mode!=='off')h.toggle(g,true);g.run('get(2).goal={x:620,y:330};state.ores.forEach((o,i)=>o.amount=[0,-1,.1,1500,4500,12000][i%6]);state.entities.forEach((e,i)=>{e.hp=e.max*[.29,.3,.99,1][i%4]});');}
  const original=[complete(a),complete(b)];assert.equal(original[0],original[1],'full simulation/input parity');let paints=0;
  for(let frame=0;frame<3;frame++){for(const g of [a,b])g.run('globalThis.__randomBefore=Math.random;Math.random=()=>{throw Error("presentation consumed RNG")};');const ap=h.frame(a),bp=h.frame(b);assert.deepEqual(ap,bp,'complete candidate paint stream equals historical expected presentation');assert.equal(complete(a),original[0]);assert.equal(complete(b),original[1]);assert.equal(h.tracks(a),h.tracks(b));assert.deepEqual(a.recorder.snapshot(),b.recorder.snapshot());assert.deepEqual(a.recorder.current,b.recorder.current);for(const g of [a,b])g.run('Math.random=__randomBefore;delete globalThis.__randomBefore');paints+=ap.length;}
  assert.equal(a.mockStorage.writes,0);assert.equal(a.mockStorage.removals,0);assert.equal(b.mockStorage.writes,0);assert.equal(b.mockStorage.removals,0);assert.equal(a.run('JSON.stringify([Math.random(),Math.random()])'),b.run('JSON.stringify([Math.random(),Math.random()])'),'unchanged future RNG');return{map,mode,frames:3,paints};
 });
 test('adapter/reject-current-and-duplicate-expected-host',()=>{assert.throws(()=>expected.installExpectedPresentation(h.game(sourceText)),{code:'ERR_ASSERTION'});const old=h.game(baseline);expected.installExpectedPresentation(old);assert.throws(()=>expected.installExpectedPresentation(old),{code:'ERR_ASSERTION'});});
 return{passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,sourceSha256:hash(sourceText),baselineSha256:hash(baseline),results,scope:'Actual candidate untouched. Exact reviewed expected-side presentation replay on hash-locked v314; complete paint/state/input/track/context/RNG/storage comparisons. Pure Node synthetic Canvas, not native layout/raster/FPS acceptance.'};
}
module.exports={runSuite};if(require.main===module){const r=runSuite();console.log(JSON.stringify(r,null,2));process.exitCode=r.failed?1:0}
