'use strict';
const fs=require('node:fs'),path=require('node:path');
function summarize(directory) {
  const run=JSON.parse(fs.readFileSync(path.join(directory,'run.json'),'utf8'));
  const streams=[],issues=[],activeCalls=[],completedCalls=[];
  for(const name of fs.readdirSync(directory).filter(x=>/^process-[a-f0-9-]+\.jsonl$/.test(x)).sort()) {
    const lines=fs.readFileSync(path.join(directory,name),'utf8').split('\n');
    const events=[];
    for(let i=0;i<lines.length;i++) {
      if(!lines[i])continue;
      try {const event=JSON.parse(lines[i]);if(event.runId!==run.runId)throw Error('run ID mismatch');events.push(event);}
      catch (_) {issues.push({file:name,reason:i===lines.length-1?'partial last record':'invalid record'});}
    }
    const pending=new Map(); let expected=1;
    for(const event of events) {
      if(event.sequence!==expected)issues.push({file:name,reason:'sequence gap',expected,actual:event.sequence});
      expected=event.sequence+1;
      if(event.type==='child-start')pending.set(event.callId,event);
      if(event.type==='child-end'||event.type==='child-throw') {
        const began=pending.get(event.callId);
        if(!began)issues.push({file:name,reason:'child completion without start'});
        completedCalls.push({script:began?.script||null,command:began?.command||null,...event});pending.delete(event.callId);
      }
    }
    activeCalls.push(...[...pending.values()].map(event=>({...event,wallMsSinceStart:Math.max(0,Date.now()-Date.parse(event.at))})));
    const first=events[0],last=events.at(-1);
    if(!first||first.type!=='process-start')issues.push({file:name,reason:'missing process start'});
    if(last?.droppedEvents)issues.push({file:name,reason:'logging failures',count:last.droppedEvents});
    streams.push({file:name,pid:first?.pid,ppid:first?.ppid,script:first?.script,events:events.length,terminal:last?.type==='process-exit',exitCode:last?.type==='process-exit'?last.exitCode:null,lastAt:last?.at});
  }
  let rootPid;try{rootPid=JSON.parse(fs.readFileSync(path.join(directory,'root-pid.json'),'utf8')).pid;}catch(_){}
  if(!Number.isInteger(rootPid))issues.push({reason:'missing root process identity'});
  else if(!streams.some(x=>x.pid===rootPid))issues.push({reason:'root process stream unavailable',pid:rootPid});
  let final;try{final=JSON.parse(fs.readFileSync(path.join(directory,'final.json'),'utf8'));}catch(_){}
  return {runId:run.runId,rootPid:rootPid||null,started:run.started,observedProcesses:streams.length,completedChildCalls:completedCalls.length,activeCalls,slowestCompleted:completedCalls.sort((a,b)=>b.durationMs-a.durationMs).slice(0,15),streams,issues,observationState:!streams.length?'unavailable':issues.length?'incomplete':activeCalls.length||streams.some(x=>!x.terminal)?'active-or-incomplete':'observed-streams-terminal',gateResult:final?{status:final.status,signal:final.signal,error:final.error}:null,limitations:'Events are observations, not passed assertions. Only spawnSync boundaries are instrumented. Explicit child env filtering, non-Node children, signals, forced termination or logging failures can omit nested events. Absence of final.json means the gate outcome is unknown. Durations include observation overhead; no speedup or ETA is inferred.'};
}
module.exports={summarize};
if(require.main===module){try{if(process.argv.length!==3)throw Error('Usage: node status.cjs /absolute/progress-directory');console.log(JSON.stringify(summarize(process.argv[2]),null,2));}catch(error){console.error(error.message);process.exitCode=1;}}
