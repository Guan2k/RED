'use strict';
// Exact source-only v0.272 reversal. Never loads a game or touches stored data.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const changes=[{"before":"v0.271","after":"v0.272","count":1},{"before":"$('repair').onclick=repairSelected;","after":"$('repair').onclick=repairSelected;$('repair').onkeydown=e=>{if(e.key==='Enter'&&e.repeat&&!e.isComposing&&e.keyCode!==229)e.preventDefault()};","count":1}];
module.exports=function(html){assert.equal(crypto.createHash('sha256').update(html).digest('hex'),'4a7bd31abc7c433f5de2637677cb8d11d5fa4ec75094ac5e8c7d9d9fdb0fb05f','exact v272 source hash');for(const {before,after,count}of [...changes].reverse()){assert.equal(html.split(after).length-1,count,'exact v272 repair-button-repeat boundary');html=html.split(after).join(before)}assert.equal(crypto.createHash('sha256').update(html).digest('hex'),'7d7e7e84d404be3af143e5c3c17527197e415e38192d1653543041f4e1e59b9b','exact restored v271 hash');return html};
