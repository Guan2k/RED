'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{runSuite}=require('./progress-rails-v304.cjs');
const source=path.resolve(__dirname,'../index.html'),html=fs.readFileSync(source,'utf8'),root=fs.mkdtempSync(path.join(os.tmpdir(),'red-progress-mutants-')),base=path.join(root,'v295.html');fs.writeFileSync(base,require('./restore-v295-from-v304.cjs')(html));
const mutations=[
 ['construction rail reversal','drawConstructionProgress','e.y+e.r-9','e.y+e.r-7','power','both rail and fill corrected'],
 ['construction fill reversal','drawConstructionProgress','e.y+e.r-8','e.y+e.r-6','power','both rail and fill corrected'],
 ['factory rail reversal','drawFactoryProgress','e.y+e.r-9','e.y+e.r-6','factory','both rail and fill corrected'],
 ['factory fill reversal','drawFactoryProgress','e.y+e.r-8','e.y+e.r-5','factory','both rail and fill corrected'],
 ['construction clip expansion','drawConstructionProgress','e.r*2-8,e.r*2-8','e.r*2-8,e.r*2-5','power','clip boundary remains exact'],
 ['factory clip expansion','drawFactoryProgress','e.r*2-8,e.r*2-8','e.r*2-8,e.r*2-5','factory','clip boundary remains exact'],
 ['construction rail one pixel low','drawConstructionProgress','e.y+e.r-9','e.y+e.r-8','power','only intended y offset changes'],
 ['factory fill width change','drawFactoryProgress','w*view.progress,3','w*view.progress+1,3','factory','only intended y offset changes']
];
const results=[];try{for(const[name,fn,before,after,type,diagnostic]of mutations){const only='helper geometry '+[type,36,.5];const positive=runSuite({source,baseline:base,only});assert.equal(positive.passed,1);assert.equal(positive.failed,0);const line=html.split('\n').find(x=>x.startsWith('function '+fn+'('));assert.ok(line);assert.equal(line.split(before).length-1,1);const changed=html.replace(line,line.replace(before,after)),file=path.join(root,name.replaceAll(' ','-')+'.html');fs.writeFileSync(file,changed);const r=runSuite({source:file,baseline:base,only});assert.equal(r.results.length,1);assert.equal(r.failed,1);const fail=r.results[0];assert.equal(fail.name,only);assert.equal(fail.errorName,'AssertionError');assert.equal(fail.errorCode,'ERR_ASSERTION');assert.ok(fail.error.includes(diagnostic),fail.error);results.push({name,passed:true,positiveCases:positive.passed,rejectedBy:only,diagnostic})}
 // Baseline sensitivity is semantic: old geometry is rejected by the selected current geometric case.
 const only='helper geometry factory,36,0.5',r=runSuite({source:base,baseline:base,only});assert.equal(r.failed,1);assert.equal(r.results[0].errorCode,'ERR_ASSERTION');assert.ok(r.results[0].error.includes('both rail and fill corrected'));results.push({name:'exact v295 geometry baseline contrast',passed:true,classification:'intentional clipping correction; not a prior test regression'});
 console.log(JSON.stringify({passed:results.length,failed:0,semanticMutants:mutations.length,baselineContrast:1,results,scope:'Exact selected-case AssertionError diagnostics only; every mutant first passes unmodified positive case. Four reversals, two clip-weakening changes and two geometry boundary mutations. No identity-only rejection counted.'},null,2));
}finally{fs.rmSync(root,{recursive:true,force:true})}
