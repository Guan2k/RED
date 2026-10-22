'use strict';
// Latest UI/effects validation is explicitly layered; frozen suites remain historical.
const {main}=require('../current-release/run.cjs');
if(require.main===module){try{main()}catch(e){console.error(e.stack);process.exitCode=1}}
module.exports={main};
