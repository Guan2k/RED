'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'red-repeat-scope-negative-')),baseline=path.join(dir,'baseline.html');fs.writeFileSync(baseline,require('./restore-v281.cjs')(require('./restore-v282.cjs')(require('./restore-v283.cjs')(require('./restore-v284.cjs')(require('./restore-v285.cjs')(require('./restore-v286.cjs')(require('./restore-v287.cjs')(require('./restore-v288-from-v317.cjs')(html)))))))));
const hint='开启任一全局车型，将关闭全部本厂循环并清除本厂补单目标；已付订单保留。关闭全局不关闭本厂循环。';
const tests=[
 ['ambiguous off option','>全局循环：关闭</option>','>循环：关闭</option>','all six global option labels and values'],
 ['wrong option value','<option value="scout">全局循环：侦察战车','<option value="tank">全局循环：侦察战车','all six global option labels and values'],
 ['hidden scope hint','id="globalRepeatScopeHint" class="hint"','id="globalRepeatScopeHint" hidden class="hint"','scope paragraph never hidden'],
 ['wrong visible scope','>'+hint+'</p>','>关闭全局会关闭所有本厂循环。</p>','exact visible scope text'],
 ['wrong title','title="'+hint,'title="关闭全局会取消订单。','title includes full override and off semantics'],
 ['wrong accessible label','aria-label="选择全局循环生产车辆"','aria-label="选择循环生产车辆"','global accessible label'],
 ['broken description link','aria-describedby="globalRepeatScopeHint"','aria-describedby="missingScopeHint"','scope accessible association'],
 ['no wrapping','id="globalRepeatScopeHint" class="hint" style="white-space:normal;overflow-wrap:anywhere"','id="globalRepeatScopeHint" class="hint" style="white-space:nowrap"','scope hint wraps on narrow layout'],
 ['changed tested executable script','function allCompletedFactories(){','/* negative script-identity probe */function allCompletedFactories(){','tested executable game script matches frozen v294 source']
];
const results=[];try{for(const[name,before,after,expected]of tests){assert.equal(html.split(before).length-1,1,'unique mutant '+name);const file=path.join(dir,results.length+'.html');fs.writeFileSync(file,html.replace(before,after));const p=spawnSync(process.execPath,[path.join(__dirname,'global-repeat-scope-v317.cjs'),file,baseline],{encoding:'utf8',maxBuffer:4e6});if(p.error)throw p.error;assert.notEqual(p.status,0,name);assert.ok(p.stderr.includes(expected),name+' expected '+expected+' got '+p.stderr);results.push({name,detected:true,expected})}console.log(JSON.stringify({passed:results.length,failed:0,results,scope:'All eight inherited static-markup mutations must hit the same exact option/text/visibility/title/aria/wrapping assertions. A ninth semantics-preserving script-comment mutation directly verifies current candidate whole-script integrity. The supplied exact v281 baseline avoids a restoration identity failure masking the intended assertion; exact frozen v294-to-v282 restoration remains separately verified. Original source is unchanged.'},null,2))}finally{fs.rmSync(dir,{recursive:true,force:true})}
