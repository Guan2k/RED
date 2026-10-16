const original=require('./original-restore-v246.cjs');module.exports=html=>original(html.includes('ORIGINAL RTS / v0.258')?require('./current-source-chain.cjs')(html):html);
