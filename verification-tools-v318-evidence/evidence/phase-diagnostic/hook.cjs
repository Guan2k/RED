'use strict';
// Diagnostic only: no package files changed; never a gate acceptance result.
const fs=require('node:fs'),Module=require('node:module'),vm=require('node:vm');
const start=process.hrtime.bigint(),cpu=process.cpuUsage();let vmCalls=0,vmMs=0;
const originalRun=vm.runInContext;vm.runInContext=function(...args){const t=process.hrtime.bigint();try{return Reflect.apply(originalRun,this,args)}finally{vmCalls++;vmMs+=Number(process.hrtime.bigint()-t)/1e6}};
globalThis.__diagnostic={report(name,extra={}){const used=process.cpuUsage(cpu);console.error(JSON.stringify({name,wallMs:Number(process.hrtime.bigint()-start)/1e6,cpuMs:(used.user+used.system)/1000,vmCalls,vmMs,...extra}))}};
const native=Module._extensions['.js'];Module._extensions['.js']=function(module,file){if(!file.endsWith('/verification/command-allocation-feedback-v318.cjs'))return native(module,file);let s=fs.readFileSync(file,'utf8');const old='function test(name,f){f();results.push({name,passed:true})}';if(s.split(old).length!==2)throw Error('diagnostic anchor mismatch');s=s.replace(old,"function test(name,f){globalThis.__diagnostic.report('start '+name);f();results.push({name,passed:true});globalThis.__diagnostic.report('end '+name)}");module._compile(s,file)};
