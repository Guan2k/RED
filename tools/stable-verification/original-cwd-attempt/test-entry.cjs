'use strict';
// Independent wrapper acceptance tests. Synthetic fixtures are not game coverage.
// This script never starts the genuine package's default runner.
// Usage: node tools/stable-verification/test-entry.cjs [--synthetic-only] [--output FILE]
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const vm = require('node:vm');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const packageRoot = path.resolve(__dirname, '../..');
const entryPath = path.join(packageRoot, 'verify-current.cjs');
const entrySource = fs.readFileSync(entryPath, 'utf8');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const defaultBlock = '<!-- current-verification-default -->\n```sh\nnode verify-current.cjs\n```\n<!-- /current-verification-default -->';
const integrityMessage = 'Package integrity passed; game verification was not executed. Offline consistency does not establish authenticity or remote latest version.';
const requiredNames = ['index.html', 'verification/run-tests-v289.cjs', 'verify-current.cjs', 'current-verification.json', 'README.md'];
const cases = [];
let syntheticOnly = false;
let outputPath;
const seenArgs = new Set();
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  assert(!seenArgs.has(arg), 'Repeated test-harness option: ' + arg);
  seenArgs.add(arg);
  if (arg === '--synthetic-only') syntheticOnly = true;
  else if (arg === '--output') {
    assert(i + 1 < process.argv.length && !process.argv[i + 1].startsWith('--'), '--output requires a filename');
    outputPath = path.resolve(process.argv[++i]);
  } else throw new Error('Unknown test-harness option: ' + arg);
}
// Reports belong outside the package, so subsequent acceptance runs do not mutate
// a SHA-listed file or create a report/checksum self-dependency.
if (outputPath) {
  const rel = path.relative(packageRoot, outputPath);
  assert(rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel), '--output must be outside the package');
}
const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'red-stable-entry-synthetic-'));
const unrelatedCwd = path.join(scratchRoot, 'outside-package-cwd');
fs.mkdirSync(unrelatedCwd);
function test(name, provenance, expected, fn) {
  const start = Date.now();
  try {
    const evidence = fn();
    cases.push({ name, provenance, expected, status: 'passed', durationMs: Date.now() - start, ...(evidence ? { evidence } : {}) });
  } catch (error) {
    cases.push({ name, provenance, expected, status: 'failed', durationMs: Date.now() - start, error: error.stack || String(error) });
  }
}
let fixtureNumber = 0;
function fixture(runnerBody = "// SYNTHETIC acceptance fixture, not the RED game runner.\nprocess.exitCode = 0;\n") {
  const root = path.join(scratchRoot, 'synthetic-' + (++fixtureNumber));
  fs.mkdirSync(path.join(root, 'verification'), { recursive: true });
  const source = '<!doctype html>\n<!-- SYNTHETIC fixture; not RED game source. -->\n<small>赤色前线 / ORIGINAL RTS / v0.289</small>\n';
  fs.writeFileSync(path.join(root, 'index.html'), source);
  fs.writeFileSync(path.join(root, 'verification/run-tests-v289.cjs'), runnerBody);
  fs.writeFileSync(path.join(root, 'verify-current.cjs'), entrySource);
  fs.writeFileSync(path.join(root, 'README.md'), '# SYNTHETIC wrapper fixture\n' + defaultBlock + '\n');
  const manifest = {
    schemaVersion: 1, version: '289', source: 'index.html', sourceSha256: hash(source),
    runner: 'verification/run-tests-v289.cjs', runnerSha256: hash(runnerBody)
  };
  const f = { root, manifest, names: [...requiredNames] };
  writeManifest(f);
  writeSums(f);
  return f;
}
function file(f, name) { return path.join(f.root, name); }
function writeManifest(f, raw) {
  fs.writeFileSync(file(f, 'current-verification.json'), raw === undefined ? JSON.stringify(f.manifest, null, 2) + '\n' : raw);
}
function sumLine(f, name) { return hash(fs.readFileSync(file(f, name))) + '  ' + name; }
function writeSums(f, names = f.names) {
  fs.writeFileSync(file(f, 'SHA256SUMS.txt'), names.map(name => sumLine(f, name)).join('\n') + '\n');
}
function changeManifest(f, fn) { fn(f.manifest); writeManifest(f); writeSums(f); }
function declaration(root) {
  const m = JSON.parse(fs.readFileSync(path.join(root, 'current-verification.json'), 'utf8'));
  const entries = fs.readFileSync(path.join(root, 'SHA256SUMS.txt'), 'utf8').trimEnd().split('\n').length;
  return `Package declares v0.${m.version}; source SHA-256 ${m.sourceSha256}; runner ${m.runner}; ${entries} listed files verified.`;
}
function runVM(root, args = ['--check-only'], options = {}) {
  const logs = [], errors = [], imports = [], spawns = [];
  const fakeProcess = { argv: [process.execPath, path.join(root, 'verify-current.cjs'), ...args], execPath: process.execPath, exitCode: undefined, cwd: () => unrelatedCwd };
  const allowed = { 'node:fs': options.fs || fs, 'node:path': path, 'node:crypto': crypto };
  const context = {
    __dirname: root, __filename: path.join(root, 'verify-current.cjs'), process: fakeProcess,
    console: { log: (...parts) => logs.push(parts.join(' ')), error: (...parts) => errors.push(parts.join(' ')) },
    require(name) {
      imports.push(name);
      if (Object.hasOwn(allowed, name)) return allowed[name];
      if (name === 'node:child_process' && options.allowSpawn) return {
        spawnSync(...call) { spawns.push(call); return options.spawnResult === undefined ? { status: 0, signal: null } : options.spawnResult; }
      };
      throw new Error('TEST HARNESS FORBIDS REQUIRE: ' + name);
    }
  };
  vm.runInNewContext(entrySource, context, { filename: 'verify-current.cjs', timeout: 120000 });
  return { status: fakeProcess.exitCode === undefined ? 0 : fakeProcess.exitCode, logs, errors, imports, spawns };
}
function noLaunch(result) {
  assert.equal(result.spawns.length, 0, 'Failure must occur before spawn');
  assert.deepEqual(result.imports, ['node:fs', 'node:path', 'node:crypto'], 'Only fs/path/crypto may be required');
}
function refused(result, message, logs = []) {
  assert.equal(result.status, 1);
  assert.deepEqual(result.errors, ['Current verification refused: ' + message]);
  assert.deepEqual(result.logs, logs);
  noLaunch(result);
}
function refusalCase(name, mutate, expected) {
  test(name, 'synthetic package; no game execution', 'exit 1; exact error: ' + expected + '; no spawn/import of runner', () => {
    const f = fixture(); mutate(f); const r = runVM(f.root, [], { allowSpawn: true }); refused(r, expected);
    return { exitStatus: r.status, error: r.errors[0], spawnCalls: r.spawns.length };
  });
}
function spawnCall(result, root) {
  assert.equal(result.spawns.length, 1);
  assert.deepEqual(result.imports, ['node:fs', 'node:path', 'node:crypto', 'node:child_process']);
  const [command, args, opts] = result.spawns[0];
  assert.equal(command, process.execPath);
  assert.deepEqual(Array.from(args), [path.join(root, 'verification/run-tests-v289.cjs')]);
  assert.deepEqual(JSON.parse(JSON.stringify(opts)), { cwd: root, shell: false, stdio: 'inherit' });
}
function child(root, args = ['--check-only']) {
  return cp.spawnSync(process.execPath, [path.join(root, 'verify-current.cjs'), ...args], {
    cwd: unrelatedCwd, shell: false, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
  });
}
function normalChild(result, status, stdout, stderr) {
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, status);
  assert.equal(result.stdout, stdout);
  assert.equal(result.stderr, stderr);
}
const beforeIdentity = {
  entrySha256: hash(fs.readFileSync(entryPath)),
  sourceSha256: hash(fs.readFileSync(path.join(packageRoot, 'index.html'))),
  runnerSha256: hash(fs.readFileSync(path.join(packageRoot, 'verification/run-tests-v289.cjs')))
};
try {
  if (!syntheticOnly) {
    test('genuine package: check-only in VM with fs/path/crypto-only require', 'genuine package; game execution prohibited', 'exit 0; exact identity and integrity messages; no child_process/game imports or spawn', () => {
      const result = runVM(packageRoot);
      assert.equal(result.status, 0);
      assert.deepEqual(result.errors, []);
      assert.deepEqual(result.logs, [declaration(packageRoot), integrityMessage]);
      noLaunch(result);
      return { exitStatus: result.status, requiredModules: result.imports, spawnCalls: result.spawns.length, messages: result.logs };
    });
    test('genuine package: external cwd check-only subprocess', 'genuine package; only --check-only executed', 'exit 0 from unrelated cwd; exact identity and integrity messages', () => {
      const result = child(packageRoot);
      normalChild(result, 0, declaration(packageRoot) + '\n' + integrityMessage + '\n', '');
      return { exitStatus: result.status, requestedArguments: ['--check-only'], cwd: 'unrelated temporary directory', messages: result.stdout.trimEnd().split('\n') };
    });
  }
  test('synthetic baseline: check-only forbids child_process and game require', 'synthetic package; no game execution', 'exit 0; exact success output; only fs/path/crypto imports', () => {
    const f = fixture(); const r = runVM(f.root);
    assert.equal(r.status, 0); assert.deepEqual(r.errors, []); assert.deepEqual(r.logs, [declaration(f.root), integrityMessage]); noLaunch(r);
    return { exitStatus: r.status, requiredModules: r.imports, spawnCalls: r.spawns.length };
  });
  // Schema rejection is checked with a consistent ledger, so a preceding hash
  // failure cannot mask the specific manifest validation under test.
  for (const key of ['schemaVersion', 'version', 'source', 'sourceSha256', 'runner', 'runnerSha256'])
    refusalCase('manifest missing field: ' + key, f => changeManifest(f, m => { delete m[key]; }), 'manifest missing/unknown fields');
  refusalCase('manifest unknown field', f => changeManifest(f, m => { m.command = 'run-me'; }), 'manifest missing/unknown fields');
  for (const raw of ['null', '[]', '"string"', '42', 'false'])
    refusalCase('manifest nonobject: ' + raw, f => { writeManifest(f, raw + '\n'); writeSums(f); }, 'manifest must be an object');
  for (const [label, key, value] of [
    ['schema string', 'schemaVersion', '1'], ['schema zero', 'schemaVersion', 0], ['schema boolean', 'schemaVersion', true], ['schema null', 'schemaVersion', null],
    ['version numeric', 'version', 289], ['version null', 'version', null], ['version zero', 'version', '0'], ['version leading zero', 'version', '0289'],
    ['version negative', 'version', '-289'], ['version decimal', 'version', '0.289'], ['version prefixed', 'version', 'v289'], ['version whitespace', 'version', '289 '],
    ['version path', 'version', '../289'], ['version newline', 'version', '289\n']
  ]) refusalCase('manifest invalid ' + label, f => changeManifest(f, m => { m[key] = value; }), 'invalid declared version/schema');
  refusalCase('manifest duplicate JSON key', f => { writeManifest(f, JSON.stringify(f.manifest).replace('{', '{"version":"288",')); writeSums(f); }, 'manifest duplicate or nested keys');
  refusalCase('manifest duplicate escaped JSON key', f => { writeManifest(f, JSON.stringify(f.manifest).replace('{', '{"\\u0076ersion":"288",')); writeSums(f); }, 'manifest duplicate or nested keys');
  refusalCase('manifest nested JSON key', f => changeManifest(f, m => { m.sourceSha256 = { nested: 'x' }; }), 'manifest duplicate or nested keys');
  for (const value of ['game.html', '../index.html', '/index.html', 'INDEX.HTML', null, 12])
    refusalCase('manifest nonfixed source: ' + JSON.stringify(value), f => changeManifest(f, m => { m.source = value; }), 'source must be index.html');
  for (const value of ['verification/run-tests-v288.cjs', '../run-tests-v289.cjs', '/run-tests-v289.cjs', 'verification\\run-tests-v289.cjs', 'verification/run-tests-v289.cjs --long', null])
    refusalCase('manifest nonexact runner: ' + JSON.stringify(value), f => changeManifest(f, m => { m.runner = value; }), 'runner does not match declared version');
  for (const key of ['sourceSha256', 'runnerSha256']) {
    for (const [label, value] of [['uppercase', 'A'.repeat(64)], ['short', 'a'.repeat(63)], ['long', 'a'.repeat(65)], ['nonhex', 'g'.repeat(64)], ['number', 123], ['null', null]])
      refusalCase('manifest invalid ' + key + ': ' + label, f => changeManifest(f, m => { m[key] = value; }), 'invalid source/runner SHA');
    refusalCase('manifest ledger disagreement: ' + key, f => changeManifest(f, m => { m[key] = '0'.repeat(64); }), 'manifest/source/runner checksum disagreement');
  }
  for (const name of requiredNames)
    refusalCase('required ledger entry missing: ' + name, f => writeSums(f, f.names.filter(n => n !== name)), 'required checksum entry missing: ' + name);
  for (const name of ['SHA256SUMS.txt', 'current-verification.json', 'index.html', 'verification/run-tests-v289.cjs', 'README.md'])
    refusalCase('package file missing: ' + name, f => fs.unlinkSync(file(f, name)), 'missing or differently cased file: ' + name);
  for (const name of ['index.html', 'verification/run-tests-v289.cjs', 'verify-current.cjs', 'README.md'])
    refusalCase('listed bytes tampered: ' + name, f => fs.appendFileSync(file(f, name), '\n// changed bytes\n'), 'checksum mismatch: ' + name);
  refusalCase('manifest bytes tampered but still valid JSON', f => fs.appendFileSync(file(f, 'current-verification.json'), ' '), 'checksum mismatch: current-verification.json');
  refusalCase('source wrong version with internally matching SHA', f => {
    const bytes = fs.readFileSync(file(f, 'index.html'), 'utf8').replace('v0.289', 'v0.288');
    fs.writeFileSync(file(f, 'index.html'), bytes); f.manifest.sourceSha256 = hash(bytes); writeManifest(f); writeSums(f);
  }, 'source display version disagrees with manifest');
  refusalCase('source missing display version with matching SHA', f => {
    const bytes = '<!-- SYNTHETIC source without display version -->\n'; fs.writeFileSync(file(f, 'index.html'), bytes); f.manifest.sourceSha256 = hash(bytes); writeManifest(f); writeSums(f);
  }, 'source display version disagrees with manifest');
  refusalCase('source duplicate display version with matching SHA', f => {
    const bytes = fs.readFileSync(file(f, 'index.html'), 'utf8') + '<small>赤色前线 / ORIGINAL RTS / v0.289</small>\n';
    fs.writeFileSync(file(f, 'index.html'), bytes); f.manifest.sourceSha256 = hash(bytes); writeManifest(f); writeSums(f);
  }, 'source display version disagrees with manifest');
  refusalCase('mixed old declared runner and new displayed source with matching SHA', f => {
    fs.renameSync(file(f, 'verification/run-tests-v289.cjs'), file(f, 'verification/run-tests-v288.cjs'));
    f.manifest.version = '288'; f.manifest.runner = 'verification/run-tests-v288.cjs'; f.names[1] = f.manifest.runner; writeManifest(f); writeSums(f);
  }, 'source display version disagrees with manifest');
  for (const [label, mutate, error] of [
    ['no final newline', s => s.slice(0, -1), 'checksum manifest must use LF and final newline'],
    ['CRLF', s => s.replace(/\n/g, '\r\n'), 'checksum manifest must use LF and final newline'],
    ['empty', () => '', 'checksum manifest must use LF and final newline'],
    ['blank line', s => s + '\n', 'invalid checksum line'],
    ['uppercase SHA', s => 'A' + s.slice(1), 'invalid checksum line'],
    ['nonhex SHA', s => 'g' + s.slice(1), 'invalid checksum line'],
    ['short SHA', s => s.slice(1), 'invalid checksum line'],
    ['long SHA', s => 'a' + s, 'invalid checksum line'],
    ['single separator space', s => s.replace('  ', ' '), 'invalid checksum line'],
    ['tab separator', s => s.replace('  ', '\t'), 'invalid checksum line'],
    ['self entry', s => s + '0'.repeat(64) + '  SHA256SUMS.txt\n', 'checksum manifest must exclude itself'],
    ['exact duplicate', s => s + s.split('\n')[0] + '\n', 'duplicate or case-colliding checksum path: index.html'],
    ['case collision', s => s + '0'.repeat(64) + '  INDEX.HTML\n', 'case-colliding path component: INDEX.HTML'],
    ['directory component case collision', s => s + '0'.repeat(64) + '  Foo/a.txt\n' + '0'.repeat(64) + '  foo/b.txt\n', 'case-colliding path component: foo/b.txt'],
    ['nested directory component case collision', s => s + '0'.repeat(64) + '  extras/Foo/a.txt\n' + '0'.repeat(64) + '  extras/foo/b.txt\n', 'case-colliding path component: extras/foo/b.txt'],
    ['existing runner directory component case collision', s => s + '0'.repeat(64) + '  Verification/other.cjs\n', 'case-colliding path component: Verification/other.cjs']
  ]) refusalCase('checksum manifest ' + label, f => fs.writeFileSync(file(f, 'SHA256SUMS.txt'), mutate(fs.readFileSync(file(f, 'SHA256SUMS.txt'), 'utf8'))), error);
  for (const [name, error] of [
    ['../escape.txt', 'noncanonical package path: ../escape.txt'], ['./index.html', 'noncanonical package path: ./index.html'],
    ['/absolute.txt', 'invalid package path: /absolute.txt'], ['C:/absolute.txt', (path.isAbsolute('C:/absolute.txt') ? 'invalid' : 'noncanonical') + ' package path: C:/absolute.txt'],
    ['verification\\runner.cjs', 'invalid package path: verification\\runner.cjs'], ['verification//runner.cjs', 'noncanonical package path: verification//runner.cjs'],
    ['verification/../runner.cjs', 'noncanonical package path: verification/../runner.cjs'], ['verification/./runner.cjs', 'noncanonical package path: verification/./runner.cjs'],
    ['trailing/', 'noncanonical package path: trailing/'], ['name with spaces', 'noncanonical package path: name with spaces'],
    ['trailing.', 'noncanonical package path: trailing.'], ['tab\tname', 'noncanonical package path: tab\tname'],
    ['control\u0001name', 'noncanonical package path: control\u0001name'], ['nul.txt', 'noncanonical package path: nul.txt'],
    ['COM1', 'noncanonical package path: COM1'], ['.git/config', 'workspace metadata is not a package file: .git/config'],
    ['.HG/config', 'workspace metadata is not a package file: .HG/config'], ['.svn/entries', 'workspace metadata is not a package file: .svn/entries']
  ]) refusalCase('unsafe checksum path: ' + JSON.stringify(name), f => fs.appendFileSync(file(f, 'SHA256SUMS.txt'), '0'.repeat(64) + '  ' + name + '\n'), error);
  refusalCase('checksum listed extra file missing', f => fs.appendFileSync(file(f, 'SHA256SUMS.txt'), '0'.repeat(64) + '  missing.txt\n'), 'missing or differently cased file: missing.txt');
  refusalCase('checksum listed extra file tampered', f => {
    fs.writeFileSync(file(f, 'extra.txt'), 'before'); f.names.push('extra.txt'); writeSums(f); fs.writeFileSync(file(f, 'extra.txt'), 'after');
  }, 'checksum mismatch: extra.txt');
  refusalCase('differently cased source filename', f => fs.renameSync(file(f, 'index.html'), file(f, 'INDEX.HTML')), 'missing or differently cased file: index.html');
  refusalCase('differently cased runner directory', f => fs.renameSync(file(f, 'verification'), file(f, 'Verification')), 'missing or differently cased file: verification/run-tests-v289.cjs');
  refusalCase('directory substituted for regular source file', f => { fs.unlinkSync(file(f, 'index.html')); fs.mkdirSync(file(f, 'index.html')); }, 'not a regular package file: index.html');
  refusalCase('ordinary file substituted for runner directory', f => { fs.rmSync(file(f, 'verification'), { recursive: true }); fs.writeFileSync(file(f, 'verification'), 'not a directory'); }, 'not a regular package file: verification/run-tests-v289.cjs');
  for (const name of ['index.html', 'verification/run-tests-v289.cjs', 'current-verification.json', 'SHA256SUMS.txt'])
    refusalCase('outside-package file symlink: ' + name, f => {
      const target = path.join(scratchRoot, 'outside-' + fixtureNumber + '.txt'); fs.renameSync(file(f, name), target); fs.symlinkSync(target, file(f, name));
    }, 'symlink refused: ' + name);
  refusalCase('outside-package directory symlink', f => {
    const target = path.join(scratchRoot, 'outside-dir-' + fixtureNumber); fs.renameSync(file(f, 'verification'), target); fs.symlinkSync(target, file(f, 'verification'), 'dir');
  }, 'symlink refused: verification/run-tests-v289.cjs');
  refusalCase('inside-package source symlink also refused', f => {
    fs.renameSync(file(f, 'index.html'), file(f, 'source-copy.html')); fs.symlinkSync('source-copy.html', file(f, 'index.html'));
  }, 'symlink refused: index.html');
  for (const [label, transform] of [
    ['missing block', () => '# synthetic README without default block\n'],
    ['versioned default command', s => s.replace('node verify-current.cjs', 'node verification/run-tests-v289.cjs')],
    ['duplicate block', s => s + defaultBlock + '\n'],
    ['duplicate opening marker', s => s + '<!-- current-verification-default -->\n'],
    ['duplicate closing marker', s => s + '<!-- /current-verification-default -->\n']
  ]) refusalCase('README ' + label, f => { fs.writeFileSync(file(f, 'README.md'), transform(fs.readFileSync(file(f, 'README.md'), 'utf8'))); writeSums(f); }, 'README stable default block mismatch');
  test('historical runner text outside README default block remains allowed', 'synthetic package; no game execution', 'exit 0; historical text does not change default selection', () => {
    const f = fixture(); fs.appendFileSync(file(f, 'README.md'), '\nHistorical reference: node verification/run-tests-v288.cjs\n'); writeSums(f);
    const r = runVM(f.root); assert.equal(r.status, 0); assert.deepEqual(r.errors, []); assert.deepEqual(r.logs, [declaration(f.root), integrityMessage]); noLaunch(r);
  });
  for (const args of [['--unknown'], ['--legacy'], ['--long'], ['--check-only', '--check-only'], ['--check-only', '--long'], ['--'], ['--check-only=true'], ['verification/run-tests-v288.cjs']])
    test('argument rejection: ' + JSON.stringify(args), 'synthetic package; no game execution', 'exit 1; exact supported-arguments error; before reading package or spawning', () => {
      const f = fixture(); fs.unlinkSync(file(f, 'SHA256SUMS.txt'));
      const r = runVM(f.root, args, { allowSpawn: true }); refused(r, 'supported arguments: no arguments or --check-only');
    });
  for (const [name, result, exitStatus, error] of [
    ['success zero', { status: 0, signal: null }, 0, null],
    ['exit seven', { status: 7, signal: null }, 7, null],
    ['SIGTERM', { status: null, signal: 'SIGTERM' }, 1, 'Runner terminated by signal: SIGTERM'],
    ['signal beats numeric zero', { status: 0, signal: 'SIGTERM' }, 1, 'Runner terminated by signal: SIGTERM'],
    ['spawn error', { status: null, signal: null, error: new Error('SYNTHETIC spawn failure ENOENT') }, 1, 'Runner spawn failed: SYNTHETIC spawn failure ENOENT'],
    ['spawn error beats numeric zero', { status: 0, error: new Error('SYNTHETIC spawn failure EACCES') }, 1, 'Runner spawn failed: SYNTHETIC spawn failure EACCES'],
    ['null status', { status: null, signal: null }, 1, 'Current verification refused: runner returned no exit status'],
    ['missing status', {}, 1, 'Current verification refused: runner returned no exit status'],
    ['negative status', { status: -1 }, 1, 'Current verification refused: runner returned no exit status'],
    ['string status', { status: '0' }, 1, 'Current verification refused: runner returned no exit status'],
    ['fractional status', { status: 0.5 }, 1, 'Current verification refused: runner returned no exit status']
  ]) test('synthetic spawn contract: ' + name, 'synthetic package; mocked spawnSync, no runner execution', 'one exact Node/absolute-runner/cwd/shell:false/stdio:inherit call; exit ' + exitStatus + (error ? '; exact error: ' + error : '; no error'), () => {
    const f = fixture(); const r = runVM(f.root, [], { allowSpawn: true, spawnResult: result });
    spawnCall(r, f.root); assert.equal(r.status, exitStatus); assert.deepEqual(r.logs, [declaration(f.root)]); assert.deepEqual(r.errors, error ? [error] : []);
    return { exitStatus: r.status, spawnCalls: r.spawns.length, runnerArguments: ['absolute path to verification/run-tests-v289.cjs'], shell: false, stdio: 'inherit', stderr: r.errors };
  });
  for (const [target, changeAtRead] of [['index.html', 3], ['verification/run-tests-v289.cjs', 2]])
    test('prelaunch re-read catches changed ' + target, 'synthetic package; mocked read mutation, no runner execution', 'exit 1; exact source/runner changed-before-launch error; zero spawn', () => {
      const f = fixture(); let count = 0;
      const fakeFs = new Proxy(fs, { get(object, prop) {
        if (prop !== 'readFileSync') return object[prop];
        return (name, ...args) => {
          const bytes = fs.readFileSync(name, ...args);
          if (name === file(f, target) && ++count === changeAtRead) return Buffer.concat([Buffer.from(bytes), Buffer.from('\nSYNTHETIC concurrent change\n')]);
          return bytes;
        };
      } });
      const r = runVM(f.root, [], { allowSpawn: true, fs: fakeFs });
      refused(r, 'source/runner changed before launch', [declaration(f.root)]); assert.equal(count, changeAtRead);
    });
  test('actual external SYNTHETIC child exits seven', 'synthetic package; real child process, not game verification', 'entry exits exactly 7; runner output inherited; no false integrity/game success line', () => {
    const f = fixture("// SYNTHETIC stub only.\nconsole.log('SYNTHETIC child exit seven');\nprocess.exitCode = 7;\n");
    const r = child(f.root, []); normalChild(r, 7, declaration(f.root) + '\nSYNTHETIC child exit seven\n', '');
    return { exitStatus: r.status, realSyntheticChild: true };
  });
  test('actual external SYNTHETIC child receives SIGTERM', 'synthetic package; real child process, not game verification', 'entry exits exactly 1; exact SIGTERM error; no false success line', () => {
    const f = fixture("// SYNTHETIC stub only.\nprocess.kill(process.pid, 'SIGTERM');\n");
    const r = child(f.root, []); normalChild(r, 1, declaration(f.root) + '\n', 'Runner terminated by signal: SIGTERM\n');
    return { exitStatus: r.status, realSyntheticChild: true, childSignal: 'SIGTERM' };
  });
  test('genuine source, runner and entry bytes unchanged by acceptance tests', 'genuine package; read-only identity check', 'entry/source/runner SHA256 identical before and after', () => {
    assert.equal(hash(fs.readFileSync(entryPath)), beforeIdentity.entrySha256);
    assert.equal(hash(fs.readFileSync(path.join(packageRoot, 'index.html'))), beforeIdentity.sourceSha256);
    assert.equal(hash(fs.readFileSync(path.join(packageRoot, 'verification/run-tests-v289.cjs'))), beforeIdentity.runnerSha256);
    return beforeIdentity;
  });
} finally {
  fs.rmSync(scratchRoot, { recursive: true, force: true });
}
const report = {
  schemaVersion: 1,
  description: 'Independent stable entry acceptance. Synthetic fixtures exercise wrapper boundaries and do not constitute RED game coverage.',
  mode: syntheticOnly ? 'synthetic-only; genuine package check-only deferred' : 'genuine check-only plus synthetic boundary tests',
  generatedAt: new Date().toISOString(), nodeVersion: process.version, platform: process.platform,
  testedIdentity: beforeIdentity, testScriptSha256: hash(fs.readFileSync(__filename)),
  safety: { genuineDefaultRunnerExecuted: false, syntheticFixtureDirectoriesRemoved: true, reportOutsidePackage: true },
  total: cases.length, passed: cases.filter(c => c.status === 'passed').length, failed: cases.filter(c => c.status === 'failed').length,
  cases
};
const rendered = JSON.stringify(report, null, 2) + '\n';
if (outputPath) { fs.mkdirSync(path.dirname(outputPath), { recursive: true }); fs.writeFileSync(outputPath, rendered); }
process.stdout.write(rendered);
if (report.failed) process.exitCode = 1;
