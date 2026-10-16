'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),baseline=require('./repair-work-baseline-v247.json');
module.exports=function(html){if(html.includes("ORIGINAL RTS / v0.249"))html=require("./restore-v248.cjs")(html);for(const {before,after,count} of [...baseline.changes].reverse()){assert.equal(html.split(after).length-1,count,'exact v248 repair-work boundary');html=html.split(after).join(before)}assert.equal(crypto.createHash('sha256').update(html).digest('hex'),baseline.htmlSha256,'exact restored v247 hash');return html};
