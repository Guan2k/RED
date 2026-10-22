'use strict';
// Current candidate execution and frozen historical regression are separate layers.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const {sha,contract:sourceContract,restore,restoreProductFiles}=require('./source.cjs');
const root=path.resolve(__dirname,'../..');
function checkDependencies(){
 const contract=JSON.parse(fs.readFileSync(path.join(root,'verification/stable-suites/release-contract.json')));
 assert.equal(contract.currentValidation?.entry,'verification/current-release/run.cjs','required current validation layer');
 for(const [name,digest]of Object.entries(contract.files))assert.equal(sha(fs.readFileSync(path.join(root,name))),digest,'release dependency identity '+name);
 const required=['verification/current-release/run.cjs','verification/current-release/source.cjs','verification/current-release/source.test.cjs','verification/current-release/source-contract.json','verification/current-release/changes.json','verification/current-effects/suite.cjs','verification/current-effects/negative-controls.cjs','tools/explosion-effects.test.cjs','tools/effect-feedback-retention.test.cjs'];
 for(const name of required)assert.ok(Object.hasOwn(contract.files,name),'current layer dependency required '+name);
 return contract;
}
function child(file,args=[]){
 const p=spawnSync(process.execPath,[file,...args],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
 assert.ifError(p.error);assert.equal(p.signal,null,'validation child signal');assert.equal(p.status,0,'validation child failed: '+file+'\n'+p.stdout+'\n'+p.stderr);assert.equal(p.stderr,'','validation child stderr');
 return p.stdout;
}
function main(args=process.argv.slice(2)){
 assert.ok(args.length===0||(args.length===1&&['--current-only','--dispatch-check'].includes(args[0])),'supported: no args, --current-only or --dispatch-check');
 const release=checkDependencies(),actual=path.join(root,'index.html'),bytes=fs.readFileSync(actual,'utf8'),baseline=restore(bytes);
 if(args[0]==='--dispatch-check'){console.log(JSON.stringify({passed:release.dispatch.length,failed:0,dispatch:release.dispatch,currentSourceSha256:sha(bytes),scope:'Dependency identity and declared historical dispatch only; no game executed.'},null,2));return}
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'red-layered-validation-'));
 try{
  const baselineFile=path.join(temporary,'v318.html');fs.writeFileSync(baselineFile,baseline);
  const sourceReport=JSON.parse(child(path.join(__dirname,'source.test.cjs')));
  const pathsReport=JSON.parse(child(path.join(__dirname,'paths.test.cjs')));
  const focused=child(path.join(root,'tools/explosion-effects.test.cjs'));
  const retention=child(path.join(root,'tools/effect-feedback-retention.test.cjs')); 
  const runtime=JSON.parse(child(path.join(root,'verification/current-effects/suite.cjs'),[actual,baselineFile]));
  const negative=JSON.parse(child(path.join(root,'verification/current-effects/negative-controls.cjs'),[actual,baselineFile,path.join(temporary,'mutants')]));
  assert.equal(runtime.pass,true);assert.equal(negative.pass,true);
  const report={schema:1,current:{sourceSha256:sha(bytes),sourceContract:sourceReport,paths:pathsReport,focusedEffects:{exitCode:0,output:focused,scope:'Existing fragment-level effects cases, not whole runtime.'},runtime,negative,feedbackRetention:{exitCode:0,output:retention,scope:'18 whole-index retention, bounded-queue, semantic-negative and current-main differential checks.'}},historical:null,validationExecution:'passed',productAcceptance:'targeted-feedback-retention-passed',knownRegressions:[],resolvedRegressions:[{id:'shared-fx-feedback-eviction',status:'fixed-targeted-verified',detail:'Live semantic feedback is preserved by evicting decorative spark/smoke/scorch first; semantic-only overload remains bounded FIFO. No full UI acceptance claim.'}],scope:'Current whole-index targeted runtime and differential scenarios plus exact source boundary checks. Historical full regression is a separate baseline layer, not all old suites executing latest code. No native browser, touch, raster or FPS acceptance.'};
  if(args[0]!=='--current-only'){
   const history=path.join(temporary,'historical');fs.cpSync(root,history,{recursive:true});
   fs.writeFileSync(path.join(history,'index.html'),baseline);restoreProductFiles(history);
   for(const name of ['release-runner.cjs','release-contract.json'])fs.copyFileSync(path.join(__dirname,'historical',name),path.join(history,'verification/stable-suites',name));
   fs.copyFileSync(path.join(__dirname,'historical/current-verification.json'),path.join(history,'current-verification.json'));
   const summary=JSON.parse(child(path.join(history,'verification/stable-suites/release-runner.cjs')));
   assert.equal(summary.sourceSha256,sourceContract.baselineSha256,'historical runner actually selected v318');
   report.historical={sourceSha256:sourceContract.baselineSha256,scope:'Frozen v318 stable game runner in private historical-source copy. Its package integrity/developer preflight are not executed here. Nested old current labels refer exclusively to historical v318, never the latest effects/UI source.',originalReport:summary};
  }
  assert.equal(sha(fs.readFileSync(actual)),sourceContract.currentSha256,'actual current source unchanged throughout');
  console.log(JSON.stringify(report,null,2));
 }finally{fs.rmSync(temporary,{recursive:true,force:true})}
}
module.exports={main,checkDependencies};
if(require.main===module){try{main()}catch(e){console.error(e.stack);process.exitCode=1}}
