'use strict';
// NEW v294 negative controls. All mutations are in memory; packaged files and
// the previous research fixtures are never rewritten. Every mutant must fail
// its named behavioral invariant, without a static identity/hash gate.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {runSuite,extract}=require('./ore-layout-v297.cjs');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html'));
const html=fs.readFileSync(source,'utf8');
const baseline=process.argv[3]?fs.readFileSync(path.resolve(process.argv[3]),'utf8'):require('./restore-v293.cjs')(require('./restore-v294-from-v297.cjs')(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8')));
const layout=extract(html,'oreLabelLayout'),results=[];
const cases=[
 {name:'eager-empty-allocation',test:'empty',check:'empty-depleted-zero-concat',edits:[['let normalBoxes,expandedBoxes;','let normalBoxes=postBoxes.concat(markerBoxes),expandedBoxes=postBoxes.concat(rangeBoxes,markerBoxes);']]},
 {name:'eager-depleted-allocation',test:'depleted',check:'empty-depleted-zero-concat',edits:[['let normalBoxes,expandedBoxes;','let normalBoxes=postBoxes.concat(markerBoxes),expandedBoxes=postBoxes.concat(rangeBoxes,markerBoxes);']]},
 {name:'per-ore-cache-reset',test:'normal-only-many',check:'at-most-two-concat-per-call',edits:[['let normalBoxes,expandedBoxes;for(let o of state.ores){','for(let o of state.ores){let normalBoxes,expandedBoxes;']]},
 {name:'restore-repeated-baseline-concat',test:'expanded-full-overlap',check:'at-most-two-concat-per-call',edits:[['boxes=expanded?(expandedBoxes??=postBoxes.concat(rangeBoxes,markerBoxes)):(normalBoxes??=postBoxes.concat(markerBoxes))','boxes=(expanded?postBoxes.concat(rangeBoxes):postBoxes).concat(markerBoxes)']]},
 {name:'leak-obstacles-across-calls',test:'sequential-replacements-and-metrics',check:'coordinates-labels-and-order',edits:[['expandedBoxes??=','globalThis.__persistExpanded??='],['normalBoxes??=','globalThis.__persistNormal??=']]},
 {name:'persist-text-metrics-across-calls',test:'sequential-replacements-and-metrics',check:'identical-measurement-and-context-order',edits:[['const measured=new Map(),','const measured=(globalThis.__persistMeasured??=new Map()),']]},
 {name:'normal-uses-expanded-range-boxes',test:'near-post-candidate-sweep',check:'coordinates-labels-and-order',edits:[['normalBoxes??=postBoxes.concat(markerBoxes)','normalBoxes??=postBoxes.concat(rangeBoxes,markerBoxes)']]},
 {name:'expanded-omits-range-boxes',test:'near-post-candidate-sweep',check:'coordinates-labels-and-order',edits:[['expandedBoxes??=postBoxes.concat(rangeBoxes,markerBoxes)','expandedBoxes??=postBoxes.concat(markerBoxes)']]},
 {name:'omit-normal-marker-boxes',test:'near-post-candidate-sweep',check:'coordinates-labels-and-order',edits:[['normalBoxes??=postBoxes.concat(markerBoxes)','normalBoxes??=postBoxes.concat([])']]},
 {name:'omit-expanded-marker-boxes',test:'near-post-candidate-sweep',check:'coordinates-labels-and-order',edits:[['expandedBoxes??=postBoxes.concat(rangeBoxes,markerBoxes)','expandedBoxes??=postBoxes.concat(rangeBoxes)']]},
 {name:'wrong-normal-collision-radius',test:'near-post-candidate-sweep',check:'coordinates-labels-and-order',edits:[['radius=expanded?68:36','radius=expanded?68:68']]},
 {name:'wrong-expanded-collision-radius',test:'near-post-candidate-sweep',check:'coordinates-labels-and-order',edits:[['radius=expanded?68:36','radius=expanded?36:36']]},
 {name:'wrong-first-candidate-position',test:'normal-only-many',check:'coordinates-labels-and-order',edits:[['candidates=[{x:o.x-25,y:o.y+48}','candidates=[{x:o.x-25,y:o.y+49}']]},
 {name:'clone-returned-ore',test:'current-ore-reference',check:'current-ore-object-reference',edits:[['labels.push({ore:o,label','labels.push({ore:{...o},label']]},
 {name:'wrong-ore-label-rounding',test:'current-ore-reference',check:'coordinates-labels-and-order',edits:[['Math.ceil(o.amount/1000)','Math.floor(o.amount/1000)']]},
 {name:'extra-text-measurement',test:'measurement-context-rng',check:'identical-measurement-and-context-order',edits:[['ctx.font=\'11px system-ui\';','ctx.font=\'11px system-ui\';ctx.measureText(\'unnecessary\');']]},
 {name:'skip-context-restore',test:'measurement-context-rng',check:'context-restored',edits:[['ctx.restore();return labels','return labels']]},
 {name:'consume-layout-rng',test:'measurement-context-rng',check:'layout-consumes-no-rng',edits:[['function oreLabelLayout(){','function oreLabelLayout(){Math.random();']]},
 {name:'mutate-frozen-ore-input',test:'frozen-input',check:'function-returns-frozen-input',edits:[['function oreLabelLayout(){','function oreLabelLayout(){state.ores[0].amount++;']]}
];
for(const entry of cases){
 const name='negative/'+entry.name;
 try{
  let changed=layout;
  for(const[before,after]of entry.edits){assert.equal(changed.split(before).length-1,1,'unique intended mutation anchor: '+entry.name);changed=changed.replace(before,after)}
  const test='sentinel/'+entry.test;
  const control=runSuite({source,html,baseline,sentinelsOnly:true,only:[test]});
  assert.equal(control.failed,0,'unmodified candidate must pass named control');assert.equal(control.passed,1,'exactly one named control');
  const report=runSuite({source,html:html.replace(layout,changed),baseline,sentinelsOnly:true,only:[test]});
  assert.equal(report.results.length,1,'one specific behavioral test, no identity gates');
  assert.equal(report.failed,1,'intended mutant must be rejected');assert.equal(report.results[0].name,test);
  assert.equal(report.results[0].check,entry.check,'exact intended behavioral failure');
  results.push({name,passed:true,detected:true,test,expectedCheck:entry.check,observedCheck:report.results[0].check});
 }catch(e){results.push({name,passed:false,message:e.message})}
}
assert.equal(new Set(results.map(r=>r.name)).size,results.length,'unique negative result names');
const report={sourceSha256:crypto.createHash('sha256').update(html).digest('hex'),baselineSha256:crypto.createHash('sha256').update(baseline).digest('hex'),passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results,scope:'In-memory mutations of the exact current oreLabelLayout function. Each runs only its named behavioral test against the immutable v293 baseline, with a fresh unmodified-candidate control. Static approval/source-identity gates are deliberately not run. No source files modified, browser, real storage, save/load/import/export or FPS measurement.'};
console.log(JSON.stringify(report,null,2));process.exitCode=report.failed?1:0;
