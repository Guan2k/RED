'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../index.html')),results=[];let tmp;
const exact=(s,from,to)=>{assert.equal(s.split(from).length-1,1,'mutation anchor unique: '+from);return s.replace(from,to)};
const rowChange=(s,fn)=>{const marker='<li data-reference-building="hq">',at=s.indexOf(marker),end=s.indexOf('</li>',at);assert.ok(at>=0&&end>at);return s.slice(0,at)+fn(s.slice(at,end))+s.slice(end)};
const mutations=[
 ['building geometry shifted',s=>rowChange(s,r=>r.replace('x="-35"','x="-34"')),'hq original exact current draw replay'],
 ['building stroke omitted',s=>rowChange(s,r=>r.replace(/<rect[^\n]*stroke="#5c946b"[^\n]*\/>\n/,'')),'hq original exact current draw replay'],
 ['building mode stuck',s=>exact(s,'if(buildings.dataset.preview!==mode)buildings.dataset.preview=mode','if(buildings.dataset.preview!==mode)buildings.dataset.preview=\'false\''),'readonly and immediate both-gallery mode sync initial'],
 ['legacy vehicle mode stuck',s=>exact(s,'if(gallery.dataset.preview!==mode)gallery.dataset.preview=mode','if(gallery.dataset.preview!==mode)gallery.dataset.preview=\'false\''),'readonly and immediate both-gallery mode sync initial'],
 ['preview mutates world cash',s=>exact(s,'updateVisualPreviewControl()};','state.cash-=1;updateVisualPreviewControl()};'),'readonly and immediate both-gallery mode sync running'],
 ['reference defaults open',s=>exact(s,'<details id="unitReference" class="controls-help">','<details id="unitReference" class="controls-help" open>'),'decorative subtree and preserved closed reference'],
 ['building SVG accessibility exposed',s=>rowChange(s,r=>r.replace('aria-hidden="true"','aria-hidden="false"')),'decorative subtree and preserved closed reference'],
 ['building graphic becomes focusable',s=>rowChange(s,r=>r.replace('<svg class=','<svg tabindex="0" class=')),'decorative subtree and preserved closed reference'],
 ['building style loses compact narrow constraint',s=>exact(s,'.building-reference-grid svg{display:block;width:96px;max-width:100%;height:auto;','.building-reference-grid svg{display:block;width:960px;max-width:none;height:auto;'),'scoped responsive CSS and noninteractive graphic contract'],
 ['building CSS escapes subtree',s=>exact(s,'.building-reference-grid .reference-preview{display:none}','.reference-preview{display:none}'),'scoped responsive CSS and noninteractive graphic contract'],
 ['building initial preview incorrect',s=>exact(s,'id="buildingReferenceGallery" data-preview="false"','id="buildingReferenceGallery" data-preview="true"'),'original default and session choice survive start and restart folded'],
 ['stable update rewrites building dataset',s=>exact(s,'if(buildings.dataset.preview!==mode)buildings.dataset.preview=mode','buildings.dataset.preview=mode'),'stable refresh never rewrites either gallery mode'],
 ['HQ new-building restriction omitted',s=>exact(s,'<span>指挥中心（不可新建）</span>','<span>指挥中心</span>'),'hq original exact current draw replay']
];
function report(name,fn){try{const details=fn();results.push({name,passed:true,...details})}catch(e){results.push({name,passed:false,error:e.message})}}
try{
 const html=fs.readFileSync(source,'utf8');tmp=fs.mkdtempSync(path.join(os.tmpdir(),'red-building-controls-v314-'));
 for(const[name,mutate,target]of mutations)report(name,()=>{const next=mutate(html);assert.notEqual(next,html,'mutation must change source');const file=path.join(tmp,name+'.html');fs.writeFileSync(file,next);const r=spawnSync(process.execPath,[path.join(__dirname,'building-reference-v314.cjs'),file],{encoding:'utf8',maxBuffer:8*1024*1024});assert.equal(r.status,1,name+': '+r.stderr);assert.equal(r.stderr,'');const evidence=JSON.parse(r.stdout);assert.ok(evidence.failed>0);assert.equal(evidence.results.find(t=>t.name===target)?.passed,false,'specified behavioral assertion must detect mutation, not only script hash');return {target,detectedFailures:evidence.failed};});
}catch(e){results.push({name:'negative-control setup',passed:false,error:e.message})}finally{if(tmp)try{fs.rmSync(tmp,{recursive:true,force:true})}catch(e){results.push({name:'temporary cleanup',passed:false,error:e.message})}}
const failed=results.filter(r=>!r.passed).length;console.log(JSON.stringify({passed:results.length-failed,failed,mutations:mutations.length,results,scope:'Thirteen targeted candidate mutations. Each requires its named behavioral assertion to fail, not merely checksum rejection or process failure. No historical suite edits.'},null,2));process.exitCode=failed?1:0;
