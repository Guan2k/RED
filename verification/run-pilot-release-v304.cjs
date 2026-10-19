'use strict';
// Unchanged stable suites run against the selected candidate. Their frozen original
// semantic counterparts always receive a separate exact v287 host.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=__dirname,pilot=path.join(root,'parameterized-pilot'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const args=process.argv.slice(2);assert.ok(args.length<=1&&args.every(x=>['--historical-v287','--historical-v288'].includes(x)),'only one explicit historical replay switch is supported');
const historical=args[0]?.slice('--historical-'.length)||null,selected=historical?'current-suite-manifest-'+historical+'.json':'current-suite-manifest-v304.json',manifest=JSON.parse(fs.readFileSync(path.join(pilot,selected))),frozen=require('./v287-host-manifest.json'),frozen288=require('./v288-host-manifest.json');
const reference=fs.readFileSync(path.join(pilot,'reference-v287.html'));
assert.equal(hash(reference),frozen.sourceSha256,'exact independent v287 historical host');
const files=new Map();
function remember(file){if(!files.has(file))files.set(file,hash(fs.readFileSync(file)));return fs.readFileSync(file)}
function frozenFile(relative){const bytes=remember(path.join(root,relative));assert.equal(hash(bytes),frozen.files[relative],'frozen historical dependency '+relative);return bytes}
const currentSource=path.resolve(root,'../index.html'),currentBytes=remember(currentSource),candidateReference=historical?remember(path.join(pilot,'reference-'+historical+'.html')):null;
const expectedCandidate=historical?hash(candidateReference):hash(currentBytes);
if(historical){assert.equal(expectedCandidate,(historical==='v287'?frozen:frozen288).sourceSha256,'exact selected historical candidate');const archived='parameterized-pilot/'+selected;assert.equal(hash(remember(path.join(pilot,selected))),frozen288.files[archived],'exact frozen archived configuration');}
assert.equal(expectedCandidate,manifest.candidate.sha256,'selected candidate identity before behavior');
remember(path.join(pilot,selected));remember(path.join(pilot,'reference-v287.html'));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-v289-pilot-release-')),host=path.join(temp,'RED'),verify=path.join(host,'verification'),temporaryPilot=path.join(verify,'parameterized-pilot');
try{
 fs.mkdirSync(temporaryPilot,{recursive:true});fs.writeFileSync(path.join(host,'index.html'),reference);
 for(const relative of ['vm-environment.cjs','order-display-writes-v287.cjs','selection-filter-writes-v287.cjs','restore-v283.cjs','restore-v284.cjs','restore-v285.cjs','restore-v286.cjs'])fs.writeFileSync(path.join(verify,relative),frozenFile(relative));
 for(const entry of fs.readdirSync(pilot,{withFileTypes:true})){assert.ok(entry.isFile(),'pilot contains regular files only');const original=path.join(pilot,entry.name),bytes=remember(original),relative='parameterized-pilot/'+entry.name;if(Object.hasOwn(frozen.files,relative))assert.equal(hash(bytes),frozen.files[relative],'unchanged stable pilot input '+relative);fs.writeFileSync(path.join(temporaryPilot,entry.name),bytes)}
 const originalCandidatePath=manifest.candidate.path;
 // Only the candidate locator changes in temporary configuration. Candidate bytes,
 // references, suites, mutations, integrity entries and the change fence are pinned.
 manifest.candidate.path=historical?path.join(temporaryPilot,'reference-'+historical+'.html'):currentSource;
 fs.writeFileSync(path.join(temporaryPilot,'current-suite-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const child=spawnSync(process.execPath,[path.join(temporaryPilot,'run-current-suites.cjs')],{encoding:'utf8',maxBuffer:32*1024*1024});
 assert.ifError(child.error);assert.equal(child.signal,null,'stable runner terminated by signal');assert.equal(child.status,0,child.stdout+child.stderr);assert.equal(child.stderr,'','unexpected stable runner stderr');
 const output=JSON.parse(child.stdout),report=JSON.parse(fs.readFileSync(path.join(temporaryPilot,'results.json')));
 assert.equal(report.candidateSha256,expectedCandidate,'runner candidate identity');
 assert.deepEqual(output.normal,[{suiteId:'order-display-writes',passed:8,assertions:229},{suiteId:'selection-filter-writes',passed:7,assertions:110}],'complete original positive coverage');
 assert.equal(output.negative,18,'complete original behavior-negative coverage');
 assert.equal(report.normal.length,2);assert.equal(report.negative.length,18);
 for(const [suiteId,count]of [['order-display-writes',10],['selection-filter-writes',8]]){const negatives=report.negative.filter(x=>x.suiteId===suiteId);assert.equal(negatives.length,count);assert.ok(negatives.every(x=>x.classification==='DETECTED_BEHAVIOR'),'only exact behavior detections count')}
 assert.equal(new Set(report.negative.map(x=>x.id)).size,18,'all distinct original mutations');
 for(const [file,digest]of files)assert.equal(hash(fs.readFileSync(file)),digest,'packaged input unchanged '+path.relative(root,file));
 const destination=path.join(pilot,historical?'results-'+historical+'-replay-v304.json':'results-v304.json');
 report.releaseIntegration={mode:historical?'historical-'+historical+'-replay':'current-v294',selectedManifest:selected,originalCandidatePath,currentSourceSha256:expectedCandidate,historicalHostSha256:hash(reference),sourceIdentitySeparateFromBehavior:true,stableCodeUnchanged:true,scope:'Two stable selected-source suites and all 18 exact behavior mutations. The original v287 positive scripts execute only against the separate exact v287 host for semantic-result comparison. Historical identity and comparison are not current-v294 behavior counts.'};
 fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({sourceSha256:expectedCandidate,normal:output.normal,negative:output.negative,failed:0,historicalHostSha256:hash(reference),report:path.relative(root,destination),scope:report.releaseIntegration.scope},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true})}
