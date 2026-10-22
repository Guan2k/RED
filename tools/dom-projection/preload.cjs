'use strict';
// Explicit optimized-test mode. This changes runtime test code, not game code.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),Module=require('node:module');
const adapter=require('./adapter.cjs'),root=fs.realpathSync(path.resolve(__dirname,'../..'));
const auditRaw=process.env.RED_DOM_PROJECTION_AUDIT_DIR;
if(!auditRaw||!path.isAbsolute(auditRaw))throw Error('Explicit DOM transform requires an absolute existing RED_DOM_PROJECTION_AUDIT_DIR outside the sealed package');
const audit=fs.realpathSync(auditRaw),relative=path.relative(root,audit);
if(!fs.statSync(audit).isDirectory()||relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw Error('DOM transform audit directory must be outside the sealed package');
const original=adapter.historical('command-allocation-feedback-v318.cjs').source,transformed=adapter.transform(original);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),originalSha=sha(original),transformedSha=sha(transformed);
const file=path.join(audit,'dom-transform-'+crypto.randomUUID()+'.jsonl'),nativeCompile=Module.prototype._compile;
Module.prototype._compile=function(content,filename){
 if(typeof filename!=='string'||path.basename(filename)!=='command-allocation-feedback-v318.cjs'||path.basename(path.dirname(filename))!=='verification')return Reflect.apply(nativeCompile,this,arguments);
 if(typeof content!=='string')throw Error('DOM transform target must be string source');
 const inputSha=sha(content);
 if(inputSha!==originalSha&&inputSha!==transformedSha)throw Error('DOM transform target source SHA mismatch');
 const applied=inputSha===originalSha;
 // Audit is mandatory for this code-transform mode. Failure stops compilation;
 // it is not the best-effort observation policy of verification-progress.
 fs.appendFileSync(file,JSON.stringify({schema:1,mode:'explicit-dom-projection-transform',at:new Date().toISOString(),pid:process.pid,filename,inputSha256:inputSha,originalSha256:originalSha,transformedSha256:transformedSha,transformApplied:applied,exactReverseRestorationChecked:true,scope:'Three pure projection builders hoisted within one dom(g) call; original assertions and limits retained. Compilation event is not a test-pass verdict.'})+'\n',{encoding:'utf8',flag:'a',mode:0o600});
 const args=Array.from(arguments);args[0]=applied?transformed:content;
 return Reflect.apply(nativeCompile,this,args);
};
