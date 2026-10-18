'use strict';
// Source-only inverse of the five exact reviewed v301 changes. Unlike strict restore,
// this retains unrelated test mutations so inherited source negative controls remain meaningful.
const assert=require('node:assert/strict'),changes=require('./changes-v301.json');
module.exports=function reverseReviewedV301Delta(html){for(const c of [...changes].reverse()){assert.equal(html.split(c.after).length-1,1,'unique exact reviewed v301 source delta');html=html.replace(c.after,c.before)}return html};
