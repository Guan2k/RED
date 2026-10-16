'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-tail-help-negative-')),file=path.join(dir,'index.html');
function run(text){fs.writeFileSync(file,text);const p=spawnSync(process.execPath,[path.join(__dirname,'attack-tail-help.cjs'),file,hash(text)],{encoding:'utf8',maxBuffer:8*1024*1024});if(p.error)throw p.error;return {status:p.status,report:JSON.parse(p.stdout)}}
try{
 const healthy=run(html);assert.equal(healthy.status,0);assert.equal(healthy.report.failed,0);assert.equal(healthy.report.passed,9);
 const mutants=[
  {name:'stale tooltip restored',before:'攻击只撤最后一个有效待攻击目标，成功撤销时清理失效编号。',after:'攻击失效尾项仍算一项。',test:'tooltip describes valid pending target and conditional cleanup',stage:'text',invariant:'tooltip_contract'},
  {name:'stale sidebar help restored',before:'“撤销队尾”对所选车辆各撤销最后一个有效待攻击目标或后续地面路点，成功撤销攻击项时清理失效编号；',after:'“撤销队尾”对所选车辆各撤销最后一个后续攻击目标或地面路点，攻击失效项也计入；',test:'sidebar help describes valid pending target and conditional cleanup',stage:'text',invariant:'sidebar_contract'},
  {name:'false unconditional cleanup claim',before:'攻击只撤最后一个有效待攻击目标，成功撤销时清理失效编号。',after:'攻击只撤最后一个有效待攻击目标，每次点击均清理失效编号。',test:'tooltip describes valid pending target and conditional cleanup',stage:'text',invariant:'tooltip_contract'}
 ];
 const results=[];
 for(const m of mutants){assert.equal(html.split(m.before).length-1,1,m.name+' exact boundary');const r=run(html.replace(m.before,m.after));assert.equal(r.status,1,m.name);const failure=r.report.results.find(x=>x.name===m.test);assert.equal(failure?.passed,false,m.name);assert.deepEqual(failure.failure,{stage:m.stage,invariant:m.invariant,code:'ERR_ASSERTION'},m.name);assert.ok(r.report.results.filter(x=>x.name.startsWith('successful undo')||x.name.startsWith('one surviving')||x.name.startsWith('actual current')||x.name.startsWith('ground route')).every(x=>x.passed),'wording mutants preserve command fixtures');results.push({name:m.name,expectedTest:m.test,stage:m.stage,invariant:m.invariant,detected:true})}
 console.log(JSON.stringify({passed:results.length,failed:0,healthyPassed:healthy.report.passed,results,scope:'Three exact text mutants; expected assertion phase/invariant required after healthy baseline. No native tooltip or persistence execution.'},null,2));
}finally{fs.rmSync(dir,{recursive:true,force:true})}
