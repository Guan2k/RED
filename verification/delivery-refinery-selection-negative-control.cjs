'use strict';

// No generic failure is evidence. Run every healthy case first, then require the
// specified named case, post-action stage, invariant and ERR_ASSERTION per fault.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const FROZEN_SOURCE_HASH = '5d8e0f32d62179704ac98c14ab9229ba4725a5080c1379200ce35b99dd765e2d';
const HISTORICAL_SOURCE_HASH = '73c86d0eb92947d85c70fd47470f1c7c120d36c6f1f120ad84a3bf789546c3fe';
const TOTAL = 72;
const source = path.resolve(process.argv[2] || path.join(__dirname,'../index.html'));
const html = fs.readFileSync(source,'utf8');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const sourceHashBefore = hash(html);
const suite = path.join(__dirname,'delivery-refinery-selection.cjs');
const directory = fs.mkdtempSync(path.join(os.tmpdir(),'red-delivery-refinery-negative-'));
const mutantSource = path.join(directory,'index.html');
const results = [];
const action = 'function selectDeliveryRefinery(){if(commandBlocked())return;let target=selectedDeliveryRefinery();if(!target)return;resetSelectionClicks();selection=new Set([target.id]);placement=null;attackMode=false;drag=null;clearOrdinaryCommand();updateUI()}';
const selectTarget = "return phase==='returning'||phase==='delivery'?nearest(miner,context.refineries(0)):null";
const spec = (name,fault,before,after,expected,stage,invariant)=>({name,fault,replacements:[[before,after]],expected,stage,invariant});
const mutationSpecs = [
  {
    name:'captured_render_target',fault:'Click uses the refinery captured by rendering instead of revalidating current state.',
    replacements:[
      ['let target=selectedDeliveryRefinery(),blocked=commandBlocked()', 'let target=globalThis.__capturedDeliveryTarget=selectedDeliveryRefinery(),blocked=commandBlocked()'],
      [action,action.replace('let target=selectedDeliveryRefinery()','let target=globalThis.__capturedDeliveryTarget')]
    ],expected:'new_nearer_refinery_between_render_and_click_revalidated',stage:'after_click',invariant:'current_refinery_selected'
  },
  spec('omitted_single_selection_guard','Several selected units incorrectly expose and activate a single refinery destination.',
    'function selectedDeliveryRefinery(){if(selection.size!==1)return null;', 'function selectedDeliveryRefinery(){',
    'mixed_selection_revalidated_at_click','after_stale_click','selection_and_input_unchanged'),
  spec('omitted_friendly_owner_guard','A selected enemy miner can select a friendly refinery.',
    "if(!miner||miner.team!==0||miner.type!=='harvester'||miner.build)return null", "if(!miner||miner.type!=='harvester'||miner.build)return null",
    'enemy_miner_revalidated_at_click','after_stale_click','selection_and_input_unchanged'),
  spec('omitted_work_phase_eligibility','Any otherwise eligible miner can select a refinery even while not returning or delivering.',
    selectTarget,'return nearest(miner,context.refineries(0))',
    'partial_without_forced_return_hides_and_rejects_stale_action','after_stale_click','selection_and_input_unchanged'),
  spec('manual_override_ignored','A full-load manually moving miner is treated as returning by this selection action.',
    "phase=harvesterWorkState(miner,context)","phase=miner.load>=180?'returning':harvesterWorkState(miner,context)",
    'phase_change_to_manual_between_render_and_click_rejected','after_stale_click','selection_and_input_unchanged'),
  spec('delivery_phase_omitted','The button silently refuses miners already within the delivery radius.',
    selectTarget,"return phase==='returning'?nearest(miner,context.refineries(0)):null",
    'full_load_delivery_selects_current_refinery','after_render','row_visible'),
  spec('first_refinery_instead_of_nearest','Target uses the first eligible refinery rather than the current nearest.',
    selectTarget,"return phase==='returning'||phase==='delivery'?context.refineries(0)[0]:null",
    'new_nearer_refinery_between_render_and_click_revalidated','after_click','current_refinery_selected'),
  spec('reversed_equal_distance_tie','Equal-distance tie uses the opposite entity order to the harvesting simulation.',
    selectTarget,"return phase==='returning'||phase==='delivery'?nearest(miner,context.refineries(0).slice().reverse()):null",
    'nearest_equal_distance_tie_uses_simulation_array_order','after_click','current_refinery_selected'),
  spec('dead_refinery_included','A nearer destroyed refinery incorrectly remains selectable.',
    selectTarget,"return phase==='returning'||phase==='delivery'?nearest(miner,state.entities.filter(e=>e.type==='refinery'&&e.team===0&&!e.build)):null",
    'dead_nearer_refinery_is_excluded','after_click','current_refinery_selected'),
  spec('enemy_refinery_included','A nearer enemy refinery is incorrectly selectable.',
    selectTarget,"return phase==='returning'||phase==='delivery'?nearest(miner,state.entities.filter(e=>e.type==='refinery'&&e.hp>0&&!e.build)):null",
    'enemy_nearer_refinery_is_excluded','after_click','current_refinery_selected'),
  spec('unfinished_refinery_included','A nearer unfinished refinery is incorrectly selectable.',
    selectTarget,"return phase==='returning'||phase==='delivery'?nearest(miner,state.entities.filter(e=>e.type==='refinery'&&e.team===0&&e.hp>0)):null",
    'unfinished_nearer_refinery_is_excluded','after_click','current_refinery_selected'),
  spec('command_block_guard_omitted','Direct activation is permitted after the battle ends.',
    action,action.replace('if(commandBlocked())return;',''),
    'terminal_blocks_direct_action','after_stale_click','selection_and_input_unchanged'),
  spec('selection_mutates_cash','Selecting a refinery charges money.',
    action,action.replace('resetSelectionClicks();','state.cash--;resetSelectionClicks();'),
    'full_load_returning_exposes_current_identity','after_click','world_unchanged'),
  spec('selection_mutates_cargo','Selecting a refinery clears the miner cargo.',
    action,action.replace('resetSelectionClicks();','get(selection.values().next().value).load=0;resetSelectionClicks();'),
    'full_load_returning_exposes_current_identity','after_click','world_unchanged'),
  spec('selection_issues_move_command','Selecting a refinery rewrites the miner movement goal.',
    action,action.replace('resetSelectionClicks();','get(selection.values().next().value).goal={x:target.x,y:target.y};resetSelectionClicks();'),
    'selection_only_preserves_all_commands_cargo_economy_and_world','after_click','world_unchanged'),
  spec('selection_changes_ore_assignment','Selecting a refinery clears the miner assigned ore patch.',
    action,action.replace('resetSelectionClicks();','get(selection.values().next().value).oreIndex=null;resetSelectionClicks();'),
    'selection_only_preserves_all_commands_cargo_economy_and_world','after_click','world_unchanged'),
  spec('selection_clears_return_flag','Selecting a refinery cancels the existing forced return.',
    action,action.replace('resetSelectionClicks();','get(selection.values().next().value).returnCargo=false;resetSelectionClicks();'),
    'selection_only_preserves_all_commands_cargo_economy_and_world','after_click','world_unchanged'),
  spec('selection_resets_group_membership','Selecting a refinery empties control groups.',
    action,action.replace('resetSelectionClicks();','groups=[[],[],[]];resetSelectionClicks();'),
    'selection_only_preserves_all_commands_cargo_economy_and_world','after_click','world_unchanged'),
  spec('selection_clears_navigation_memory','Selection-only action removes the miner current navigation memory.',
    action,action.replace('resetSelectionClicks();','navigationMemory.delete(get(selection.values().next().value));resetSelectionClicks();'),
    'selection_only_preserves_all_commands_cargo_economy_and_world','after_click','world_unchanged'),
  spec('render_mutates_economy','Read-only rendering changes cash.',
    'function updateDeliveryRefinerySelection(){','function updateDeliveryRefinerySelection(){state.cash++;',
    'repeated_render_and_helper_queries_are_world_input_rng_readonly','after_render','world_unchanged'),
  spec('pending_command_cleanup_omitted','New selection action leaves ordinary/append activations and modes pending.',
    action,action.replace('resetSelectionClicks();','').replace('clearOrdinaryCommand();',''),
    'pending_ordinary_clearing_matches_existing_selection_action','after_click','pending_input_matches_existing_selection'),
  spec('attack_mode_cleanup_omitted','Selecting a refinery leaves attack placement armed.',
    action,action.replace('attackMode=false;',''),
    'pending_attack_clearing_matches_existing_selection_action','after_click','pending_input_matches_existing_selection'),
  spec('building_placement_cleanup_omitted','Selecting a refinery leaves building placement armed.',
    action,action.replace('placement=null;',''),
    'pending_placement_clearing_matches_existing_selection_action','after_click','pending_input_matches_existing_selection'),
  spec('drag_cleanup_omitted','Selecting a refinery retains the old map drag.',
    action,action.replace('drag=null;',''),
    'pending_drag_clearing_matches_existing_selection_action','after_click','pending_input_matches_existing_selection'),
  spec('invalid_click_clears_pending_input','A stale ineligible click destroys pending input despite performing no selection.',
    action,action.replace('if(!target)return;','if(!target){resetSelectionClicks();return;}'),
    'invalid_stale_click_preserves_pending_input','after_stale_click','selection_and_input_unchanged'),
  spec('rounded_coordinates_truncated','Current refinery label truncates coordinates instead of rounding.',
    "target?'选择当前交矿精炼厂 · #'+target.id+'（'+Math.round(target.x)+','+Math.round(target.y)",
    "target?'选择当前交矿精炼厂 · #'+target.id+'（'+Math.floor(target.x)+','+Math.floor(target.y)",
    'label_uses_current_rounded_coordinates','after_render','rounded_coordinates'),
  spec('enter_repeat_guard_omitted','Held Enter is no longer prevented on the new selection control.',
    "$('selectDeliveryRefinery').onkeydown=e=>{if(e.key==='Enter'&&e.repeat&&!e.isComposing&&e.keyCode!==229)e.preventDefault()}",
    "$('selectDeliveryRefinery').onkeydown=e=>{}",
    'enter_repeat_prevents_accidental_reactivation','after_keydown','enter_repeat_prevented')
];
function run(file,expectedHash) {
  const child=spawnSync(process.execPath,[suite,file,expectedHash],{encoding:'utf8',maxBuffer:32*1024*1024});
  assert.ifError(child.error);assert.equal(child.signal,null,'suite exits normally');
  assert.ok(child.stdout.trim(),'structured suite report required');
  return {status:child.status,report:JSON.parse(child.stdout)};
}
function failureAt(result,healthy,expected,stage,invariant) {
  assert.equal(healthy.report.tests.find(t=>t.name===expected)?.passed,true,'exact named healthy case passed');
  const failure=result.report.tests.find(t=>t.name===expected&&!t.passed)?.failure;
  assert.ok(failure,expected+': exact case must fail');
  assert.equal(failure.stage,stage,expected+': exact post-action stage');
  assert.equal(failure.invariant,invariant,expected+': exact invariant');
  assert.equal(failure.code,'ERR_ASSERTION',expected+': behavior assertion, never setup/runtime failure');
  return failure;
}
function rejected(text,healthy) {
  fs.writeFileSync(mutantSource,text);const digest=hash(text),result=run(mutantSource,digest);
  assert.equal(result.status,1,'defective source rejected');
  assert.equal(result.report.total,TOTAL,'all cases attempted');
  assert.equal(result.report.tests.find(t=>t.name==='strict_source_hash')?.passed,true,'failure cannot be the source gate');
  assert.equal(result.report.tests.find(t=>t.name==='source_bytes_unchanged_after_all_cases')?.passed,true);
  assert.equal(result.report.sourceHashBefore,digest);assert.equal(result.report.sourceHashAfter,digest);
  return result;
}
let healthy;
try {
  assert.equal(sourceHashBefore,FROZEN_SOURCE_HASH,'negative driver requires exact frozen healthy source');
  healthy=run(source,FROZEN_SOURCE_HASH);
  assert.equal(healthy.status,0,'full healthy baseline must pass before mutation');
  assert.equal(healthy.report.total,TOTAL);assert.equal(healthy.report.passed,TOTAL);assert.equal(healthy.report.failed,0);
  // Exact historical product source demonstrates feature absence, not a claim
  // that v266 is defective. No omitted-function setup crash counts as detection.
  try {
    const baseline=process.argv[3]?fs.readFileSync(path.resolve(process.argv[3]),'utf8'):require('./restore-v266.cjs')(require('./restore-v267.cjs')(require('./restore-v268.cjs')(require('./restore-v269.cjs')(html))));
    assert.equal(hash(baseline),HISTORICAL_SOURCE_HASH);
    const result=rejected(baseline,healthy);
    const failure=failureAt(result,healthy,'full_load_returning_exposes_current_identity','after_render','row_visible');
    results.push({name:'exact_v266_feature_absence',passed:true,historicalHash:HISTORICAL_SOURCE_HASH,expected:'full_load_returning_exposes_current_identity',...failure,failedCases:result.report.failed,
      scope:'Feature-absence control only: missing rendered destination row asserted without dereferencing a missing helper.'});
  } catch(error) {results.push({name:'exact_v266_feature_absence',passed:false,error:error.stack});}
  for(const spec of mutationSpecs) {
    try {
      let mutant=html;
      for(const [before,after] of spec.replacements) {
        assert.equal(mutant.split(before).length-1,1,spec.name+': mutation anchor exactly once');
        mutant=mutant.replace(before,after);
      }
      const result=rejected(mutant,healthy);
      const failure=failureAt(result,healthy,spec.expected,spec.stage,spec.invariant);
      results.push({name:spec.name,passed:true,fault:spec.fault,expected:spec.expected,...failure,mutantHash:hash(mutant),failedCases:result.report.failed});
    } catch(error) {results.push({name:spec.name,passed:false,error:error.stack});}
  }
} catch(error) {results.push({name:'healthy_complete_baseline',passed:false,error:error.stack});}
finally {fs.rmSync(directory,{recursive:true,force:true});}
const sourceHashAfter=hash(fs.readFileSync(source));
if(sourceHashBefore!==sourceHashAfter)results.push({name:'source_unchanged',passed:false,error:'Healthy source changed'});
const report={suite:'delivery-refinery-selection-negative-control',total:results.length,passed:results.filter(t=>t.passed).length,failed:results.filter(t=>!t.passed).length,
  healthyTotal:healthy?.report.total||0,healthyPassed:healthy?.report.passed||0,healthyAssertions:healthy?.report.assertions||0,sourceHashBefore,sourceHashAfter,
  historicalBaseline:process.argv[3]?'explicit exact v266 source':'portable exact restore-v269 then restore-v268 then restore-v267 then restore-v266 source',
  results,scope:'Full-source temporary product mutants; healthy complete baseline first; exact named stage/invariant ERR_ASSERTION only. Historical v266 is feature absence, not a gameplay regression claim. No native browser or save/load/import/export.'};
console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
