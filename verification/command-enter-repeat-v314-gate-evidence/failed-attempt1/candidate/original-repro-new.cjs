const {loadGame}=require('/workspace/scratch/e433d7540f34/red-development/v314-work/RED/verification/vm-environment.cjs');
const source='/workspace/scratch/e433d7540f34/red-development/v314-work/RED/index.html';
function key(g,b,key,repeat=false){let prevented=false;const e={type:'keydown',target:b,key,code:key,repeat,preventDefault(){prevented=true;this.defaultPrevented=true}};b.dispatchEvent(e);g.dispatch('keydown',e);if(key==='Enter'&&!prevented)b.click({detail:0});return prevented}
for(const kind of ['attack','power']){
 const g=loadGame(source).start();g.click('selectArmy');const b=kind==='attack'?g.element('attack'):g.elements.find(e=>e.dataset.build===kind);b.focus();
 const rows=[];const record=label=>rows.push({label,attack:g.run('attackMode'),placement:g.run('placement')});
 record('initial');key(g,b,'Enter');record('Enter initial native-default model');key(g,b,'Enter',true);record('Enter repeat native-default model');
 key(g,b,'Escape');record('Escape while Enter held');key(g,b,'Enter',true);record('Enter repeat after Escape');
 console.log(JSON.stringify({kind,rows,scope:'Synthetic event model of browser Enter keydown default click, not native browser verification'},null,2));
}
