'use strict';
// Additive developer gate. The immutable v294 player verifier remains separate.
const path=require('node:path');
function run(args,{spawn=require('node:child_process').spawnSync,log=console.log,error=console.error}={}){
  if(!(args.length===0||(args.length===1&&args[0]==='--check-only'))){error('Supported arguments: no arguments or --check-only');return 1}
  const stages=[
    ['sealed package integrity',['verify-current.cjs','--check-only']],
    ['editable source consistency',['tools/source-build.mjs','--check']],
    ['source builder tests',['--test','tools/source-build.test.mjs']],
    ['trusted building data validation',['--test','tools/building-art-data.test.mjs']]
  ];
  if(!args.length)stages.push(['unchanged canonical game verification',['verify-current.cjs']]);
  for(const[label,command]of stages){
    log('Developer preflight: '+label);
    let result;
    try{result=spawn(process.execPath,command,{cwd:__dirname,shell:false,stdio:'inherit'})}
    catch(e){error('Developer preflight spawn threw at '+label+': '+e.message);return 1}
    if(result?.error){error('Developer preflight spawn failed at '+label+': '+result.error.message);return 1}
    if(result?.signal){error('Developer preflight terminated at '+label+': '+result.signal);return 1}
    if(!Number.isInteger(result?.status)||result.status<0){error('Developer preflight returned no exit status at '+label);return 1}
    if(result.status!==0){error('Developer preflight failed at '+label+' (exit '+result.status+')');return result.status}
  }
  log(args.length?'Developer checks passed; game verification was not executed.':'Developer checks and unchanged canonical game verification passed.');
  return 0;
}
module.exports={run};
if(require.main===module)process.exitCode=run(process.argv.slice(2));
