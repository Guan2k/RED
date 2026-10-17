'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=__dirname,read=p=>fs.readFileSync(path.join(root,p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const proof=JSON.parse(read('README_MIGRATION_V289.json')),notes=read('RELEASE_NOTES.md'),text=notes.toString(),readme=read('README.md').toString();
assert.equal(sha(notes.subarray(0,proof.baselineReleaseNotesBytes)),proof.baselineReleaseNotesSha256,'original release notes prefix');
assert.equal(proof.alreadyPreservedHistoricalBodies.length,41);
for(const s of proof.alreadyPreservedHistoricalBodies){assert.equal(sha(s.body),s.sha256);assert(notes.subarray(0,proof.baselineReleaseNotesBytes).toString().includes(s.body),s.heading+' already preserved body');}
for(const s of proof.archivedSections){const start=text.lastIndexOf(s.heading+'\n');assert(start>=0,s.heading);const bytes=Buffer.from(text.slice(start)).subarray(0,s.bytes);assert.equal(sha(bytes),s.sha256,s.heading+' exact original section');for(const p of s.originalMissingParagraphs)assert(bytes.toString().includes(p),s.heading+' original missing paragraph');}
for(const [file,hash]of Object.entries(proof.unchangedFiles))assert.equal(sha(read(file)),hash,file+' unchanged');
assert.equal((readme.match(/node verification\/run-tests-v289\.cjs/g)||[]).length,1,'one current default');assert(!readme.includes('node verification/run-tests.cjs'),'no old default');
const slug=s=>s.toLowerCase().replace(/[\p{P}\p{S}]/gu,'').replace(/\s/g,'-');let links=0;
for(const m of readme.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){const [file,fragment]=m[1].split('#');assert(!/^(?:[a-z]+:|\/)/i.test(file),'relative package link');const full=path.resolve(root,file);assert(full.startsWith(root+path.sep),'inside package');assert(fs.statSync(full).isFile(),file);if(fragment){const headings=fs.readFileSync(full,'utf8').split('\n').filter(l=>/^#{1,6} /.test(l)).map(l=>slug(l.replace(/^#+ /,'')));assert(headings.includes(fragment),m[1]+' heading anchor');}links++;}
console.log(JSON.stringify({status:'passed',protectedOriginalFiles:Object.keys(proof.unchangedFiles).length,archivedExactSections:proof.archivedSections.length,originalNotesPrefixBytes:proof.baselineReleaseNotesBytes,readmeBytes:Buffer.byteLength(readme),relativeReadmeLinks:links,gameTestsRun:false},null,2));
