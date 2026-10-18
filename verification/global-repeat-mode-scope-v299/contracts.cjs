'use strict';

const assert = require('node:assert/strict');

const receipts = Object.freeze([
  Object.freeze({
    mode: 'parallel',
    current: '全局循环补单方式设为按空闲工厂并行；每个模拟步最多一单，正常扣款；本厂独立循环不受影响',
    previous: '循环补单改为按空闲工厂并行；每个模拟步最多一单，正常扣款'
  }),
  Object.freeze({
    mode: 'single',
    current: '全局循环补单方式设为单订单；已有付费订单保留；本厂独立循环不受影响',
    previous: '循环补单改为单订单；已有付费订单保留'
  })
]);
const title = '仅用于全局循环；本厂独立循环不受此设置影响。全局关闭时可预设，开启全局车型后生效。单订单模式最多保留一张循环订单；并行模式仅为空闲的已建成工厂补单，每个模拟步最多一单，正常扣款并遵守保留资金和车型目标。切换不取消已付订单。';
const hint = '仅设置全局补单方式；本厂独立循环不受影响。全局关闭时可预设，开启全局车型后生效。';

function requireContract(condition, code, message) {
  if (!condition) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
}

function inlineScript(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  requireContract(scripts.length === 1, 'SCOPE_SCRIPT_COUNT', 'Exactly one inline executable script is required');
  return scripts[0][1];
}

function inspectMarkup(html) {
  const selector = html.match(/<select id="repeatParallel"[^>]*>[\s\S]*?<\/select>/)?.[0] || '';
  const tag = selector.match(/^<select[^>]*>/)?.[0] || '';
  requireContract(tag.includes('aria-label="全局循环补单方式"'), 'SCOPE_ACCESSIBLE_NAME', 'Global repeat mode must have the exact accessible name');
  requireContract(tag.includes('aria-describedby="repeatParallelScopeHint"'), 'SCOPE_HINT_ASSOCIATION', 'Global repeat mode must reference its visible scope hint');
  requireContract(tag.includes('title="' + title + '"'), 'SCOPE_TITLE', 'Title must retain global-only scope, preset behavior, payment, reserve and target wording');
  requireContract(selector.includes('<option value="single" selected>全局补单：单订单（默认）</option>'), 'SCOPE_SINGLE_OPTION', 'Single-order option must identify global scope');
  requireContract(selector.includes('<option value="parallel">全局补单：空闲工厂并行</option>'), 'SCOPE_PARALLEL_OPTION', 'Parallel option must identify global scope');
  const hints = [...html.matchAll(/<p\b([^>]*\bid="repeatParallelScopeHint"[^>]*)>([\s\S]*?)<\/p>/g)];
  requireContract(hints.length === 1 && (html.match(/\bid="repeatParallelScopeHint"/g) || []).length === 1, 'SCOPE_HINT_UNIQUE', 'Exactly one scope description must exist');
  requireContract(hints[0][2] === hint, 'SCOPE_VISIBLE_HINT', 'Visible hint must state global-only scope and off-state preset behavior');
  const hintTag = hints[0][1];
  requireContract(!/(?:^|\s)hidden(?:\s|=|$)|aria-hidden="true"|display\s*:\s*none|visibility\s*:\s*hidden/i.test(hintTag), 'SCOPE_HINT_VISIBLE', 'Scope hint must not be hidden');
  requireContract(hintTag.includes('white-space:normal;overflow-wrap:anywhere'), 'SCOPE_HINT_WRAP', 'Scope hint must retain wrapping styles');
  const script = inlineScript(html);
  for (const receipt of receipts) {
    requireContract(script.split(receipt.current).length - 1 === 1, 'SCOPE_' + receipt.mode.toUpperCase() + '_RECEIPT', 'Exactly one approved ' + receipt.mode + ' receipt must remain');
  }
  requireContract(script.includes("tell(enabled?'" + receipts[0].current + "':'" + receipts[1].current + "')"), 'SCOPE_RECEIPT_BRANCHES', 'Both exact receipts must remain in the actual mode-change handler');
}

function assertExactScriptDelta(html, baseline) {
  let restored = inlineScript(html);
  for (const receipt of receipts) {
    requireContract(restored.split(receipt.current).length - 1 === 1, 'SCOPE_' + receipt.mode.toUpperCase() + '_RECEIPT', 'Exact script restoration requires one approved ' + receipt.mode + ' receipt');
    restored = restored.replace(receipt.current, receipt.previous);
  }
  requireContract(restored === inlineScript(baseline), 'SCOPE_EXECUTABLE_DELTA', 'After reversing only two receipt literals, the entire v298 executable must be byte-identical');
  return restored;
}

function normalizeSnapshot(snapshot) {
  const result = structuredClone(snapshot);
  requireContract(Array.isArray(result.state.logs), 'SCOPE_LOGS_REQUIRED', 'Full-state comparison requires every log entry');
  result.state.logs = result.state.logs.map(entry => {
    const approved = receipts.find(receipt => entry === receipt.current);
    return approved ? approved.previous : entry;
  });
  return result;
}

function assertSnapshotsEqual(previous, current) {
  try {
    assert.deepEqual(normalizeSnapshot(previous), normalizeSnapshot(current));
  } catch (error) {
    if (error.code === 'SCOPE_LOGS_REQUIRED') throw error;
    error.code = 'SCOPE_FULL_STATE_PARITY';
    throw error;
  }
}

module.exports = { receipts, title, hint, inlineScript, inspectMarkup, assertExactScriptDelta, normalizeSnapshot, assertSnapshotsEqual };
