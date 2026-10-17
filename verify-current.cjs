'use strict';
// Offline consistency gate, not a signature or a remote-latest check.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function need(ok,message){if(!ok)throw new Error(message)}
function safeName(name){
  need(typeof name==='string'&&name.length>0&&!path.isAbsolute(name)&&!name.includes('\\'),'invalid package path: '+name);
  const parts=name.split('/');
  need(parts.every(p=>/^[A-Za-z0-9._-]+$/.test(p)&&p!=='.'&&p!=='..'&&!p.endsWith('.')&&!/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)), 'noncanonical package path: '+name);
  need(!parts.some(p=>/^\.(?:git|hg|svn)$/i.test(p)),'workspace metadata is not a package file: '+name);
  return parts;
}
function checkedFile(name,base=root){
  const parts=safeName(name);let full=base;
  for(let i=0;i<parts.length;i++){
    need(fs.readdirSync(full).includes(parts[i]),'missing or differently cased file: '+name);
    full=path.join(full,parts[i]);const st=fs.lstatSync(full);
    need(!st.isSymbolicLink(),'symlink refused: '+name);
    need(i===parts.length-1?st.isFile():st.isDirectory(),'not a regular package file: '+name);
  }
  const real=fs.realpathSync(full),rel=path.relative(fs.realpathSync(base),real);
  need(rel!==''&&!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel),'path escapes package: '+name);
  return full;
}
function read(name,base=root){return fs.readFileSync(checkedFile(name,base))}
function verify(base=root){
  const checksumBytes=read('SHA256SUMS.txt',base),text=checksumBytes.toString('utf8');
  need(text.endsWith('\n')&&!text.includes('\r'),'checksum manifest must use LF and final newline');
  const sums=new Map(),folded=new Set(),prefixes=new Map();
  for(const line of text.slice(0,-1).split('\n')){
    const match=/^([a-f0-9]{64})  (.+)$/.exec(line);need(match,'invalid checksum line');
    const[,sha,name]=match;safeName(name);
    const parts=name.split('/');for(let i=1;i<=parts.length;i++){const prefix=parts.slice(0,i).join('/'),key=prefix.toLowerCase();need(!prefixes.has(key)||prefixes.get(key)===prefix,'case-colliding path component: '+name);prefixes.set(key,prefix)}
    need(name.toLowerCase()!=='sha256sums.txt','checksum manifest must exclude itself');
    need(!sums.has(name)&&!folded.has(name.toLowerCase()),'duplicate or case-colliding checksum path: '+name);
    sums.set(name,sha);folded.add(name.toLowerCase());
  }
  const manifestBytes=read('current-verification.json',base),raw=manifestBytes.toString('utf8'),m=JSON.parse(raw);
  const keys=['schemaVersion','version','source','sourceSha256','runner','runnerSha256'];
  need(m&&typeof m==='object'&&!Array.isArray(m),'manifest must be an object');
  need(Object.keys(m).length===keys.length&&keys.every(k=>Object.hasOwn(m,k)),'manifest missing/unknown fields');
  const encodedKeys=[...raw.matchAll(/"((?:\\.|[^"\\])*)"\s*:/g)].map(x=>JSON.parse('"'+x[1]+'"'));
  need(encodedKeys.length===keys.length&&new Set(encodedKeys).size===keys.length,'manifest duplicate or nested keys');
  need(m.schemaVersion===1&&typeof m.version==='string'&&/^[1-9][0-9]*$/.test(m.version),'invalid declared version/schema');
  need(m.source==='index.html','source must be index.html');
  need(m.runner===`verification/run-tests-v${m.version}.cjs`,'runner does not match declared version');
  need(typeof m.sourceSha256==='string'&&/^[a-f0-9]{64}$/.test(m.sourceSha256)&&typeof m.runnerSha256==='string'&&/^[a-f0-9]{64}$/.test(m.runnerSha256),'invalid source/runner SHA');
  for(const n of ['index.html',m.runner,'verify-current.cjs','current-verification.json','README.md'])need(sums.has(n),'required checksum entry missing: '+n);
  const files=new Map();
  for(const[n,sha]of sums){const bytes=n==='current-verification.json'?manifestBytes:read(n,base);need(hash(bytes)===sha,'checksum mismatch: '+n);files.set(n,bytes)}
  need(sums.get(m.source)===m.sourceSha256&&sums.get(m.runner)===m.runnerSha256,'manifest/source/runner checksum disagreement');
  const versions=[...files.get(m.source).toString('utf8').matchAll(/<small>赤色前线 \/ ORIGINAL RTS \/ v0\.([1-9][0-9]*)<\/small>/g)];
  need(versions.length===1&&versions[0][1]===m.version,'source display version disagrees with manifest');
  const block='<!-- current-verification-default -->\n```sh\nnode verify-current.cjs\n```\n<!-- /current-verification-default -->';
  const readme=files.get('README.md').toString('utf8');
  need(readme.split(block).length===2&&readme.split('<!-- current-verification-default -->').length===2&&readme.split('<!-- /current-verification-default -->').length===2,'README stable default block mismatch');
  return {manifest:m,entries:sums.size,files,checksumBytes};
}
function main(){
  const args=process.argv.slice(2);need(args.length===0||(args.length===1&&args[0]==='--check-only'),'supported arguments: no arguments or --check-only');
  const verified=verify(),{manifest:m,entries}=verified;
  console.log(`Package declares v0.${m.version}; source SHA-256 ${m.sourceSha256}; runner ${m.runner}; ${entries} listed files verified.`);
  if(args.length){console.log('Package integrity passed; game verification was not executed. Offline consistency does not establish authenticity or remote latest version.');return}
  // Only normal mode creates an isolated copy. Never execute in the original package:
  // the inherited runner legitimately writes result files with fresh temporary paths.
  const os=require('node:os');let temporary;
  try{
    temporary=fs.mkdtempSync(path.join(os.tmpdir(),'red-current-verification-'));
    for(const[name,bytes]of verified.files){
      const destination=path.join(temporary,...safeName(name));
      fs.mkdirSync(path.dirname(destination),{recursive:true});
      fs.writeFileSync(destination,bytes,{flag:'wx'});
    }
    fs.writeFileSync(path.join(temporary,'SHA256SUMS.txt'),verified.checksumBytes,{flag:'wx'});
    const copied=verify(temporary);
    need(JSON.stringify(copied.manifest)===JSON.stringify(m)&&copied.entries===entries,'temporary package identity disagreement');
    // Retain an immediate source/runner check after copying; this is not a transaction.
    need(hash(read(m.source,temporary))===m.sourceSha256&&hash(read(m.runner,temporary))===m.runnerSha256,'source/runner changed before launch');
    console.log('Running the exact verified runner in a private temporary copy; the original package is read-only.');
    const result=require('node:child_process').spawnSync(process.execPath,[checkedFile(m.runner,temporary)],{cwd:temporary,shell:false,stdio:'inherit'});
    if(result.error){console.error('Runner spawn failed: '+result.error.message);process.exitCode=1;return}
    if(result.signal){console.error('Runner terminated by signal: '+result.signal);process.exitCode=1;return}
    need(Number.isInteger(result.status)&&result.status>=0,'runner returned no exit status');
    process.exitCode=result.status;
  }finally{if(temporary)fs.rmSync(temporary,{recursive:true,force:true})}
}
try{main()}catch(error){console.error('Current verification refused: '+error.message);process.exitCode=1}
