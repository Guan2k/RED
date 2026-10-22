'use strict';
// Optional observation only. Never alter a child call's arguments, result, or exception.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const {isProxy} = require('node:util').types;
const key = 'RED_VERIFY_PROGRESS_CONFIG';
let config;
try {
  config = JSON.parse(process.env[key] || 'null');
  if(config) {
    if(typeof config.directory!=='string'||!path.isAbsolute(config.directory)||typeof config.runId!=='string'||!/^[-a-f0-9]{36}$/.test(config.runId))throw Error('invalid observation configuration');
    const directory=fs.realpathSync(config.directory),root=fs.realpathSync(path.resolve(__dirname,'../..')),rel=path.relative(root,directory);
    if(rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))throw Error('sidecar inside package');
    config={...config,directory};
  }
} catch (_) {config=null;}
if (config && config.schema === 1 && typeof config.directory === 'string' && path.isAbsolute(config.directory) && typeof config.runId === 'string') {
  const id = crypto.randomUUID();
  const file = path.join(config.directory, 'process-' + id + '.jsonl');
  const monotonic = process.hrtime.bigint.bind(process.hrtime);
  const start = monotonic();
  let sequence = 0, callSequence = 0, dropped = 0;
  // Logging errors never turn a real test failure into success or replace a test's error.
  function emit(type, fields = {}) {
    try {
    const event = {schema:1,runId:config.runId,processId:id,pid:process.pid,ppid:process.ppid,sequence:++sequence,type,at:new Date().toISOString(),elapsedMs:Number(monotonic()-start)/1e6,...fields};
    fs.appendFileSync(file, JSON.stringify(event) + '\n', {encoding:'utf8',flag:'a',mode:0o600});
    } catch (_) { dropped++; }
  }
  const safe = value => typeof value === 'string' ? value.slice(0,2048) : null;
  const data = (object, key) => object && (typeof object === 'object' || typeof object === 'function') && !isProxy(object) ? Object.getOwnPropertyDescriptor(object,key)?.value : undefined;
  function captureOutput(callId, result, thrown=false) {
    if (config.captureFailures !== true) return;
    try {
      const status=data(result,'status'),signal=data(result,'signal'),error=data(result,'error');
      if (!thrown && !(typeof status==='number' && status!==0) && signal==null && error==null) return;
      function sample(value,limit,position) {
        if (typeof value!=='string' && (isProxy(value)||!Buffer.isBuffer(value))) return {available:false};
        const lengthOf=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),'length').get;
        const originalBytes=typeof value==='string'?Buffer.byteLength(value,'utf8'):Reflect.apply(lengthOf,value,[]);
        const buffer=typeof value==='string'?Buffer.from(position==='head'?value.slice(0,limit+1):value.slice(-(limit+1)),'utf8'):value;
        const length=Reflect.apply(lengthOf,buffer,[]),size=Math.min(length,limit),captured=Buffer.alloc(size);
        const offset=position==='head'?0:length-size;
        Reflect.apply(Buffer.prototype.copy,buffer,[captured,0,offset,offset+size]);
        return {available:true,encoding:'base64',originalBytes,capturedBytes:captured.length,truncated:originalBytes>captured.length,position,sha256Captured:crypto.createHash('sha256').update(captured).digest('hex'),data:captured.toString('base64')};
      }
      const record={schema:1,runId:config.runId,processId:id,callId,scope:'Opt-in failing test output; may contain test-generated text. No environment, stdin or full arguments are recorded. Hash covers captured fragment only.',status,signal,thrown,stderr:sample(data(result,'stderr'),8192,'head'),stdout:sample(data(result,'stdout'),4096,'tail')};
      const basename='failure-'+crypto.randomUUID()+'.json';
      fs.writeFileSync(path.join(config.directory,basename),JSON.stringify(record)+'\n',{encoding:'utf8',flag:'wx',mode:0o600});
      emit('failure-output',{callId,file:basename});
    } catch (_) {dropped++;}
  }
  emit('process-start', {executable:process.execPath,script:safe(process.argv[1]),cwd:process.cwd()});
  const original = childProcess.spawnSync;
  childProcess.spawnSync = function observedSpawnSync() {
    const callId = id + ':' + (++callSequence);
    const started = monotonic();
    try {
      // Read only a bounded number of own data properties. Never invoke argv getters.
      const command = safe(arguments[0]), argv = arguments[1];
      let script;
      if (Array.isArray(argv) && !isProxy(argv)) {
        for (let i=0;i<32;i++) {
          const value=Object.getOwnPropertyDescriptor(argv,String(i))?.value;
          if (typeof value==='string' && /\.(?:cjs|mjs|js)$/.test(value)) {script=value;break;}
        }
      }
      emit('child-start', {callId,command,script:safe(script)});
    } catch (_) {dropped++;}
    try {
      const result = Reflect.apply(original, this, arguments);
      try { emit('child-end', {callId,durationMs:Number(monotonic()-started)/1e6,childPid:data(result,'pid')||null,status:data(result,'status'),signal:data(result,'signal'),errorCode:safe(data(data(result,'error'),'code')),errorName:safe(data(data(result,'error'),'name'))}); } catch (_) {dropped++;}
      captureOutput(callId,result);
      return result;
    } catch (error) {
      try { emit('child-throw', {callId,durationMs:Number(monotonic()-started)/1e6,errorName:safe(data(error,'name'))}); } catch (_) {dropped++;}
      captureOutput(callId,error,true);
      throw error;
    }
  };
  process.on('exit', code => emit('process-exit', {exitCode:code,droppedEvents:dropped}));
}
