'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Module=require('node:module');
const root=path.resolve(__dirname,'../..'),contract=require('./historical-contract.json');
function historical(name){assert(Object.hasOwn(contract,name),'known historical entry');const filename=path.join(root,'verification',name),source=fs.readFileSync(filename,'utf8');assert.equal(crypto.createHash('sha256').update(source).digest('hex'),contract[name],'historical entry identity');return {filename,source}}
function transform(source){
 const anchor="const inProductionReason=require('./inherit-dom-v317.cjs').productionReasonProjection(g);";
 assert.equal(source.split(anchor).length-1,1,'unique dom projection scope');
 const original=source,declarations=[],reversals=[];
 for(const name of ['refineryMinerProjection','buildingGalleryProjection','galleryProjection']){
  const pattern=new RegExp('if\\((\\(function '+name+'\\(g\\)\\{[\\s\\S]*?\\}\\)\\(g\\))\\(n\\)\\)return false;','g');
  const matches=[...source.matchAll(pattern)];assert.equal(matches.length,1,'unique pure builder '+name);
  declarations.push('const '+name+'='+matches[0][1]+';');
  reversals.push(['if('+name+'(n))return false;',matches[0][0]]);
  source=source.replace(matches[0][0],'if('+name+'(n))return false;');
 }
 source=source.replace(anchor,anchor+declarations.join(''));
 let restored=source.replace(anchor+declarations.join(''),anchor);
 for(const [after,before] of reversals){assert.equal(restored.split(after).length-1,1,'unique reverse predicate');restored=restored.replace(after,before)}
 assert.equal(restored,original,'all non-hoisted source retained exactly');
 return source;
}
function execute(negative=false){
 const {filename,source}=historical(negative?'command-allocation-feedback-negative-control-v318.cjs':'command-allocation-feedback-v318.cjs');
 let program;
 if(negative){const from="path.join(__dirname,'command-allocation-feedback-v318.cjs')";assert.equal(source.split(from).length-1,1,'unique positive child entry');program=source.replace(from,"path.join(__dirname,'../tools/dom-projection/positive.cjs')")}
 else program=transform(source);
 const runner=new Module(filename,module);runner.filename=filename;runner.paths=Module._nodeModulePaths(path.dirname(filename));runner._compile(program,filename);
}
function projectionSource(optimized=false){let source=historical('command-allocation-feedback-v318.cjs').source;if(optimized)source=transform(source);const a=source.indexOf('const dom=g=>'),b=source.indexOf('\nfunction pair(',a);assert(a>=0&&b>a);return source.slice(a,b)}
module.exports={historical,transform,execute,projectionSource};
