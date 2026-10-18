'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function markdown(s){
 const records=[],stack=[];let fence=null,comment=false;
 for(const raw of s.split(/\r?\n/)){
  if(fence){const close=raw.match(/^ {0,3}(`+|~+)\s*$/);if(close&&close[1][0]===fence.char&&close[1].length>=fence.length){records.push({kind:'boundary',text:'',historical:stack.some(x=>x.historical)});fence=null}else records.push({kind:'code',text:raw,historical:stack.some(x=>x.historical)});continue}
  let line='',i=0;while(i<raw.length){if(comment){const end=raw.indexOf('-->',i);if(end<0){i=raw.length;break}comment=false;i=end+3}else{const start=raw.indexOf('<!--',i);if(start<0){line+=raw.slice(i);break}line+=raw.slice(i,start);comment=true;i=start+4}}
  const open=line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);if(open&&!(open[1][0]==='`'&&open[2].includes('`'))){fence={char:open[1][0],length:open[1].length};records.push({kind:'boundary',text:'',historical:stack.some(x=>x.historical)});continue}
  const h=line.match(/^ {0,3}(#{1,6})[ \t]+(.+?)\s*#*\s*$/);if(h){const level=h[1].length,title=h[2];while(stack.length&&stack.at(-1).level>=level)stack.pop();stack.push({level,historical:level>=2&&/^(?:v\d|.*历史)/.test(title)});records.push({kind:'heading',text:line,title,level,historical:stack.some(x=>x.historical)})}else records.push({kind:'prose',text:line,historical:stack.some(x=>x.historical)});
 }
 return records;
}
function prose(s){return markdown(s).filter(x=>x.kind==='prose'||x.kind==='heading').map(x=>x.text).join('\n')}
function commandTokens(text){
 const tokens=[];let i=0;while(i<text.length){while(/\s/.test(text[i]||'')&&i<text.length)i++;if(i===text.length)break;let value='';const quote=['"',"'"].includes(text[i])?text[i++]:null;if(quote){while(i<text.length&&text[i]!==quote){if(text[i]==='\\')return null;value+=text[i++]}if(text[i++]!==quote)return null;if(i<text.length&&!/\s/.test(text[i]))return null}else{while(i<text.length&&!/\s/.test(text[i])){if(/["'\\]/.test(text[i]))return null;value+=text[i++]}}tokens.push(value)}return tokens;
}
function declaredCommands(record){
 if(record.kind==='code')return /^\s*node\b/.test(record.text)?[record.text.trim()]:[];
 const commands=[];let outside=record.text.replace(/`([^`]+)`/g,(_,body)=>{if(/^\s*node\b/.test(body))commands.push(body.trim());return ' '});
 outside=outside.replace(/\[[^\]]+\]\([^)]*\)/g,' ');for(const m of outside.matchAll(/\bnode[ \t]+[^`。；，\n]+/g))commands.push(m[0].trim());return commands;
}
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function inspect(root){
 root=path.resolve(root);const checks=[],cache=new Map();
 const add=(code,ok,detail)=>checks.push({code,passed:!!ok,detail});
 function resolveLocal(name){if(typeof name!=='string'||!name||name.includes('\\')||name.includes('\0')||path.isAbsolute(name))return null;const f=path.resolve(root,name);return f.startsWith(root+path.sep)?f:null}
 function read(name){if(cache.has(name))return cache.get(name);let s=null;const f=resolveLocal(name);if(!f)add('path:'+name,false,'unsafe or invalid local path');else try{if(!fs.statSync(f).isFile())throw Error('not a file');const real=fs.realpathSync(f),realroot=fs.realpathSync(root);if(!real.startsWith(realroot+path.sep))throw Error('symlink leaves package');s=fs.readFileSync(f,'utf8')}catch(e){add('read:'+name,false,e.code||e.message)}cache.set(name,s);return s}
 let m=null;const raw=read('current-verification.json');if(raw!==null)try{m=JSON.parse(raw);add('manifest-json',!!m&&typeof m==='object'&&!Array.isArray(m),'JSON object required')}catch{add('manifest-json',false,'invalid JSON')}
 const names=['README.md','CURRENT_PLAYER_GUIDE.md','CURRENT_VERIFICATION_ENTRY.md','QA_STATUS.md'];const docs=Object.fromEntries(names.map(n=>[n,read(n)]));
 if(m&&typeof m==='object'&&!Array.isArray(m)){
  const schema=m.schemaVersion===1&&/^\d+$/.test(m.version)&&typeof m.version==='string'&&m.source==='index.html'&&typeof m.runner==='string'&&/^verification\/run-tests-v\d+\.cjs$/.test(m.runner)&&/^[a-f0-9]{64}$/.test(m.sourceSha256)&&/^[a-f0-9]{64}$/.test(m.runnerSha256);add('manifest-schema',schema,'expected current verification identity fields');
  if(schema){const source=read(m.source),runner=read(m.runner);let version=null;
   if(source!==null){const versions=[...source.matchAll(/ORIGINAL RTS \/ v0\.(\d+)/g)].map(x=>x[1]);add('source-version-marker',versions.length===1,'one displayed version marker');if(versions.length===1)version=versions[0];add('manifest-source-hash',hash(source)===m.sourceSha256,'source bytes agree with manifest')}
   if(runner!==null)add('manifest-runner-hash',hash(runner)===m.runnerSha256,'runner bytes agree with manifest');
   if(version!==null){add('manifest-version',m.version===version,'manifest and source version agree');add('manifest-runner',m.runner===`verification/run-tests-v${version}.cjs`,'runner uses displayed version');for(const n of names)if(docs[n]!==null)add('title:'+n,JSON.stringify((markdown(docs[n]).find(x=>x.kind==='heading')?.title||'').match(/v0\.\d+/g))===JSON.stringify(['v0.'+version]),'current first heading version');
    const guide=docs['CURRENT_PLAYER_GUIDE.md'];if(guide!==null){const claims=markdown(guide).filter(x=>x.kind==='prose'&&!x.historical&&/^本指南对应/.test(x.text)).flatMap(x=>[...x.text.matchAll(/本指南对应\s*v0\.(\d+)/g)].map(m=>m[1]));add('current-guide-identity',JSON.stringify(claims)===JSON.stringify([version]),'one current general claim; historical heading scope inherited by descendants')}
   }
   const entry=docs['CURRENT_VERIFICATION_ENTRY.md'];if(entry!==null){const commands=markdown(entry).filter(r=>!r.historical&&['prose','code'].includes(r.kind)).flatMap(declaredCommands);add('current-entry-command-present',commands.length>0,'at least one real current entry command, including fenced commands');for(const [i,raw]of commands.entries()){const tokens=commandTokens(raw),file=tokens?.[1],options=tokens?.slice(2)||[],stable=['verify-development.cjs','verify-current.cjs'].includes(file),runner=file===m.runner,validOptions=options.length===0||stable&&options.length===1&&options[0]==='--check-only';add('current-entry-command:'+i,!!tokens&&tokens[0]==='node'&&(stable||runner)&&validOptions,{command:raw,allowed:'stable entry with optional single --check-only, or exact manifest runner without options; simple quoted tokens accepted, unparsed tails rejected'})}}
   const rm=docs['README.md'];if(rm!==null){const records=markdown(rm),starts=records.map((r,i)=>r.kind==='heading'&&r.level===2&&r.title==='当前测试与限制'&&!r.historical?i:-1).filter(i=>i>=0);add('current-readme-section',starts.length===1,'one real explicit current testing section');if(starts.length===1){const start=starts[0]+1,end=records.findIndex((r,i)=>i>=start&&r.kind==='heading'&&r.level<=2),section=records.slice(start,end<0?records.length:end);const markers=section.map((r,i)=>r.kind==='prose'&&!r.historical&&/^本版/.test(r.text)?i:-1).filter(i=>i>=0);add('current-runner-line',markers.length===1,'one real current command paragraph; historical descendants and comments excluded');if(markers.length===1){let i=markers[0],commandText=section[i].text,linkText=commandText;
    // A directly associated fenced command is valid, but a fenced label alone is not.
    if(!/node verification\/run-tests-v\d+\.cjs/.test(commandText)){let j=i+1;while(section[j]?.kind==='prose'&&!section[j].text.trim())j++;if(section[j]?.kind==='boundary'&&!section[j].historical){j++;while(section[j]?.kind==='code'&&!section[j].historical){commandText+='\n'+section[j].text;j++}if(section[j]?.kind==='boundary')j++;while(section[j]?.kind==='prose'&&!section[j].text.trim())j++;if(section[j]?.kind==='prose'&&!section[j].historical)linkText+='\n'+section[j].text}}
    const cmds=commandText.split('\n').flatMap(text=>declaredCommands({kind:'prose',text})).map(commandTokens),links=[...linkText.matchAll(/\]\((verification\/run-tests-v\d+\.cjs)\)/g)].map(x=>x[1]);add('current-runner-command',JSON.stringify(cmds)===JSON.stringify([['node',m.runner]]),'current command equals manifest');add('current-runner-link',JSON.stringify(links)===JSON.stringify([m.runner]),'current runner link equals manifest')
   }}}

  }
 }
 for(const [name,s]of Object.entries(docs))if(s!==null)for(const match of prose(s).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){const target=match[1];if(/^[a-z][a-z0-9+.-]*:/i.test(target)||target.startsWith('//'))continue;const [file,anchor]=target.split('#');const text=file?read(file):s;if(text!==null){add('link:'+name+':'+target,true,'local target readable');if(anchor&&(!file||file.endsWith('.md'))){const seen=new Map(),slugs=markdown(text).filter(x=>x.kind==='heading').map(x=>{let slug=x.title.trim().toLowerCase().replace(/[`*_]/g,'').replace(/[^\p{L}\p{N}\p{M}\s_-]/gu,'').replace(/ /g,'-');const n=seen.get(slug)||0;seen.set(slug,n+1);return slug+(n?'-'+n:'')});let decoded;try{decoded=decodeURIComponent(anchor)}catch{decoded=null}add('anchor:'+name+':'+target,decoded!==null&&slugs.includes(decoded),'Markdown heading anchor')}}}
 const failed=checks.filter(x=>!x.passed).length;return {schemaVersion:1,root,passed:checks.length-failed,failed,checks,scope:'Read-only explicit current-document contract, no game execution or automatic repair. Historical versioned sections retain their version values. External links are not fetched.'};
}
if(require.main===module){const args=process.argv.slice(2);if(args.length!==1||args[0].startsWith('--')){process.stderr.write('Usage: node check.cjs <RED-package-root>\n');process.exitCode=2}else{try{const result=inspect(args[0]);process.stdout.write(JSON.stringify(result,null,2)+'\n');process.exitCode=result.failed?1:0}catch(e){process.stdout.write(JSON.stringify({failed:1,error:e.message})+'\n');process.exitCode=1}}}
module.exports={inspect};
