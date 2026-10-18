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
const isolationMessage = 'Running the exact verified runner in a private temporary copy; the original package is read-only.';
const integrityMessage = 'Package integrity passed; game verification was not executed. Offline consistency does not establish authenticity or remote latest version.';
const requiredNames = ['index.html', 'verification/run-tests-v293.cjs', 'verify-current.cjs', 'current-verification.json', 'README.md'];
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
  const source = '<!doctype html>\n<!-- SYNTHETIC fixture; not RED game source. -->\n<small>赤色前线 / ORIGINAL RTS / v0.293</small>\n';
  fs.writeFileSync(path.join(root, 'index.html'), source);
  fs.writeFileSync(path.join(root, 'verification/run-tests-v293.cjs'), runnerBody);
  fs.writeFileSync(path.join(root, 'verify-current.cjs'), entrySource);
  fs.writeFileSync(path.join(root, 'README.md'), '# SYNTHETIC wrapper fixture\n' + defaultBlock + '\n');
  const manifest = {
    schemaVersion: 1, version: '293', source: 'index.html', sourceSha256: hash(source),
    runner: 'verification/run-tests-v293.cjs', runnerSha256: hash(runnerBody)
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
function treeSnapshot(root) {
  const records = [];
  function visit(directory, relative) {
    for (const name of fs.readdirSync(directory).sort()) {
      const full = path.join(directory, name), rel = relative ? relative + '/' + name : name;
      const st = fs.lstatSync(full);
      if (st.isDirectory()) visit(full, rel);
      else if (st.isSymbolicLink()) records.push({ name: rel, kind: 'symlink', target: fs.readlinkSync(full) });
      else records.push({ name: rel, kind: 'file', sha256: hash(fs.readFileSync(full)), dev: st.dev, ino: st.ino });
    }
  }
  visit(root, '');
  return records;
}
function contentSnapshot(root) {
  return treeSnapshot(root).map(({ dev, ino, ...record }) => record);
}
function runVM(root, args = ['--check-only'], options = {}) {
  const logs = [], errors = [], imports = [], spawns = [], tempRoots = [], operations = [], spawnSnapshots = [];
  const fakeProcess = { argv: [process.execPath, path.join(root, 'verify-current.cjs'), ...args], execPath: process.execPath, exitCode: undefined, cwd: () => unrelatedCwd };
  const baseFs = options.fs || fs;
  const tracked = new Set(['mkdtempSync', 'mkdirSync', 'writeFileSync', 'appendFileSync', 'copyFileSync', 'cpSync', 'linkSync', 'symlinkSync', 'renameSync', 'rmSync', 'rmdirSync', 'unlinkSync', 'chmodSync', 'openSync']);
  const observedFs = new Proxy(baseFs, { get(object, name) {
    if (!tracked.has(name)) return object[name];
    return (...call) => {
      operations.push({ operation: name, target: typeof call[0] === 'string' ? call[0] : null, flag: name === 'writeFileSync' && call[2] ? call[2].flag : undefined });
      if (args.length === 1 && args[0] === '--check-only') throw new Error('TEST HARNESS FORBIDS CHECK-ONLY FS MUTATION: ' + name);
      if (options.beforeOperation) options.beforeOperation(name, call, tempRoots);
      const result = object[name](...call);
      if (name === 'mkdtempSync') tempRoots.push(result);
      if (options.afterOperation) options.afterOperation(name, call, result, tempRoots);
      return result;
    };
  } });
  const allowed = { 'node:fs': observedFs, 'node:path': path, 'node:crypto': crypto };
  const context = {
    __dirname: root, __filename: path.join(root, 'verify-current.cjs'), process: fakeProcess,
    console: { log: (...parts) => logs.push(parts.join(' ')), error: (...parts) => errors.push(parts.join(' ')) },
    require(name) {
      imports.push(name);
      if (Object.hasOwn(allowed, name)) return allowed[name];
      if (name === 'node:os' && options.allowSpawn) return { ...os, tmpdir: () => scratchRoot };
      if (name === 'node:child_process' && options.allowSpawn) return {
        spawnSync(...call) {
          spawns.push(call);
          spawnSnapshots.push({ root: call[2].cwd, mode: fs.statSync(call[2].cwd).mode & 0o777, files: treeSnapshot(call[2].cwd) });
          if (options.onSpawn) options.onSpawn(call, tempRoots);
          return options.spawnResult === undefined ? { status: 0, signal: null } : options.spawnResult;
        }
      };
      throw new Error('TEST HARNESS FORBIDS REQUIRE: ' + name);
    }
  };
  vm.runInNewContext(entrySource, context, { filename: 'verify-current.cjs', timeout: 120000 });
  return { status: fakeProcess.exitCode === undefined ? 0 : fakeProcess.exitCode, logs, errors, imports, spawns, tempRoots, operations, spawnSnapshots };
}
function cleaned(result) {
  assert.equal(result.tempRoots.length, 1, 'Exactly one private staging directory must be created');
  for (const root of result.tempRoots) assert.equal(fs.existsSync(root), false, 'Staging directory must be removed: ' + root);
}
function noLaunch(result) {
  assert.equal(result.spawns.length, 0, 'Failure must occur before spawn');
  assert.equal(result.tempRoots.length, 0, 'Check-only/preflight refusal must not create temporary directories');
  assert.equal(result.operations.length, 0, 'Check-only/preflight refusal must not mutate the filesystem');
  assert.deepEqual(result.imports, ['node:fs', 'node:path', 'node:crypto'], 'Only fs/path/crypto may be required');
}
function refused(result, message, logs = []) {
  assert.equal(result.status, 1);
  assert.deepEqual(result.errors, ['Current verification refused: ' + message]);
  assert.deepEqual(result.logs, logs);
  noLaunch(result);
}
function stagedRefusal(result, message, logs) {
  assert.equal(result.status, 1);
  assert.deepEqual(result.errors, ['Current verification refused: ' + message]);
  assert.deepEqual(result.logs, logs);
  assert.equal(result.spawns.length, 0);
  assert.deepEqual(result.imports, ['node:fs', 'node:path', 'node:crypto', 'node:os']);
  cleaned(result);
}
function refusalCase(name, mutate, expected) {
  test(name, 'synthetic package; no game execution', 'exit 1; exact error: ' + expected + '; no spawn/import of runner', () => {
    const f = fixture(); mutate(f); const r = runVM(f.root, [], { allowSpawn: true }); refused(r, expected);
    return { exitStatus: r.status, error: r.errors[0], spawnCalls: r.spawns.length };
  });
}
function spawnCall(result, root) {
  assert.equal(result.spawns.length, 1);
  assert.deepEqual(result.imports, ['node:fs', 'node:path', 'node:crypto', 'node:os', 'node:child_process']);
  const [command, args, opts] = result.spawns[0];
  assert.equal(command, process.execPath);
  assert.equal(result.tempRoots.length, 1);
  const stagedRoot = result.tempRoots[0];
  assert.notEqual(stagedRoot, root, 'Runner must execute outside the original package');
  assert.equal(path.dirname(stagedRoot), scratchRoot, 'Staging must use the declared temporary location');
  assert.deepEqual(Array.from(args), [path.join(stagedRoot, 'verification/run-tests-v293.cjs')]);
  assert.deepEqual(JSON.parse(JSON.stringify(opts)), { cwd: stagedRoot, shell: false, stdio: 'inherit' });
  const snapshot = result.spawnSnapshots[0];
  if (process.platform !== 'win32') assert.equal(snapshot.mode & 0o077, 0, 'Staging directory must be private');
  const names = fs.readFileSync(path.join(root, 'SHA256SUMS.txt'), 'utf8').trimEnd().split('\n').map(line => line.slice(66));
  names.push('SHA256SUMS.txt'); names.sort();
  assert.deepEqual(snapshot.files.map(record => record.name).sort(), names, 'Copy only SHA-listed files and exact SHA manifest');
  for (const record of snapshot.files) {
    assert.equal(record.kind, 'file');
    assert.equal(record.sha256, hash(fs.readFileSync(path.join(root, record.name))), 'Staged bytes differ: ' + record.name);
    const original = fs.statSync(path.join(root, record.name));
    assert(!(original.ino === record.ino && original.dev === record.dev), 'Staged file must not be a hard link: ' + record.name);
  }
  const writes = result.operations.filter(operation => operation.operation === 'writeFileSync');
  assert.equal(writes.length, names.length, 'Every copied file is written exactly once');
  for (const write of writes) assert.equal(write.flag, 'wx', 'Copied files must be newly created, never replaced');
  for (const operation of result.operations) {
    assert(!(operation.target === root || operation.target.startsWith(root + path.sep)), 'Original package must not be written by wrapper');
    assert.notEqual(operation.operation, 'linkSync', 'Hard links are prohibited');
    assert.notEqual(operation.operation, 'symlinkSync', 'Symbolic links are prohibited');
  }
  cleaned(result);
}
function child(root, args = ['--check-only']) {
  const beforeTemporaryDirectories = fs.readdirSync(scratchRoot).filter(name => name.startsWith('red-current-verification-')).sort();
  const result = cp.spawnSync(process.execPath, [path.join(root, 'verify-current.cjs'), ...args], {
    cwd: unrelatedCwd, shell: false, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, NODE_OPTIONS: '', NODE_PATH: '', TMPDIR: scratchRoot, TEMP: scratchRoot, TMP: scratchRoot }
  });
  result.beforeTemporaryDirectories = beforeTemporaryDirectories;
  result.afterTemporaryDirectories = fs.readdirSync(scratchRoot).filter(name => name.startsWith('red-current-verification-')).sort();
  return result;
}
function normalChild(result, status, stdout, stderr) {
  assert.deepEqual(result.afterTemporaryDirectories, result.beforeTemporaryDirectories, 'External process must not leave staging directories');
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, status);
  assert.equal(result.stdout, stdout);
  assert.equal(result.stderr, stderr);
}
const beforeIdentity = {
  entrySha256: hash(fs.readFileSync(entryPath)),
  sourceSha256: hash(fs.readFileSync(path.join(packageRoot, 'index.html'))),
  runnerSha256: hash(fs.readFileSync(path.join(packageRoot, 'verification/run-tests-v293.cjs')))
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
    ['version numeric', 'version', 293], ['version null', 'version', null], ['version zero', 'version', '0'], ['version leading zero', 'version', '0293'],
    ['version negative', 'version', '-293'], ['version decimal', 'version', '0.293'], ['version prefixed', 'version', 'v293'], ['version whitespace', 'version', '293 '],
    ['version path', 'version', '../293'], ['version newline', 'version', '293\n']
  ]) refusalCase('manifest invalid ' + label, f => changeManifest(f, m => { m[key] = value; }), 'invalid declared version/schema');
  refusalCase('manifest duplicate JSON key', f => { writeManifest(f, JSON.stringify(f.manifest).replace('{', '{"version":"288",')); writeSums(f); }, 'manifest duplicate or nested keys');
  refusalCase('manifest duplicate escaped JSON key', f => { writeManifest(f, JSON.stringify(f.manifest).replace('{', '{"\\u0076ersion":"288",')); writeSums(f); }, 'manifest duplicate or nested keys');
  refusalCase('manifest nested JSON key', f => changeManifest(f, m => { m.sourceSha256 = { nested: 'x' }; }), 'manifest duplicate or nested keys');
  for (const value of ['game.html', '../index.html', '/index.html', 'INDEX.HTML', null, 12])
    refusalCase('manifest nonfixed source: ' + JSON.stringify(value), f => changeManifest(f, m => { m.source = value; }), 'source must be index.html');
  for (const value of ['verification/run-tests-v288.cjs', '../run-tests-v293.cjs', '/run-tests-v293.cjs', 'verification\\run-tests-v293.cjs', 'verification/run-tests-v293.cjs --long', null])
    refusalCase('manifest nonexact runner: ' + JSON.stringify(value), f => changeManifest(f, m => { m.runner = value; }), 'runner does not match declared version');
  for (const key of ['sourceSha256', 'runnerSha256']) {
    for (const [label, value] of [['uppercase', 'A'.repeat(64)], ['short', 'a'.repeat(63)], ['long', 'a'.repeat(65)], ['nonhex', 'g'.repeat(64)], ['number', 123], ['null', null]])
      refusalCase('manifest invalid ' + key + ': ' + label, f => changeManifest(f, m => { m[key] = value; }), 'invalid source/runner SHA');
    refusalCase('manifest ledger disagreement: ' + key, f => changeManifest(f, m => { m[key] = '0'.repeat(64); }), 'manifest/source/runner checksum disagreement');
  }
  for (const name of requiredNames)
    refusalCase('required ledger entry missing: ' + name, f => writeSums(f, f.names.filter(n => n !== name)), 'required checksum entry missing: ' + name);
  for (const name of ['SHA256SUMS.txt', 'current-verification.json', 'index.html', 'verification/run-tests-v293.cjs', 'README.md'])
    refusalCase('package file missing: ' + name, f => fs.unlinkSync(file(f, name)), 'missing or differently cased file: ' + name);
  for (const name of ['index.html', 'verification/run-tests-v293.cjs', 'verify-current.cjs', 'README.md'])
    refusalCase('listed bytes tampered: ' + name, f => fs.appendFileSync(file(f, name), '\n// changed bytes\n'), 'checksum mismatch: ' + name);
  refusalCase('manifest bytes tampered but still valid JSON', f => fs.appendFileSync(file(f, 'current-verification.json'), ' '), 'checksum mismatch: current-verification.json');
  refusalCase('source wrong version with internally matching SHA', f => {
    const bytes = fs.readFileSync(file(f, 'index.html'), 'utf8').replace('v0.293', 'v0.288');
    fs.writeFileSync(file(f, 'index.html'), bytes); f.manifest.sourceSha256 = hash(bytes); writeManifest(f); writeSums(f);
  }, 'source display version disagrees with manifest');
  refusalCase('source missing display version with matching SHA', f => {
    const bytes = '<!-- SYNTHETIC source without display version -->\n'; fs.writeFileSync(file(f, 'index.html'), bytes); f.manifest.sourceSha256 = hash(bytes); writeManifest(f); writeSums(f);
  }, 'source display version disagrees with manifest');
  refusalCase('source duplicate display version with matching SHA', f => {
    const bytes = fs.readFileSync(file(f, 'index.html'), 'utf8') + '<small>赤色前线 / ORIGINAL RTS / v0.293</small>\n';
    fs.writeFileSync(file(f, 'index.html'), bytes); f.manifest.sourceSha256 = hash(bytes); writeManifest(f); writeSums(f);
  }, 'source display version disagrees with manifest');
  refusalCase('mixed old declared runner and new displayed source with matching SHA', f => {
    fs.renameSync(file(f, 'verification/run-tests-v293.cjs'), file(f, 'verification/run-tests-v288.cjs'));
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
    ['lowercase self entry', s => s + '0'.repeat(64) + '  sha256sums.txt\n', 'checksum manifest must exclude itself'],
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
  refusalCase('differently cased runner directory', f => fs.renameSync(file(f, 'verification'), file(f, 'Verification')), 'missing or differently cased file: verification/run-tests-v293.cjs');
  refusalCase('directory substituted for regular source file', f => { fs.unlinkSync(file(f, 'index.html')); fs.mkdirSync(file(f, 'index.html')); }, 'not a regular package file: index.html');
  refusalCase('ordinary file substituted for runner directory', f => { fs.rmSync(file(f, 'verification'), { recursive: true }); fs.writeFileSync(file(f, 'verification'), 'not a directory'); }, 'not a regular package file: verification/run-tests-v293.cjs');
  for (const name of ['index.html', 'verification/run-tests-v293.cjs', 'current-verification.json', 'SHA256SUMS.txt'])
    refusalCase('outside-package file symlink: ' + name, f => {
      const target = path.join(scratchRoot, 'outside-' + fixtureNumber + '.txt'); fs.renameSync(file(f, name), target); fs.symlinkSync(target, file(f, name));
    }, 'symlink refused: ' + name);
  refusalCase('outside-package directory symlink', f => {
    const target = path.join(scratchRoot, 'outside-dir-' + fixtureNumber); fs.renameSync(file(f, 'verification'), target); fs.symlinkSync(target, file(f, 'verification'), 'dir');
  }, 'symlink refused: verification/run-tests-v293.cjs');
  refusalCase('inside-package source symlink also refused', f => {
    fs.renameSync(file(f, 'index.html'), file(f, 'source-copy.html')); fs.symlinkSync('source-copy.html', file(f, 'index.html'));
  }, 'symlink refused: index.html');
  for (const [label, transform] of [
    ['missing block', () => '# synthetic README without default block\n'],
    ['versioned default command', s => s.replace('node verify-current.cjs', 'node verification/run-tests-v293.cjs')],
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
  ]) test('synthetic spawn contract: ' + name, 'synthetic package; mocked spawnSync, no runner execution', 'one exact Node/staged-absolute-runner/staged-cwd/shell:false/stdio:inherit call; identical independent file copies; staging removed; exit ' + exitStatus + (error ? '; exact error: ' + error : '; no error'), () => {
    const f = fixture(); const r = runVM(f.root, [], { allowSpawn: true, spawnResult: result });
    spawnCall(r, f.root); assert.equal(r.status, exitStatus); assert.deepEqual(r.logs, [declaration(f.root), isolationMessage]); assert.deepEqual(r.errors, error ? [error] : []);
    return { exitStatus: r.status, spawnCalls: r.spawns.length, runnerArguments: ['absolute path to staged verification/run-tests-v293.cjs'], shell: false, stdio: 'inherit', temporaryRemoved: true, stderr: r.errors };
  });
  for (const target of ['index.html', 'verification/run-tests-v293.cjs'])
    test('prelaunch re-read catches changed staged ' + target, 'synthetic package; mocked temporary-file read mutation, no runner execution', 'exit 1; exact source/runner changed-before-launch error; zero spawn; staging removed', () => {
      const f = fixture(); let count = 0, stagedRoot;
      const fakeFs = new Proxy(fs, { get(object, prop) {
        if (prop !== 'readFileSync') return object[prop];
        return (name, ...args) => {
          const bytes = fs.readFileSync(name, ...args);
          if (stagedRoot && name === path.join(stagedRoot, target) && ++count === 2) return Buffer.concat([Buffer.from(bytes), Buffer.from('\nSYNTHETIC concurrent change\n')]);
          return bytes;
        };
      } });
      const r = runVM(f.root, [], { allowSpawn: true, fs: fakeFs, afterOperation(operation, args, result) { if (operation === 'mkdtempSync') stagedRoot = result; } });
      stagedRefusal(r, 'source/runner changed before launch', [declaration(f.root)]); assert.equal(count, 2);
    });
  test('actual external SYNTHETIC child exits seven', 'synthetic package; real child process, not game verification', 'entry exits exactly 7; runner output inherited; no false integrity/game success line', () => {
    const f = fixture("// SYNTHETIC stub only.\nconsole.log('SYNTHETIC child exit seven');\nprocess.exitCode = 7;\n");
    const r = child(f.root, []); normalChild(r, 7, declaration(f.root) + '\n' + isolationMessage + '\nSYNTHETIC child exit seven\n', '');
    return { exitStatus: r.status, realSyntheticChild: true };
  });
  test('actual external SYNTHETIC child receives SIGTERM', 'synthetic package; real child process, not game verification', 'entry exits exactly 1; exact SIGTERM error; no false success line', () => {
    const f = fixture("// SYNTHETIC stub only.\nprocess.kill(process.pid, 'SIGTERM');\n");
    const r = child(f.root, []); normalChild(r, 1, declaration(f.root) + '\n' + isolationMessage + '\n', 'Runner terminated by signal: SIGTERM\n');
    return { exitStatus: r.status, realSyntheticChild: true, childSignal: 'SIGTERM' };
  });
  test('staging whitelist excludes unlisted files, directories and symlinks', 'synthetic package; mocked spawn, no runner execution', 'exact listed bytes copied independently; no unlisted content copied; original unchanged; staging removed', () => {
    const f = fixture();
    fs.writeFileSync(file(f, 'unlisted-secret.txt'), 'SYNTHETIC unlisted sentinel');
    fs.mkdirSync(file(f, 'unlisted-directory'));
    fs.writeFileSync(file(f, 'unlisted-directory/secret.txt'), 'SYNTHETIC nested sentinel');
    const external = path.join(scratchRoot, 'unlisted-external-sentinel.txt'); fs.writeFileSync(external, 'SYNTHETIC outside sentinel');
    fs.symlinkSync(external, file(f, 'unlisted-link.txt'));
    const original = contentSnapshot(f.root);
    const r = runVM(f.root, [], { allowSpawn: true });
    assert.equal(r.status, 0); assert.deepEqual(r.errors, []); assert.deepEqual(r.logs, [declaration(f.root), isolationMessage]); spawnCall(r, f.root);
    assert.deepEqual(contentSnapshot(f.root), original);
    return { copiedFiles: r.spawnSnapshots[0].files.map(record => record.name), unlistedEntriesCopied: 0, hardLinks: 0, temporaryRemoved: true };
  });
  test('temporary-directory allocation failure is exact and nonzero', 'synthetic package; injected filesystem failure', 'exit 1; exact allocation error; zero created directories and spawn; original unchanged', () => {
    const f = fixture(), original = contentSnapshot(f.root);
    const r = runVM(f.root, [], { allowSpawn: true, beforeOperation(name) { if (name === 'mkdtempSync') throw new Error('SYNTHETIC temporary allocation failure'); } });
    assert.equal(r.status, 1); assert.deepEqual(r.errors, ['Current verification refused: SYNTHETIC temporary allocation failure']);
    assert.deepEqual(r.logs, [declaration(f.root)]); assert.equal(r.tempRoots.length, 0); assert.equal(r.spawns.length, 0);
    assert.deepEqual(r.imports, ['node:fs', 'node:path', 'node:crypto', 'node:os']); assert.deepEqual(contentSnapshot(f.root), original);
  });
  for (const target of ['index.html', 'verification/run-tests-v293.cjs', 'SHA256SUMS.txt'])
    test('copy failure cleans staging: ' + target, 'synthetic package; injected copy-write failure', 'exit 1; exact copy error; zero spawn; staging removed; original unchanged', () => {
      const f = fixture(), original = contentSnapshot(f.root);
      const r = runVM(f.root, [], { allowSpawn: true, beforeOperation(name, args, roots) {
        if (name === 'writeFileSync' && roots.length && args[0] === path.join(roots[0], target)) throw new Error('SYNTHETIC copy failure: ' + target);
      } });
      stagedRefusal(r, 'SYNTHETIC copy failure: ' + target, [declaration(f.root)]); assert.deepEqual(contentSnapshot(f.root), original);
    });
  for (const target of ['index.html', 'verification/run-tests-v293.cjs'])
    test('complete staged revalidation catches copy corruption: ' + target, 'synthetic package; injected staging corruption', 'exit 1; exact checksum mismatch; zero spawn; staging removed; original unchanged', () => {
      const f = fixture(), original = contentSnapshot(f.root);
      const r = runVM(f.root, [], { allowSpawn: true, afterOperation(name, args, result, roots) {
        if (name === 'writeFileSync' && args[0] === path.join(roots[0], 'SHA256SUMS.txt')) fs.appendFileSync(path.join(roots[0], target), '\nSYNTHETIC copy corruption\n');
      } });
      stagedRefusal(r, 'checksum mismatch: ' + target, [declaration(f.root)]); assert.deepEqual(contentSnapshot(f.root), original);
    });
  test('complete staged revalidation checks README semantics after coherent rehash', 'synthetic package; injected coherent staging alteration', 'exit 1; exact README mismatch; zero spawn; staging removed; original unchanged', () => {
    const f = fixture(), original = contentSnapshot(f.root);
    const r = runVM(f.root, [], { allowSpawn: true, afterOperation(name, args, result, roots) {
      if (name === 'writeFileSync' && args[0] === path.join(roots[0], 'SHA256SUMS.txt')) {
        const staged = { ...f, root: roots[0] }; fs.writeFileSync(file(staged, 'README.md'), 'SYNTHETIC invalid default block\n'); writeSums(staged);
      }
    } });
    stagedRefusal(r, 'README stable default block mismatch', [declaration(f.root)]); assert.deepEqual(contentSnapshot(f.root), original);
  });
  test('consistent staged version replacement fails original identity comparison', 'synthetic package; injected internally consistent alternate version', 'exit 1; exact temporary identity disagreement; zero spawn; staging removed; original unchanged', () => {
    const f = fixture(), original = contentSnapshot(f.root);
    const r = runVM(f.root, [], { allowSpawn: true, afterOperation(name, args, result, roots) {
      if (name === 'writeFileSync' && args[0] === path.join(roots[0], 'SHA256SUMS.txt')) {
        const staged = { root: roots[0], manifest: { ...f.manifest }, names: [...f.names] };
        const source = fs.readFileSync(file(staged, 'index.html'), 'utf8').replace('v0.293', 'v0.294');
        fs.writeFileSync(file(staged, 'index.html'), source); staged.manifest.version = '294'; staged.manifest.sourceSha256 = hash(source);
        fs.renameSync(file(staged, 'verification/run-tests-v293.cjs'), file(staged, 'verification/run-tests-v294.cjs'));
        staged.manifest.runner = 'verification/run-tests-v294.cjs'; staged.names[1] = staged.manifest.runner;
        writeManifest(staged); writeSums(staged);
      }
    } });
    stagedRefusal(r, 'temporary package identity disagreement', [declaration(f.root)]); assert.deepEqual(contentSnapshot(f.root), original);
  });
  test('consistent staged ledger extension fails original entry-count comparison', 'synthetic package; injected additional listed content', 'exit 1; exact temporary identity disagreement; zero spawn; staging removed; original unchanged', () => {
    const f = fixture(), original = contentSnapshot(f.root);
    const r = runVM(f.root, [], { allowSpawn: true, afterOperation(name, args, result, roots) {
      if (name === 'writeFileSync' && args[0] === path.join(roots[0], 'SHA256SUMS.txt')) {
        const staged = { ...f, root: roots[0], names: [...f.names, 'injected.txt'] };
        fs.writeFileSync(file(staged, 'injected.txt'), 'SYNTHETIC extra ledger entry'); writeSums(staged);
      }
    } });
    stagedRefusal(r, 'temporary package identity disagreement', [declaration(f.root)]); assert.deepEqual(contentSnapshot(f.root), original);
  });
  test('thrown spawn exception cleans staging and stays nonzero', 'synthetic package; injected spawn exception', 'exit 1; exact thrown-spawn error; one precise spawn attempt; staging removed; original unchanged', () => {
    const f = fixture(), original = contentSnapshot(f.root);
    const r = runVM(f.root, [], { allowSpawn: true, onSpawn() { throw new Error('SYNTHETIC thrown spawn exception'); } });
    assert.equal(r.status, 1); assert.deepEqual(r.errors, ['Current verification refused: SYNTHETIC thrown spawn exception']);
    assert.deepEqual(r.logs, [declaration(f.root), isolationMessage]); spawnCall(r, f.root); assert.deepEqual(contentSnapshot(f.root), original);
  });
  test('copy uses captured verified bytes after synthetic original mutation', 'synthetic package; simulated external mutation after validation', 'one spawn with pre-mutation verified source/runner/SHA bytes; staging removed', () => {
    const f = fixture(), expectedFiles = treeSnapshot(f.root); let modified = false;
    const r = runVM(f.root, [], { allowSpawn: true, beforeOperation(name) {
      if (name === 'mkdtempSync' && !modified) {
        modified = true;
        fs.appendFileSync(file(f, 'index.html'), '\nSYNTHETIC external post-validation source change\n');
        fs.appendFileSync(file(f, 'verification/run-tests-v293.cjs'), '\nSYNTHETIC external post-validation runner change\n');
        fs.appendFileSync(file(f, 'SHA256SUMS.txt'), '\n');
      }
    } });
    assert.equal(r.status, 0); assert.deepEqual(r.errors, []); assert.equal(r.spawns.length, 1); assert.equal(modified, true);
    assert.deepEqual(r.spawnSnapshots[0].files.map(({ dev, ino, ...record }) => record), expectedFiles.map(({ dev, ino, ...record }) => record));
    cleaned(r);
  });
  test('actual SYNTHETIC writer cannot mutate original package and second check-only succeeds', 'synthetic package; real writing runner subprocess, not RED game coverage', 'runner exit 0; original full-file hashes unchanged; temporary copy removed; subsequent check-only exit 0', () => {
    const body = "// SYNTHETIC writer, not a RED game runner.\nconst fs=require('node:fs'),path=require('node:path');\nconst root=path.resolve(__dirname,'..');\nfor(const name of ['index.html','verification/run-tests-v293.cjs','verify-current.cjs','current-verification.json','README.md','SHA256SUMS.txt']) fs.appendFileSync(path.join(root,name),'\\nSYNTHETIC RESULT MUTATION\\n');\nfs.writeFileSync(path.join(root,'verification','new-result.json'),JSON.stringify({temporary:root}));\nconsole.log('SYNTHETIC_WRITE '+JSON.stringify({root,cwd:process.cwd()}));\n";
    const f = fixture(body), original = contentSnapshot(f.root), initialDeclaration = declaration(f.root);
    const r = child(f.root, []);
    const marker = r.stdout.split('\n').find(line => line.startsWith('SYNTHETIC_WRITE ')); assert(marker, 'Synthetic writer must actually execute');
    const info = JSON.parse(marker.slice('SYNTHETIC_WRITE '.length));
    assert.notEqual(info.root, f.root); assert.equal(info.cwd, info.root); assert.equal(path.dirname(info.root), scratchRoot);
    normalChild(r, 0, initialDeclaration + '\n' + isolationMessage + '\n' + marker + '\n', '');
    assert.equal(fs.existsSync(info.root), false); assert.deepEqual(contentSnapshot(f.root), original);
    const second = child(f.root); normalChild(second, 0, initialDeclaration + '\n' + integrityMessage + '\n', '');
    return { writerActuallyExecuted: true, originalFilesUnchanged: original.length, secondCheckOnlyExitStatus: second.status, temporaryRemoved: true };
  });
  test('genuine source, runner and entry bytes unchanged by acceptance tests', 'genuine package; read-only identity check', 'entry/source/runner SHA256 identical before and after', () => {
    assert.equal(hash(fs.readFileSync(entryPath)), beforeIdentity.entrySha256);
    assert.equal(hash(fs.readFileSync(path.join(packageRoot, 'index.html'))), beforeIdentity.sourceSha256);
    assert.equal(hash(fs.readFileSync(path.join(packageRoot, 'verification/run-tests-v293.cjs'))), beforeIdentity.runnerSha256);
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
