'use strict';
// Expected-side only. The historical layout body is hash-locked, then supplied
// independently specified strings BEFORE it measures, clamps or chooses candidates.
// Candidate source/paints/methods must never enter this adapter.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const oldExpression="let label='矿 '+Math.ceil(o.amount/1000)+'k'";
const historicalHashes=new Set(['d04b49438c250c854b16c4a8040b90090db8f901be3593d54a0f0fa346657078','a6d90fdbec4cfd8b03934dea8a995cf68662f7b7c05d63b00318dea185246965']);
function expectedOreLabel(amount){
 if(!(amount>0))return null;
 if(amount>=1000)return ['矿 ',String(Math.ceil(amount/1000)),'k'].join('');
 return ['矿 ',String(Math.ceil(amount))].join('');
}
function expectedLayoutFunction(historical){
 const sha=crypto.createHash('sha256').update(historical).digest('hex');
 assert.ok(historicalHashes.has(sha),'low-ore expected-side immutable historical layout identity');
 assert.equal(historical.split(oldExpression).length-1,1,'low-ore expected-side unique formatting slot');
 return historical.replace(oldExpression,'let label=('+expectedOreLabel.toString().replace(/\n/g,' ')+')(o.amount)');
}
function expectedLayoutSource(html){
 const lines=html.split('\n').filter(x=>x.startsWith('function oreLabelLayout('));
 assert.equal(lines.length,1,'low-ore expected-side unique layout function');
 return html.replace(lines[0],expectedLayoutFunction(lines[0]));
}
function installExpectedOreLabels(g){
 const historical=g.run('oreLabelLayout.toString()'),expected=expectedLayoutFunction(historical);
 g.run('oreLabelLayout = ('+expected+');');return g;
}
module.exports=Object.freeze({expectedOreLabel,expectedLayoutFunction,expectedLayoutSource,installExpectedOreLabels});
