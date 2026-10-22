'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {runSuite,currentDefault,baselineDefault}=require('./suite.cjs');
const raw=fs.readFileSync(process.argv[2]||currentDefault,'utf8');
// Resolve the exact reference once BEFORE mutations. Mutants go straight to the
// semantic suite with an explicit baseline. No mutant is passed to restore/hash.
const baseline=process.argv[3]||baselineDefault();
const out=path.resolve(process.argv[4]||fs.mkdtempSync(path.join(os.tmpdir(),'red-effects-mutants-')));fs.mkdirSync(out,{recursive:true});
const cases=[
 ['missing-destruction-spawn','spawnDestructionEffects(target);','void target;', 'hit-destruction-spawn'],
 ['missing-hit-sparks',"spawnImpactSparks(center.x,center.y,shot.kind==='artillery'?27:15,target.id+Math.floor(state.t*10),shot.kind==='artillery'?6:4);",'', 'hit-destruction-spawn'],
 ['missing-spark-renderer',"}else if(f.type==='spark'){","}else if(f.type==='disabled-spark'){",'full-render-pure-and-branches'],
 ['missing-smoke-renderer',"}else if(f.type==='smoke'){","}else if(f.type==='disabled-smoke'){",'full-render-pure-and-branches'],
 ['missing-scorch-renderer',"if(f.type!=='scorch')continue;","if(true)continue;",'full-render-pure-and-branches'],
 ['expiration-disabled','state.fx.forEach(f=>f.t-=dt);','state.fx.forEach(f=>f.t-=0);','actual-update-expiration'],
 ['persisted-effects','snapshot.fx=[];','snapshot.fx=snapshot.fx;','save-load-reset-transient'],
 ['load-keeps-effects','state.fx=[];state.logs=[];refreshPostStates();','state.fx=state.fx;state.logs=[];refreshPostStates();','save-load-reset-transient'],
 ['damage-multiplier',"shot.kind==='tank'&&target.type==='scout'?1.2:1","shot.kind==='tank'&&target.type==='scout'?1.3:1",'damage-splash-kills-selection-economy-rng-parity'],
 ['purchase-money','state.cash-=d.cost;state.stats.spent[0]+=d.cost;state.queue.push({type,left:d.time,total:d.time});','state.cash-=d.cost+1;state.stats.spent[0]+=d.cost;state.queue.push({type,left:d.time,total:d.time});','damage-splash-kills-selection-economy-rng-parity'],
 ['effect-rng-consumption','let angle=i*2.399963+seed*.73,reach=','let angle=i*2.399963+seed*.73+Math.random(),reach=','hit-destruction-spawn'],
 ['render-rng-consumption','function drawBattleEffect(f){','function drawBattleEffect(f){Math.random();','full-render-pure-and-branches'],
 ['render-gameplay-write','function drawBattleEffect(f){','function drawBattleEffect(f){state.cash+=1;','full-render-pure-and-branches'],
 ['missing-projectile-victory','if(destroyedHQ.size===2)finish(null);else if(destroyedHQ.size===1)finish(destroyedHQ.has(1));','if(false)finish(null);','projectile-victory-and-terminal-parity']
];
const queueStart=raw.indexOf('function decorativeEffect('),queueEnd=raw.indexOf('// Cosmetic-only battlefield effects:',queueStart);
assert.ok(queueStart>0&&queueEnd>queueStart,'reviewed current queue boundary');
cases.push(['regressed-all-fifo-feedback',raw.slice(queueStart,queueEnd),"function pushEffect(effect){if(effect.type==='order')state.fx=state.fx.filter(e=>e.type!=='order');state.fx.push(effect);if(state.fx.length>MAX_EFFECTS)state.fx.splice(0,state.fx.length-MAX_EFFECTS)}\n",'shared-cap-pressure-explicit-accounting']);
cases.push(['cash-misclassified-as-decoration',"return effect.type==='spark'||","return effect.type==='cash'||effect.type==='spark'||",'shared-cap-pressure-explicit-accounting']);
const results=[];
for(const [name,from,to,test] of cases){
 assert.equal(raw.split(from).length-1,1,name+' unique mutation boundary');
 const filename=path.join(out,name+'.html');fs.writeFileSync(filename,raw.replace(from,to));
 const report=runSuite({current:filename,baseline,only:test});
 assert.equal(report.results.length,1);
 const failure=report.results[0];
 const detected=!failure.pass&&/AssertionError|render wrote gameplay state/.test(failure.stack||'')&&!/source.*hash|exact current index|sha256/i.test(failure.error||'');
 results.push({name,test,detected,sourceFenceUsed:false,semanticFailure:failure.error,stack:failure.stack});
}
const report={pass:results.every(x=>x.detected),baseline,mutantsDirectory:out,count:results.length,results};
fs.writeFileSync(path.join(out,'negative-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));process.exitCode=report.pass?0:1;
