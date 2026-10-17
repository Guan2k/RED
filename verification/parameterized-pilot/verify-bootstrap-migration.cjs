'use strict';

// Read-only migration audit. This compiles but never executes either suite and
// evaluates only pinned historical descriptor literals, never their runners.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const root = __dirname;
const read = relative => fs.readFileSync(path.resolve(root, relative), 'utf8');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(read('bootstrap-migration.json'));
const descriptors = JSON.parse(read('mutations.json'));
const frozen = {
  'order-display-writes': {
    suite: '5813537908ef09e1cc8cad72754adc7d6eb8b2e734bdade66fbe99e05f34ed21',
    negative: 'db0c22a791f9b6dedbe7bf3561a646aef56dbb0d9f5c2967fa7f806735248848',
    passed: 8,
    assertions: 229,
    scenarios: [0, 0, 1, 1, 1, 0, 0, 1, 4, 7]
  },
  'selection-filter-writes': {
    suite: '6a2a7d27db764baa695524728a97dda748cacfc2e76929432cce8e6a0fcb27f6',
    negative: '289751361a6a645daa0bf3df24695755b98ae8b6e587e9ac9228acdfa49058a2',
    passed: 7,
    assertions: 110,
    scenarios: [0, 0, 0, 6, 1, 3, 0, 0]
  }
};

function replaceOnce(source, before, after, label) {
  assert.equal(source.split(before).length - 1, 1, label + ': exactly one allowed site');
  return source.replace(before, after);
}

function approvedTransforms(source, suiteId) {
  const marker = 'let assertions=0,pointer=0;';
  assert.equal(source.split(marker).length - 1, 1, suiteId + ': bootstrap boundary');
  const before = source.slice(0, source.indexOf(marker));
  assert.ok(!before.includes('assert.'), suiteId + ': bootstrap contains no assertion');
  const output = source.match(/ console\.log\(JSON\.stringify\((.*),null,2\)\);/g);
  assert.equal(output?.length, 1, suiteId + ': original output boundary');
  const originalOutput = output[0];
  const resultExpression = originalOutput.slice(' console.log(JSON.stringify('.length, -',null,2));'.length);
  return [
    {
      id: 'explicit-context-bootstrap', expectedOccurrences: 1, before,
      after: "'use strict';\nconst fs=require('node:fs'),assert=require('node:assert/strict');\n" +
        "const ctx=require('./suite-context.cjs').createContext(" + JSON.stringify(suiteId) + ");\n" +
        'const {source,baseline,dir,loadGame}=ctx;\n'
    },
    {
      id: 'scenario-entry-hook', expectedOccurrences: 1,
      before: 'function test(name,f){f();results.push({name,passed:true})}',
      after: 'function test(name,f){ctx.enterScenario(name);f();results.push({name,passed:true})}'
    },
    {
      id: 'result-context-emission', expectedOccurrences: 1,
      before: originalOutput,
      after: ' ctx.finish(' + resultExpression + ');'
    }
  ];
}

function originalDescriptorLiterals(source) {
  const expected = source.match(/const expected=(.*);\nconst variants=/)?.[1];
  const variants = source.match(/const variants=(\[[\s\S]*?\]);\ntry\{/)?.[1];
  assert.ok(expected && variants, 'pinned original descriptor literals exist');
  // Both inputs originate in the full-file hash-pinned historical scripts above.
  // The surrounding child_process calls and mutation loops are not evaluated.
  return JSON.parse(JSON.stringify(vm.runInNewContext(
    '({expected:(' + expected + '),variants:(' + variants + ')})',
    Object.create(null), {timeout: 1000}
  )));
}

assert.equal(manifest.schemaVersion, 1);
assert.equal(descriptors.schemaVersion, 1);
assert.deepEqual(manifest.suites.map(suite => suite.suiteId), Object.keys(frozen), 'exact two-suite registry');
const results = [];
const expectedDescriptors = [];

for (const suite of manifest.suites) {
  const pinned = frozen[suite.suiteId];
  const source = read(suite.source);
  const migrated = read(suite.target);
  const negative = read(suite.historicalNegativeSource);
  const resultBytes = read(suite.historicalResult);
  const historicalResult = JSON.parse(resultBytes);

  assert.equal(sha256(source), pinned.suite, suite.suiteId + ': original suite remains frozen');
  assert.equal(suite.sourceSha256, pinned.suite);
  assert.equal(sha256(negative), pinned.negative, suite.suiteId + ': original negative runner remains frozen');
  assert.equal(suite.historicalNegativeSha256, pinned.negative);
  assert.equal(sha256(resultBytes), suite.historicalResultSha256);
  assert.equal(sha256(migrated), suite.targetSha256);
  assert.equal(suite.expectedPassed, pinned.passed);
  assert.equal(suite.expectedAssertions, pinned.assertions);
  assert.equal(historicalResult.passed, pinned.passed);
  assert.equal(historicalResult.assertions, pinned.assertions);
  assert.deepEqual(suite.caseMapping, historicalResult.results.map(({name}) => ({oldName: name, newName: name})));

  const transforms = approvedTransforms(source, suite.suiteId);
  assert.deepEqual(suite.allowlistedTransforms, transforms, suite.suiteId + ': exact bootstrap-only allowlist');
  let expected = source;
  for (const transform of transforms) expected = replaceOnce(expected, transform.before, transform.after, transform.id);
  assert.equal(migrated, expected, suite.suiteId + ': all behavioral bodies and assertions unchanged');
  new vm.Script(migrated, {filename: suite.target});

  let restored = migrated;
  for (const transform of [...transforms].reverse()) restored = replaceOnce(restored, transform.after, transform.before, transform.id + ' reverse');
  assert.equal(restored, source, suite.suiteId + ': exact byte-for-byte reverse migration');

  const original = originalDescriptorLiterals(negative);
  assert.equal(original.variants.length, pinned.scenarios.length);
  for (const [index, [name, anchor, replacement]] of original.variants.entries()) {
    expectedDescriptors.push({
      id: suite.suiteId + ':' + name.replaceAll(' ', '-'),
      suiteId: suite.suiteId,
      name,
      anchor,
      replacement,
      expectedOccurrences: 1,
      expectedMessage: original.expected[name],
      expectedScenario: historicalResult.results[pinned.scenarios[index]].name
    });
  }
  results.push({
    suiteId: suite.suiteId,
    bootstrapOnly: true,
    reverseMigrationByteExact: true,
    originalCases: pinned.passed,
    originalAssertions: pinned.assertions,
    originalMutationCount: original.variants.length,
    sourceSha256: pinned.suite,
    targetSha256: sha256(migrated)
  });
}

assert.deepEqual(descriptors.mutations, expectedDescriptors, 'all mutation anchors, replacements, messages and scenario mappings preserved');
assert.equal(new Set(descriptors.mutations.map(mutation => mutation.id)).size, descriptors.mutations.length);
console.log(JSON.stringify({
  passed: true,
  suites: results,
  mutationCount: descriptors.mutations.length,
  behaviorExecuted: false,
  scope: 'Read-only bootstrap migration and pure descriptor audit; no behavioral suite or mutation runner executed.'
}, null, 2));
