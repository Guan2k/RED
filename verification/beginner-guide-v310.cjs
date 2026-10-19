'use strict';

// Portable focused v310 integration checks. No native-browser behavior is simulated.
// Usage: node verification/beginner-guide-v310.cjs [path/to/index.html]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { loadGame } = require('./vm-environment.cjs');
const restoreV299 = require('./restore-v299-from-v310.cjs');

const source = path.resolve(process.argv[2] || path.join(__dirname, '../index.html'));
const fixture = path.join(__dirname, 'beginner-guide-v300-support/approved-fragment.html');
const html = fs.readFileSync(source, 'utf8');
const fragment = fs.readFileSync(fixture, 'utf8');
const baseline = restoreV299(html);
const expectedSourceSha256 = '10061270b6f245d2980f5eb7f45bc6ad742500157ac7e7b16b929fcde0f9a7bd';
const expectedBaselineSha256 = '0113fe16d55a5eebdb68ccc8615d1dd4c935bd0dd32068b02db8bb081d82c071';
const expectedFragmentSha256 = 'ab376e9fb844cbe0ee645f609a6959963878b66a901abb2699a1de5c1d17c777';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
const results = [], negativeControls = [];
let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(plain(actual), plain(expected), message); assertions++; };
const check = (value, message) => { assert.ok(value, message); assertions++; };
function test(name, operation) {
  try { operation(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.stack }); }
}
function rejected(name, operation) {
  assert.throws(operation, { code: 'ERR_ASSERTION' }, name + ' must be rejected');
  assertions++;
  negativeControls.push({ name, rejected: true });
}
function uniqueReplace(value, before, after) {
  equal(value.split(before).length - 1, 1, 'unique mutation anchor: ' + before);
  return value.replace(before, after);
}
function block(value, tag) {
  const matches = [...value.matchAll(new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'gi'))];
  equal(matches.length, 1, 'one ' + tag + ' block');
  return matches[0][1];
}
function productScope(candidate) {
  candidate = require('./source-delta-history-v310.cjs')(candidate);
  equal(candidate.split(fragment).length - 1, 1, 'exactly one reviewed fragment');
  equal((candidate.match(/id="beginnerSurvivalGuide"/g) || []).length, 1, 'one guide root ID');
  equal((candidate.match(/v0\.300/g) || []).length, 1, 'one current display version');
  equal(candidate.replace(fragment, '').replace('v0.300', 'v0.299'), baseline,
    'single complete fragment and display-version change are the entire delta');
  equal(block(candidate, 'script'), block(baseline, 'script'), 'entire executable JS byte-identical');
  equal(block(candidate, 'style'), block(baseline, 'style'), 'entire CSS byte-identical');
}
function checkText(value) {
  check(/^<details id="beginnerSurvivalGuide" class="controls-help" aria-describedby="beginnerSurvivalScope">/.test(value), 'default-closed native details root');
  equal((value.match(/<details\b/g) || []).length, 1, 'one details element');
  check(!/<(?:script|style|a|link|button|input|select|textarea|iframe|canvas)\b/i.test(value), 'read-only native content only');
  check(!/\son[a-z]+\s*=|\stabindex\s*=|\bhidden\b|\baria-live="(?:polite|assertive)"/i.test(value), 'no interaction, focus override, hidden content or announcements');
  equal((value.match(/<li>/g) || []).length, 6, 'six steps');
  check(value.includes('<summary>休闲守卫入门参考</summary>'), 'native summary');
  for (const needle of [
    '展开说明不会自动暂停，阅读时可点击“暂停”按钮',
    '焦点在本说明标题上时，空格用于展开或收起说明，不会暂停战局',
    '准备新局时选择以下配置；这里不会切换当前战局',
    '斜线前哨 · 守卫 · 休闲难度 · 标准规则',
    '初始1700余600', '合计1100', '（100,500）', '（400,520）', '（360,600）', '（340,570）',
    '取消待放置', '输入框外按Esc', '无论是否买车或修理，检查完都点“继续”',
    '不开启“新战车：改为坚守”或“抵达后坚守”', '资金至少700', '资金至少400', '不高于75%',
    '证据限于v0.297完整源码模拟', '每种策略内三组种子的已记录轨迹相同',
    '不能当作多种随机战况的胜率统计', '尚未验证真实浏览器落点误差或新手实操', '以实际胜利提示为准'
  ]) check(value.includes(needle), 'required instruction: ' + needle);
  check(value.includes('先设“循环车型目标：5（含订单）”，再设“循环补单保留：300”，最后开“全局循环：主战坦克 · 350”'), 'exact settings order');
}
function shape(game) {
  const roots = game.elements.filter(element => element.id === 'beginnerSurvivalGuide');
  equal(roots.length, 1, 'unique guide root');
  const root = roots[0];
  equal(root.tagName, 'DETAILS', 'native details');
  equal(root.parentNode?.parentNode?.tagName, 'ASIDE', 'sidebar location');
  equal(root.getAttribute('open'), null, 'closed by default');
  equal(root.hidden, false, 'guide not hidden');
  const index = root.parentNode.children.indexOf(root);
  equal(root.parentNode.children[index - 1]?.id, 'openingPractice', 'after opening practice');
  equal(root.parentNode.children[index + 1]?.id, 'unitReference', 'before unit reference');
  equal(root.children[0]?.tagName, 'SUMMARY', 'first child is native summary');
  equal(root.children[0].getAttribute('tabindex'), null, 'no focus override');
  equal(root.getAttribute('aria-describedby'), 'beginnerSurvivalScope', 'scope description link');
  check(game.element('beginnerSurvivalScope').parentNode === root, 'scope description is inside guide');
}
function retainedDom(game, project = false) {
  const roots = game.elements.filter(element => element.id === 'beginnerSurvivalGuide');
  check(roots.length <= 1, 'projection must not hide duplicate roots');
  const inGuide = element => {
    for (let current = element; current; current = current.parentNode) if (roots.includes(current)) return true;
    return false;
  };
  const constructionReason = element => element.tagName==='SPAN'&&['power','refinery','factory','turret'].some(type=>element.id==='buildReason'+type&&element.parentNode?.dataset.build===type);
  const inBuildingGallery = (function buildingGalleryProjection(g){  const roots=g.elements.filter(e=>e.id==='buildingReferenceGallery'),parents=g.elements.filter(e=>e.id==='unitReference');  const root=roots.length===1?roots[0]:null,parent=parents.length===1?parents[0]:null;  let valid=!!(root&&parent&&root.tagName==='DIV'&&parent.tagName==='DETAILS'&&root.parentNode===parent);  if(valid){const seen=new Set();let n=root;while(n!==g.document.body){if(seen.has(n)||!n.parentNode||!n.parentNode.children.includes(n)){valid=false;break}seen.add(n);n=n.parentNode}}  return element=>{if(!valid)return false;const seen=new Set();for(let n=element;n;n=n.parentNode){if(n===root)return true;if(seen.has(n)||!n.parentNode?.children.includes(n))return false;seen.add(n)}return false}; })(game);
  const inGallery = (function galleryProjection(g){ const roots=g.elements.filter(e=>e.id==='vehicleReferenceGallery'),parents=g.elements.filter(e=>e.id==='unitReference'); const root=roots.length===1?roots[0]:null,parent=parents.length===1?parents[0]:null; let valid=!!(root&&parent&&root.tagName==='DIV'&&parent.tagName==='DETAILS'&&root.parentNode===parent); if(valid){const seen=new Set();let n=root;while(n!==g.document.body){if(seen.has(n)||!n.parentNode||!n.parentNode.children.includes(n)){valid=false;break}seen.add(n);n=n.parentNode}} return element=>{if(!valid)return false;const seen=new Set();for(let n=element;n;n=n.parentNode){if(n===root)return true;if(seen.has(n)||!n.parentNode?.children.includes(n))return false;seen.add(n)}return false};})(game);
  const elements = project ? game.elements.filter(element => !inBuildingGallery(element)&&!inGallery(element)&&!inGuide(element)&&!constructionReason(element)) : game.elements;
  const index = new Map(elements.map((element, i) => [element, i]));
  return elements.map(element => {
    const fields = {};
    for (const [key, value] of Object.entries(element)) {
      if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) fields[key] = value;
    }
    return {
      fields, attributes: { ...element.attributes }, style: { ...element.style }, dataset: { ...element.dataset },
      children: element.children.filter(child => !project || !inBuildingGallery(child)&&!inGallery(child)&&!inGuide(child)&&!constructionReason(child)).map(child => index.get(child)),
      parent: index.get(element.parentNode) ?? null
    };
  });
}
const world = game => game.run('JSON.stringify({state,uid,selection:[...selection],groups,placement,attackMode,ordinaryCommandMode,appendCommandMode,drag,restartPrompt,simulationRemainder,navigation:state.entities.map(e=>[e.id,navigationMemory.get(e)])})');
function change(game, id, value) {
  const element = game.element(id);
  equal(element.disabled, false, id + ' enabled');
  element.value = String(value);
  element.dispatchEvent({ type: 'change' });
}
function summaryBoundary(game) {
  const summary = game.element('beginnerSurvivalGuide').children[0];
  const before = world(game);
  summary.focus();
  for (const [key, code] of [[' ', 'Space'], ['Enter', 'Enter']]) {
    for (const repeat of [false, true]) {
      let prevented = false;
      const event = { key, code, repeat, target: summary, preventDefault() { prevented = true; } };
      game.dispatch('keydown', event);
      game.dispatch('keyup', event);
      equal(world(game), before, 'summary ' + code + ' repeat=' + repeat + ' has no gameplay side effect');
      equal(prevented, false, 'existing global handlers leave ' + code + ' native default unprevented');
    }
  }
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'red-beginner-guide-v310-'));
const baselineFile = path.join(temporary, 'v299.html');
let maps = [];
try {
  fs.writeFileSync(baselineFile, baseline);
  test('pinned source, reviewed fragment and exact restored v299 baseline', () => {
    equal(hash(html), expectedSourceSha256, 'pinned current source');
    equal(hash(baseline), expectedBaselineSha256, 'pinned restored v299 baseline');
    equal(hash(fragment), expectedFragmentSha256, 'pinned reviewed guide copy');
  });
  test('exact prior guide delta after reversing reviewed v310 source changes; all other JS and CSS unchanged', () => productScope(html));
  test('reviewed six-step text and current pause/summary wording', () => checkText(fragment));
  test('sidebar placement, native closed semantics and all retained menu DOM', () => {
    const game = loadGame(source);
    shape(game);
    equal(retainedDom(game, true), retainedDom(loadGame(baselineFile)), 'all existing DOM fields/order preserved');
  });
  test('all eight configured maps are included', () => {
    maps = loadGame(baselineFile).element('scenario').children.filter(element => element.tagName === 'OPTION').map(element => element.value);
    equal(maps, ['classic', 'frontier', 'canyon', 'ridge', 'crossroads', 'switchback', 'ring', 'meridian'], 'exact eight maps');
  });
  for (const map of maps) test(map + ': initial world, settings, retained DOM, modeled toggles and summary boundaries', () => {
    const [old, game] = [baselineFile, source].map(file => loadGame(file, { seed: 29801 }));
    for (const instance of [old, game]) { change(instance, 'scenario', map); instance.start(); }
    shape(game);
    equal(world(game), world(old), 'entire initial world equal');
    equal(retainedDom(game, true), retainedDom(old), 'all prior markup and control state equal');
    const detail = game.element('beginnerSurvivalGuide');
    const before = world(game), storage = [...game.storage];
    summaryBoundary(game);
    // This VM has no native details default action. Only modeled open/close side effects are checked.
    detail.setAttribute('open', '');
    detail.dispatchEvent({ type: 'toggle' });
    equal(world(game), before, 'modeled opening is read-only');
    detail.removeAttribute('open');
    detail.dispatchEvent({ type: 'toggle' });
    equal(world(game), before, 'modeled closing is read-only');
    equal([...game.storage], storage, 'no in-memory storage changes');
    old.element('unitReference').children[0].focus();
    for (const instance of [old, game]) instance.dispatch('keydown', { key: 'f', code: 'KeyF', repeat: false });
    equal(world(game), world(old), 'existing F shortcut preserved with summary focus');
    for (const instance of [old, game]) instance.dispatch('keydown', { key: 'h', code: 'KeyH', repeat: false });
    equal(world(game), world(old), 'existing H shortcut preserved with summary focus');
  });
  test('body Space still pauses/resumes, repeated Space does not toggle, body Enter is inert', () => {
    const game = loadGame(source, { seed: 29801 }).start();
    game.document.body.focus();
    equal(game.state.paused, false, 'started unpaused');
    game.dispatch('keydown', { key: ' ', code: 'Space', repeat: false });
    equal(game.state.paused, true, 'body Space reaches pause handler');
    game.dispatch('keydown', { key: ' ', code: 'Space', repeat: true });
    equal(game.state.paused, true, 'held Space does not retoggle');
    game.dispatch('keydown', { key: ' ', code: 'Space', repeat: false });
    equal(game.state.paused, false, 'fresh body Space resumes');
    const before = world(game);
    game.dispatch('keydown', { key: 'Enter', code: 'Enter', repeat: false });
    equal(world(game), before, 'body Enter has no gameplay action');
  });
  const textMutations = [
    ['missing explicit pause-button instruction', value => value.replace('展开说明不会自动暂停，阅读时可点击“暂停”按钮', '按空格自动暂停')],
    ['wrong summary Space instruction', value => value.replace('焦点在本说明标题上时，空格用于展开或收起说明，不会暂停战局', '聚焦标题后按空格暂停战局')],
    ['default-open root', value => value.replace('class="controls-help"', 'open class="controls-help"')],
    ['new auto-action button', value => value.replace('</details>', '<button>自动配置</button></details>')],
    ['external link dependency', value => value.replace('</details>', '<a href="https://example.com">攻略</a></details>')],
    ['summary custom key handler', value => value.replace('<summary>', '<summary onkeydown="x()">')],
    ['lost scope difficulty', value => value.replace('休闲难度 · 标准规则', '标准难度 · 标准规则')],
    ['wrong opening budget', value => value.replace('初始1700余600', '初始1700余700')],
    ['wrong coordinate', value => value.replace('（100,500）', '（100,400）')],
    ['missing placement recovery', value => value.replace('取消待放置', '忽略预览')],
    ['repeat order changed', value => value.replace('先设“循环车型目标：5（含订单）”，再设“循环补单保留：300”，最后开“全局循环：主战坦克 · 350”', '先开“全局循环：主战坦克 · 350”，再设目标和保留')],
    ['missing continue after every check', value => value.replace('无论是否买车或修理，检查完都点“继续”', '有修理时再继续')],
    ['arrival hold inverted', value => value.replace('不开启“新战车：改为坚守”或“抵达后坚守”', '开启“新战车：改为坚守”或“抵达后坚守”')],
    ['seed limit dropped', value => value.replace('每种策略内三组种子的已记录轨迹相同', '多种种子独立证明必胜')],
    ['native proof falsely claimed', value => value.replace('尚未验证真实浏览器落点误差或新手实操', '真实浏览器与新手实操均验证通过')]
  ];
  for (const [name, mutate] of textMutations) test('negative text: ' + name, () => {
    const mutated = mutate(fragment);
    check(mutated !== fragment, 'mutation took effect');
    rejected(name, () => checkText(mutated));
  });
  for (const [name, mutate] of [
    ['root moved to overlay', game => game.element('gameModal').appendChild(game.element('beginnerSurvivalGuide'))],
    ['duplicate root', game => { const element = game.document.createElement('details'); element.id = 'beginnerSurvivalGuide'; game.element('beginnerSurvivalGuide').parentNode.appendChild(element); }],
    ['summary tabindex override', game => game.element('beginnerSurvivalGuide').children[0].setAttribute('tabindex', '-1')]
  ]) test('negative DOM: ' + name, () => {
    const game = loadGame(source);
    mutate(game);
    rejected(name, () => shape(game));
  });
  test('projection retains unrelated fields and similarly prefixed IDs', () => {
    const game = loadGame(source), before = retainedDom(game, true);
    game.element('unitReference').hidden = true;
    rejected('unrelated field change', () => equal(retainedDom(game, true), before));
    const other = loadGame(source), old = retainedDom(other, true), element = other.document.createElement('p');
    element.id = 'beginnerSurvivalGuideOther';
    other.element('beginnerSurvivalGuide').parentNode.appendChild(element);
    rejected('similarly prefixed unrelated ID', () => equal(retainedDom(other, true), old));
  });
  for (const [name, mutate] of [
    ['duplicate complete fragment', value => value.replace(fragment, fragment + fragment)],
    ['unrelated executable change', value => value.replace('<script>', '<script>/* unwanted change */')],
    ['unrelated stylesheet change', value => value.replace('<style>', '<style>/* unwanted change */')],
    ['display version not bumped', value => value.replace('v0.310', 'v0.309')]
  ]) test('negative exact delta: ' + name, () => {
    const mutated = mutate(html);
    check(mutated !== html, 'mutation took effect');
    rejected(name, () => productScope(mutated));
  });
  const guard = "if(['BUTTON','SUMMARY'].includes(document.activeElement.tagName)&&(e.code==='Space'||e.key==='Enter'))return;";
  for (const [name, replacement] of [
    ['summary Space escapes existing guard', guard.replace("['BUTTON','SUMMARY']", "['BUTTON']")],
    ['summary Enter default incorrectly prevented', "if(document.activeElement.tagName==='SUMMARY'&&e.key==='Enter'){e.preventDefault();return;}" + guard]
  ]) test('negative keyboard boundary: ' + name, () => {
    const mutated = uniqueReplace(html, guard, replacement);
    const mutationFile = path.join(temporary, 'keyboard-mutation.html');
    fs.writeFileSync(mutationFile, mutated);
    rejected(name, () => summaryBoundary(loadGame(mutationFile, { seed: 29801 }).start()));
  });
  test('source, approved fixture and temporary baseline remain unchanged', () => {
    equal(fs.readFileSync(source, 'utf8'), html, 'source unchanged');
    equal(fs.readFileSync(fixture, 'utf8'), fragment, 'approved fixture unchanged');
    equal(fs.readFileSync(baselineFile, 'utf8'), baseline, 'restored baseline unchanged');
  });
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
test('all temporary baseline and mutant files removed', () => check(!fs.existsSync(temporary), 'temporary directory removed'));
const failed = results.filter(result => !result.passed).length;
console.log(JSON.stringify({
  sourceSha256: hash(html), baselineSha256: hash(baseline), approvedFragmentSha256: hash(fragment),
  passed: results.length - failed, failed, assertions, maps, negativeControls,
  scope: 'Focused v310 integration. Exact reviewed fragment plus display-version-only delta against restored final v299; whole JS/CSS identity; native-details static semantics and current pause wording; all eight initial worlds and retained DOM; summary Space/Enter global-handler boundaries; modeled toggle side effects; mutation negatives. The VM does not implement native details activation, real layout/scrolling, screen readers or browser storage. No native keyboard-toggle proof, current-release six-minute survival rerun, aggregate or publication claim. Only temporary OS files are written, and they are removed.',
  results
}, null, 2));
if (failed) process.exitCode = 1;
