'use strict';
// Adversarial checks for the two-family pilot. Only disposable clones are edited.
// Run: node test-maintenance-pilot/runner-probes.cjs
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = __dirname;
const required = ['order-display-writes', 'selection-filter-writes'];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJSON = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const reportFile = path.join(root, 'runner-probes-results.json');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'red-runner-probes-'));
const snapshot = path.join(workspace, 'snapshot');
const originalHashes = new Map();
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  command: 'node test-maintenance-pilot/runner-probes.cjs',
  scope: 'Independent cloned-runner/context probes. No frozen files changed and no full 18-mutation aggregate executed.',
  methodology: 'Verify an unchanged snapshot positively for both families first. Then isolate each attack in a fresh clone. Re-register deliberate suite/context/mutation edits so their own hash checks do not mask the boundary under test. Every rejection is checked for an exact failure message or classifier value, never merely a nonzero exit.',
  normal: [],
  calibration: [],
  probes: [],
  failures: [],
};
let serial = 0;

function rememberOriginal(file, expected) {
  const bytes = fs.readFileSync(file);
  if (expected) assert.equal(hash(bytes), expected, 'original integrity ' + file);
  originalHashes.set(file, hash(bytes));
  return bytes;
}

function prepareSnapshot() {
  fs.mkdirSync(snapshot);
  const manifestFile = path.join(root, 'current-suite-manifest.json');
  const original = JSON.parse(rememberOriginal(manifestFile).toString('utf8'));
  assert.deepEqual(Object.keys(original.suites), required, 'complete original registry');
  const manifest = structuredClone(original);
  const copyLocal = (entry, label) => {
    const source = path.resolve(root, entry.path);
    const destination = path.resolve(snapshot, entry.path);
    assert.ok(destination.startsWith(snapshot + path.sep), 'local clone destination ' + label);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.writeFileSync(destination, rememberOriginal(source, entry.sha256));
  };
  for (const [name, entry] of Object.entries(manifest.references)) copyLocal(entry, name);
  copyLocal(manifest.mutations, 'mutations');
  for (const [suiteId, spec] of Object.entries(manifest.suites)) {
    copyLocal({path: spec.module, sha256: spec.sha256}, suiteId);
    spec.historical.path = path.resolve(root, spec.historical.path);
    rememberOriginal(spec.historical.path, spec.historical.sha256);
  }
  for (const entry of Object.values(manifest.integrity)) {
    const resolved = path.resolve(root, entry.path);
    if (resolved.startsWith(root + path.sep)) copyLocal(entry, entry.path);
    else {
      entry.path = resolved;
      rememberOriginal(resolved, entry.sha256);
    }
  }
  manifest.candidate.path = path.resolve(root, manifest.candidate.path);
  rememberOriginal(manifest.candidate.path, manifest.candidate.sha256);
  writeJSON(path.join(snapshot, 'current-suite-manifest.json'), manifest);
  report.candidateSha256 = manifest.candidate.sha256;
  report.snapshot = {
    candidate: manifest.candidate,
    suites: Object.fromEntries(required.map(id => [id, {sha256: manifest.suites[id].sha256, historical: manifest.suites[id].historical}])),
    integrity: manifest.integrity,
    mutations: manifest.mutations,
    references: manifest.references,
  };
  return manifest;
}

function clone() {
  const directory = path.join(workspace, 'probe-' + (++serial));
  fs.cpSync(snapshot, directory, {recursive: true});
  return {
    directory,
    manifest: readJSON(path.join(directory, 'current-suite-manifest.json')),
    registrations: [],
    save() { writeJSON(path.join(this.directory, 'current-suite-manifest.json'), this.manifest); },
    runner() { this.save(); return require(path.join(this.directory, 'run-current-suites.cjs')); },
  };
}

function registerSuite(c, suiteId, contents) {
  const entry = c.manifest.suites[suiteId];
  const previousSha256 = entry.sha256;
  fs.writeFileSync(path.join(c.directory, entry.module), contents);
  entry.sha256 = hash(Buffer.from(contents));
  c.registrations.push({kind: 'suite', path: entry.module, previousSha256, sha256: entry.sha256});
  c.save();
}

function patchIntegrityModule(c, filename, before, after) {
  const file = path.join(c.directory, filename);
  const contents = fs.readFileSync(file, 'utf8');
  assert.equal(contents.split(before).length - 1, 1, 'unique module probe anchor: ' + before);
  const modified = contents.replace(before, after);
  fs.writeFileSync(file, modified);
  const entry = Object.values(c.manifest.integrity).find(value => path.resolve(c.directory, value.path) === file);
  assert.ok(entry, 'integrity entry for ' + filename);
  const previousSha256 = entry.sha256;
  entry.sha256 = hash(Buffer.from(modified));
  c.registrations.push({kind: 'integrity', path: filename, previousSha256, sha256: entry.sha256});
  c.save();
}

function registerMutation(c, mutation) {
  const file = path.join(c.directory, c.manifest.mutations.path);
  const mutations = readJSON(file);
  mutations.mutations.push(mutation);
  writeJSON(file, mutations);
  const previousSha256 = c.manifest.mutations.sha256;
  c.manifest.mutations.sha256 = hash(fs.readFileSync(file));
  c.registrations.push({kind: 'mutations', path: c.manifest.mutations.path, previousSha256, sha256: c.manifest.mutations.sha256});
  c.save();
}

function stubSuite(c, suiteId, options = {}) {
  const spec = c.manifest.suites[suiteId];
  const sequence = options.sequence || [];
  const scenarios = options.oneScenario ? [spec.scenarios[0]] : spec.scenarios;
  return `'use strict';\n` +
    `const fs=require('node:fs'),assert=require('node:assert/strict');\n` +
    `const ctx=require('./suite-context.cjs').createContext(${JSON.stringify(suiteId)});\n` +
    `try {\n` +
    `for(const scenario of ${JSON.stringify(scenarios)}) {\n` +
    `ctx.enterScenario(scenario);\n` +
    sequence.map(role => `ctx.loadGame(ctx.${role === 'candidate' ? 'source' : 'baseline'},{seed:198199});\n`).join('') +
    (options.failMessage ? `assert.fail(${JSON.stringify(options.failMessage)});\n` : '') +
    `}\n` +
    `ctx.finish(${JSON.stringify({passed: spec.passed, failed: 0, assertions: spec.assertions, results: []})});\n` +
    `} finally {fs.rmSync(ctx.dir,{recursive:true,force:true});}\n`;
}

function summarize(out, classification) {
  const failure = out.evidence?.failure;
  return {
    exitStatus: out.child.status,
    signal: out.child.signal,
    processError: out.child.error ? String(out.child.error) : null,
    classification: classification || null,
    evidence: out.evidence ? {
      suiteId: out.evidence.suiteId,
      scenario: out.evidence.scenario,
      started: out.evidence.started,
      completed: out.evidence.completed,
      suiteHash: out.evidence.suiteHash || null,
      expected: out.evidence.expected || null,
      mutation: out.evidence.mutation || null,
      loadCount: out.evidence.loads.length,
      loads: out.evidence.loads,
      failure: failure ? {name: failure.name, code: failure.code, message: failure.message} : null,
    } : null,
  };
}

function assertFailure(out, code, message, name = 'Error') {
  assert.ifError(out.child.error);
  assert.equal(out.child.signal, null, 'probe not signalled');
  assert.equal(out.child.status, 1, 'probe exited with a handled failure');
  assert.equal(out.evidence?.completed, false, 'probe did not complete');
  assert.equal(out.evidence?.failure?.code, code, 'exact error code');
  assert.equal(out.evidence?.failure?.name, name, 'exact error name');
  assert.equal(out.evidence?.failure?.message, message, 'exact failure message');
}

function probe(id, suiteId, attack, check) {
  const c = clone();
  const item = {id, suiteId, attack, expected: {}, registrations: c.registrations, passed: false};
  report.probes.push(item);
  try {
    check(c, item);
    item.passed = true;
  } catch (error) {
    item.error = {name: error.name, code: error.code || null, message: error.message, stack: error.stack};
    report.failures.push(id);
  }
  process.stdout.write((item.passed ? 'PASS ' : 'FAIL ') + id + '\n');
  writeJSON(reportFile, report);
}

function capturePositiveFailure(runner, suiteId) {
  try { runner.positive(suiteId); }
  catch (error) { return {name: error.name, code: error.code || null, message: error.message.split('\n')[0]}; }
  assert.fail('positive runner accepted invalid evidence');
}

function main() {
  try {
    const manifest = prepareSnapshot();
    const normalClone = clone();
    const normalRunner = normalClone.runner();
    for (const suiteId of required) {
      const out = normalRunner.positive(suiteId);
      report.normal.push({suiteId, passed: out.result.passed, assertions: out.result.assertions, loadCount: out.evidence.loads.length, completed: out.evidence.completed});
      process.stdout.write('PASS unchanged-positive:' + suiteId + '\n');
    }
    const mutations = readJSON(path.join(snapshot, manifest.mutations.path)).mutations;
    const mutationFor = suiteId => mutations.find(mutation => mutation.suiteId === suiteId);
    const calibratedOutcomes = new Map();
    // One real behavior mutation per family calibrates the classifier; this is not the full mutation aggregate.
    for (const suiteId of required) {
      const c = clone(), runner = c.runner(), mutation = mutationFor(suiteId);
      assert.ok(mutation, 'calibration mutation exists');
      const out = runner.run(suiteId, mutation.id);
      const classification = runner.classifyNegative(out, mutation);
      assert.equal(classification, 'DETECTED_BEHAVIOR', 'real behavior calibration ' + suiteId);
      calibratedOutcomes.set(suiteId, out);
      report.calibration.push({suiteId, mutationId: mutation.id, ...summarize(out, classification)});
      process.stdout.write('PASS real-behavior-calibration:' + suiteId + '\n');
    }
    for (const suiteId of required) {
      probe('wrong-current-hash:' + suiteId, suiteId, 'Keep real current source but register an incorrect candidate SHA-256.', (c, item) => {
        c.manifest.candidate.sha256 = '0'.repeat(64);
        const runner = c.runner(), out = runner.run(suiteId);
        const message = 'integrity mismatch ' + c.manifest.candidate.path;
        item.expected = {code: 'PILOT_INFRASTRUCTURE', message, loadCount: 0};
        item.observed = summarize(out);
        assertFailure(out, item.expected.code, message);
        assert.equal(out.evidence.loads.length, 0);
      });
      probe('candidate-old-source:' + suiteId, suiteId, 'Use the v286 source and its correct hash as candidate; keep all current change-fence changes.', (c, item) => {
        c.manifest.candidate = {...c.manifest.references[c.manifest.changeFence.previous]};
        const out = c.runner().run(suiteId);
        item.expected = {code: 'PILOT_INFRASTRUCTURE', message: 'current change fence mismatch', loadCount: 0};
        item.observed = summarize(out);
        assertFailure(out, item.expected.code, item.expected.message);
        assert.equal(out.evidence.loads.length, 0);
      });
      for (const [id, sequence] of [['candidate-reference-swapped', ['reference', 'candidate']], ['reference-only-pair', ['reference', 'reference']]]) {
        probe(id + ':' + suiteId, suiteId, 'Re-register a suite that loads roles in order: ' + sequence.join(', ') + '.', (c, item) => {
          registerSuite(c, suiteId, stubSuite(c, suiteId, {sequence}));
          const out = c.runner().run(suiteId);
          item.expected = {code: 'PILOT_INFRASTRUCTURE', message: 'VM role order mismatch', loadCount: 0};
          item.observed = summarize(out);
          assertFailure(out, item.expected.code, item.expected.message);
          assert.equal(out.evidence.suiteHash, c.manifest.suites[suiteId].sha256, 're-registered module passed its own hash gate');
          assert.equal(out.evidence.loads.length, 0);
        });
      }
      probe('empty-loadtrace-context:' + suiteId, suiteId, 'Re-register a suite that reports every required scenario and exact aggregate counts without loading a VM.', (c, item) => {
        registerSuite(c, suiteId, stubSuite(c, suiteId));
        const out = c.runner().run(suiteId);
        item.expected = {code: 'PILOT_INFRASTRUCTURE', message: 'missing candidate compiled load ' + c.manifest.suites[suiteId].scenarios[0], loadCount: 0};
        item.observed = summarize(out);
        assertFailure(out, item.expected.code, item.expected.message);
        assert.deepEqual(out.evidence.started, c.manifest.suites[suiteId].scenarios);
        assert.equal(out.evidence.loads.length, 0);
      });
      probe('empty-loadtrace-runner:' + suiteId, suiteId, 'After valid loads satisfy context finish checks, clear the recorded trace before successful exit; re-register modified context.', (c, item) => {
        patchIntegrityModule(c, 'suite-context.cjs', 'evidence.completed=true;', 'evidence.loads=[];evidence.completed=true;');
        registerSuite(c, suiteId, stubSuite(c, suiteId, {sequence: ['candidate', 'reference']}));
        const runner = c.runner(), out = runner.run(suiteId);
        item.expected = {childStatus: 0, completed: true, loadCount: 0, runnerCode: 'ERR_ASSERTION', runnerMessage: 'runner exactly one role load per scenario'};
        item.observed = summarize(out);
        assert.ifError(out.child.error);
        assert.equal(out.child.status, 0);
        assert.equal(out.evidence.completed, true);
        assert.equal(out.evidence.loads.length, 0);
        const failure = capturePositiveFailure(runner, suiteId);
        item.observed.runnerFailure = failure;
        assert.equal(failure.code, item.expected.runnerCode);
        assert.equal(failure.message, item.expected.runnerMessage);
      });
      probe('syntax-only-mutant:' + suiteId, suiteId, 'Register an invalid-JavaScript mutant whose intended behavioral assertion/scenario equal a real mutation.', (c, item) => {
        const real = mutationFor(suiteId);
        const mutation = {...real, id: suiteId + ':probe-syntax-only', name: 'syntax-only probe', anchor: '<script>', replacement: '<script>\nconst = ;\n', expectedOccurrences: 1};
        registerMutation(c, mutation);
        const runner = c.runner(), out = runner.run(suiteId, mutation.id);
        const classification = runner.classifyNegative(out, mutation);
        item.expected = {name: 'SyntaxError', code: null, message: "Unexpected token '='", classification: 'INVALID_INFRASTRUCTURE', loadCount: 0};
        item.observed = summarize(out, classification);
        assertFailure(out, null, item.expected.message, 'SyntaxError');
        assert.equal(out.evidence.mutation.id, mutation.id);
        assert.equal(out.evidence.loads.length, 0, 'uncompiled syntax errors have no compiled receipts');
        assert.equal(classification, item.expected.classification);
      });
      probe('hashgate-failure-not-kill:' + suiteId, suiteId, 'Request a real mutation but fail candidate integrity before mutation registration or VM compilation.', (c, item) => {
        c.manifest.candidate.sha256 = '0'.repeat(64);
        const runner = c.runner(), mutation = mutationFor(suiteId), out = runner.run(suiteId, mutation.id);
        const classification = runner.classifyNegative(out, mutation);
        item.expected = {code: 'PILOT_INFRASTRUCTURE', message: 'integrity mismatch ' + c.manifest.candidate.path, classification: 'INVALID_INFRASTRUCTURE', loadCount: 0};
        item.observed = summarize(out, classification);
        assertFailure(out, item.expected.code, item.expected.message);
        assert.equal(out.evidence.mutation, undefined, 'hash gate fires before mutant registration');
        assert.equal(out.evidence.loads.length, 0);
        assert.equal(classification, item.expected.classification);
      });
      probe('wrong-assertion-not-kill:' + suiteId, suiteId, 'Load an actual registered mutant and the verified reference, then throw an unrelated assertion from a re-registered suite.', (c, item) => {
        const wrongMessage = 'probe unrelated assertion must not kill';
        registerSuite(c, suiteId, stubSuite(c, suiteId, {sequence: ['candidate', 'reference'], oneScenario: true, failMessage: wrongMessage}));
        const runner = c.runner(), mutation = mutationFor(suiteId), out = runner.run(suiteId, mutation.id);
        const classification = runner.classifyNegative(out, mutation);
        item.expected = {code: 'ERR_ASSERTION', message: wrongMessage, classification: 'INVALID_ASSERTION', loadCount: 2};
        item.observed = summarize(out, classification);
        assertFailure(out, item.expected.code, wrongMessage, 'AssertionError');
        assert.equal(out.evidence.mutation.id, mutation.id);
        assert.equal(out.evidence.scenario, mutation.expectedScenario);
        assert.deepEqual(out.evidence.loads.map(load => load.role), ['candidate', 'reference']);
        assert.ok(out.evidence.loads.every(load => load.compiled));
        assert.equal(classification, item.expected.classification);
      });
      probe('reference-blob-corrupt:' + suiteId, suiteId, 'Corrupt only this clone\'s suite reference blob without changing its registered hash.', (c, item) => {
        const entry = c.manifest.references[c.manifest.suites[suiteId].reference];
        fs.appendFileSync(path.join(c.directory, entry.path), '\n<!-- deliberate probe corruption -->\n');
        const out = c.runner().run(suiteId);
        item.expected = {code: 'PILOT_INFRASTRUCTURE', message: 'integrity mismatch ' + entry.path, loadCount: 0};
        item.observed = summarize(out);
        assertFailure(out, item.expected.code, item.expected.message);
        assert.equal(out.evidence.loads.length, 0);
      });
    }
    const tamperCases = [
      {
        id: 'forged-reference-identity', expected: 'INVALID_REFERENCE',
        attack: 'Make reference expected/source hashes agree with each other but disagree with the manifest-verified reference.',
        edit(out) {
          out.evidence.expected.reference = 'a'.repeat(64);
          out.evidence.loads.find(load => load.role === 'reference').sourceHash = 'a'.repeat(64);
        },
      },
      {
        id: 'forged-reference-script', expected: 'INVALID_REFERENCE',
        attack: 'Retain the correct reference raw hash but forge its compiled script hash.',
        edit(out) { out.evidence.loads.find(load => load.role === 'reference').scriptHash = 'b'.repeat(64); },
      },
      {
        id: 'wrong-evidence-suite', expected: 'INVALID_REGISTRATION',
        attack: 'Attribute an otherwise real failing outcome to the wrong suite in its evidence envelope.',
        edit(out) { out.evidence.suiteId = 'probe-unregistered-suite'; },
      },
      {
        id: 'wrong-receipt-suite', expected: 'INVALID_VM_PROVENANCE',
        attack: 'Change a compiled candidate receipt to name the other suite.',
        edit(out, suiteId) { out.evidence.loads.find(load => load.role === 'candidate').suiteId = required.find(id => id !== suiteId); },
      },
      {
        id: 'reversed-role-trace', expected: 'INVALID_VM_PROVENANCE',
        attack: 'Reverse actual candidate/reference receipt order while keeping both raw/script identities intact.',
        edit(out) { out.evidence.loads.reverse(); },
      },
      {
        id: 'forged-descriptor-hash', expected: 'INVALID_REGISTRATION',
        attack: 'Preserve the real mutation ID and VM receipts but forge its registered descriptor hash.',
        edit(out) { out.evidence.mutation.descriptorHash = 'c'.repeat(64); },
      },
      {
        id: 'forged-candidate-script', expected: 'INVALID_VM_PROVENANCE',
        attack: 'Preserve the exact mutated HTML hash but forge its compiled JavaScript hash.',
        edit(out) { out.evidence.loads.find(load => load.role === 'candidate').scriptHash = 'd'.repeat(64); },
      },
      {
        id: 'duplicate-reference-receipt', expected: 'INVALID_VM_PROVENANCE',
        attack: 'Duplicate the real reference receipt to defeat an existence-only load check.',
        edit(out) { out.evidence.loads.push(structuredClone(out.evidence.loads.find(load => load.role === 'reference'))); },
      },
    ];
    for (const suiteId of required) {
      for (const tamper of tamperCases) {
        probe(tamper.id + ':' + suiteId, suiteId, tamper.attack, (c, item) => {
          const original = calibratedOutcomes.get(suiteId);
          const out = {child: {...original.child}, evidence: structuredClone(original.evidence)};
          const mutation = mutationFor(suiteId);
          const runner = c.runner();
          assert.equal(runner.classifyNegative(original, mutation), 'DETECTED_BEHAVIOR', 'untampered calibration remains valid');
          tamper.edit(out, suiteId);
          const classification = runner.classifyNegative(out, mutation);
          item.expected = {classification: tamper.expected, calibration: mutation.id};
          item.observed = summarize(out, classification);
          assert.equal(classification, tamper.expected);
        });
      }
    }
    for (const missingSuite of required) {
      probe('missing-required-suite:' + missingSuite, missingSuite, 'Delete one required registry entry and invoke the real main runner; require rejection before suite execution.', (c, item) => {
        delete c.manifest.suites[missingSuite];
        c.save();
        const monitorFile = path.join(c.directory, 'probe-error-monitor.cjs');
        const marker = '__RUNNER_PROBE_FAILURE__';
        fs.writeFileSync(monitorFile, `process.on('uncaughtExceptionMonitor',e=>process.stderr.write(${JSON.stringify(marker)}+JSON.stringify({name:e.name,code:e.code||null,message:e.message.split('\\n')[0]})+'\\n'));\n`);
        const child = cp.spawnSync(process.execPath, ['--require', monitorFile, path.join(c.directory, 'run-current-suites.cjs')], {encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024, env: {...process.env, RED_PILOT_MUTATION: '', RED_PILOT_EVIDENCE: path.join(c.directory, 'must-not-exist.json')}});
        const line = child.stderr.split('\n').find(value => value.startsWith(marker));
        const failure = line ? JSON.parse(line.slice(marker.length)) : null;
        item.expected = {code: 'ERR_ASSERTION', message: 'complete required suite registry', stdout: '', noSuiteEvidence: true};
        item.observed = {exitStatus: child.status, signal: child.signal, failure, stdout: child.stdout, noSuiteEvidence: !fs.existsSync(path.join(c.directory, 'must-not-exist.json'))};
        assert.ifError(child.error);
        assert.equal(child.signal, null);
        assert.equal(child.status, 1);
        assert.equal(failure?.name, 'AssertionError');
        assert.equal(failure?.code, item.expected.code);
        assert.equal(failure?.message, item.expected.message);
        assert.equal(child.stdout, '');
        assert.equal(item.observed.noSuiteEvidence, true);
      });
    }
  } catch (error) {
    report.failures.push('setup-or-calibration');
    report.fatalError = {name: error.name, code: error.code || null, message: error.message, stack: error.stack};
    process.stderr.write(error.stack + '\n');
  } finally {
    report.originalFilesUnchanged = [];
    for (const [file, before] of originalHashes) {
      const actual = hash(fs.readFileSync(file));
      const unchanged = actual === before;
      report.originalFilesUnchanged.push({path: file, sha256: actual, unchanged});
      if (!unchanged) report.failures.push('original-file-changed:' + file);
    }
    report.summary = {normalPassed: report.normal.length, behaviorCalibrationsPassed: report.calibration.length, probesPassed: report.probes.filter(probe => probe.passed).length, probesTotal: report.probes.length, originalFilesVerifiedUnchanged: report.originalFilesUnchanged.filter(file => file.unchanged).length, failures: report.failures.length};
    report.completedAt = new Date().toISOString();
    fs.rmSync(workspace, {recursive: true, force: true});
    report.temporaryClonesRemoved = !fs.existsSync(workspace);
    writeJSON(reportFile, report);
    process.stdout.write(JSON.stringify(report.summary, null, 2) + '\n');
    if (report.failures.length) process.exitCode = 1;
  }
}
if (require.main === module) main();
