import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { Script } from 'node:vm';
export const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const INPUTS=Object.freeze(['src/index.template.html','src/styles.css','src/script/01-bootstrap.jsfrag','src/geometry.mjs','src/script/02-gameplay.jsfrag','src/script/03-renderer.jsfrag','src/script/04-interface-runtime.jsfrag']);
const FOOTER='export { dist, clamp };\n',RECEIPT='source-build-receipt.json',LOCK='.source-build.lock';
export const sha=b=>createHash('sha256').update(b).digest('hex');
const need=(ok,msg)=>{if(!ok)throw Error(msg)};
function noLinks(full,allowMissing=false){full=path.resolve(full);let part=path.parse(full).root;for(const x of full.slice(part.length).split(path.sep).filter(Boolean)){part=path.join(part,x);try{need(!fs.lstatSync(part).isSymbolicLink(),'symlink refused: '+part)}catch(e){if(allowMissing&&e.code==='ENOENT'&&part===full)return;throw e}}}
function file(root,name){need(!path.isAbsolute(name)&&!name.split(/[\\/]/).includes('..'),'unsafe input path');const p=path.join(root,name);noLinks(p);need(fs.statSync(p).isFile(),'not a regular file: '+name);return fs.readFileSync(p)}
export function assemble(root=ROOT){
 const inputs=INPUTS.map(n=>file(root,n)),texts=inputs.map(b=>b.toString('utf8'));inputs.forEach((b,i)=>need(Buffer.from(texts[i]).equals(b),'invalid UTF-8 input'));
 const [template,css,before,geometry,middle,renderer,after]=texts;
 for(const marker of ['@@RED_STYLE@@','@@RED_SCRIPT@@'])need(template.split(marker).length===2,'exactly one marker required: '+marker);
 need(template.includes('<style>@@RED_STYLE@@</style>')&&template.includes('<script>@@RED_SCRIPT@@</script>'),'markers must occupy inline style/script bodies');
 need(!texts.slice(1).some(s=>s.includes('@@RED_')),'marker in fragment');
 need(geometry.endsWith(FOOTER)&&geometry.split(FOOTER).length===2,'invalid geometry export footer');
 const body=geometry.slice(0,-FOOTER.length);need(!/\b(?:import|export)\b/.test(body),'unsupported geometry module syntax');
 const script=before+body+middle+renderer+after;need(!/<\/script(?=[\t\n\f\r />])/i.test(script),'script closing tag in fragment');need(!/<\/style(?=[\t\n\f\r />])/i.test(css),'style closing tag in CSS');
 new Script(script); // Syntax validation only; never execute gameplay.
 const output=Buffer.from(template.replace('@@RED_STYLE@@',()=>css).replace('@@RED_SCRIPT@@',()=>script));need(!output.includes(Buffer.from('@@RED_')),'unresolved marker');
 const h=createHash('sha256');INPUTS.forEach((n,i)=>h.update(n+'\0'+inputs[i].length+'\0').update(inputs[i]));
 return {output,receipt:{schemaVersion:1,outputSha256:sha(output),inputsSha256:h.digest('hex')}};
}
function readReceipt(root){const r=JSON.parse(file(root,RECEIPT));need(r&&Object.keys(r).sort().join(',')==='inputsSha256,outputSha256,schemaVersion'&&r.schemaVersion===1&&/^[a-f0-9]{64}$/.test(r.outputSha256)&&/^[a-f0-9]{64}$/.test(r.inputsSha256),'invalid build receipt');return r}
export function check(root=ROOT){const b=assemble(root),current=file(root,'index.html'),r=readReceipt(root);need(current.equals(b.output),'generated index.html drift; edit src then build explicitly');need(r.outputSha256===sha(current)&&r.inputsSha256===b.receipt.inputsSha256,'inconsistent build receipt');return b.receipt}
function atomic(root,name,bytes){const target=path.join(root,name);noLinks(target,true);const temp=target+'.tmp-'+randomBytes(8).toString('hex');try{fs.writeFileSync(temp,bytes,{flag:'wx'});fs.renameSync(temp,target)}finally{if(fs.existsSync(temp))fs.unlinkSync(temp)}}
function locked(root,fn){noLinks(root);const lock=path.join(root,LOCK);noLinks(lock,true);const fd=fs.openSync(lock,'wx');try{return fn()}finally{fs.closeSync(fd);fs.unlinkSync(lock)}}
export function writeGenerated(root=ROOT){return locked(root,()=>{const b=assemble(root),old=file(root,'index.html'),r=readReceipt(root);need(sha(old)===r.outputSha256,'manual edit or inconsistent receipt; refusing overwrite');atomic(root,'index.html',b.output);atomic(root,RECEIPT,JSON.stringify(b.receipt,null,2)+'\n');return b.receipt})}
export function recover(root=ROOT){return locked(root,()=>{const b=assemble(root);need(file(root,'index.html').equals(b.output),'recovery refused: assembled bytes do not match index.html');atomic(root,RECEIPT,JSON.stringify(b.receipt,null,2)+'\n');return b.receipt})}
export function out(target,root=ROOT){need(typeof target==='string'&&target&&!target.split(/[\\/]/).includes('..'),'unsafe output path');target=path.resolve(target);const relative=path.relative(root,target);need(relative!=='index.html'&&relative!==RECEIPT&&relative!==LOCK&&!(relative==='src'||relative.startsWith('src'+path.sep)),'protected output path');noLinks(target,true);const b=assemble(root);fs.writeFileSync(target,b.output,{flag:'wx'});return b.receipt}
export function main(args){if(args.length===1&&args[0]==='--check')return check();if(args.length===1&&args[0]==='--write-generated')return writeGenerated();if(args.length===1&&args[0]==='--recover-receipt')return recover();if(args.length===2&&args[0]==='--out')return out(args[1]);throw Error('usage: --check | --out NEW_PATH | --write-generated | --recover-receipt')}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{console.log(JSON.stringify(main(process.argv.slice(2))))}catch(e){console.error(e.message);process.exitCode=1}}
