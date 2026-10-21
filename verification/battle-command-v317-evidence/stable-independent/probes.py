from pathlib import Path
import tempfile, shutil, json, hashlib, subprocess
src=Path('red-development/v316-stable-suites/RED').resolve(); results=[]
def sha(b):return hashlib.sha256(b).hexdigest()
with tempfile.TemporaryDirectory(prefix='red-stable-audit-') as tmp:
 r=Path(tmp)/'RED';shutil.copytree(src,r)
 mpath=r/'current-verification.json'; cpath=r/'verification/stable-suites/release-contract.json'; sums=r/'SHA256SUMS.txt'
 original={p:p.read_bytes() for p in [mpath,cpath,sums]}
 def probe(name,edit,expected,refresh=True):
  for p,b in original.items():p.write_bytes(b)
  m=json.loads(mpath.read_text());c=json.loads(cpath.read_text());edit(m,c)
  mpath.write_text(json.dumps(m,indent=2)+'\n');cpath.write_text(json.dumps(c,indent=2)+'\n')
  if refresh:
   sums.write_text('\n'.join(sha((r/n).read_bytes())+'  '+n for _,n in (line.split('  ',1) for line in original[sums].decode().splitlines()))+'\n')
  p=subprocess.run(['node',str(r/'verify-current.cjs'),'--check-only'],capture_output=True,text=True)
  assert p.returncode==1 and expected in p.stderr,(name,p.stdout,p.stderr)
  results.append({'name':name,'passed':True,'reason':p.stderr.strip()})
 probe('path traversal runner',lambda m,c:m.update(runner='verification/stable-suites/../stable-suites/release-runner.cjs'),'runner does not match')
 probe('wrong declared candidate',lambda m,c:m.update(version='315'),'stable historical runner mismatch')
 probe('missing family',lambda m,c:c.update(dispatch=c['dispatch'][2:]),'stable dispatch inventory mismatch')
 probe('duplicate family coverage',lambda m,c:c.update(dispatch=c['dispatch'][:4]+c['dispatch'][:2]),'stable dispatch inventory mismatch')
 probe('negative changed to positive',lambda m,c:c['dispatch'][1].__setitem__(1,c['dispatch'][0][1]),'stable dispatch inventory mismatch')
 probe('missing negative module identity',lambda m,c:c['files'].pop('verification/stable-suites/escape-key-repeat-negative.cjs'),'stable dependency inventory incomplete')
 probe('wrong dependency digest',lambda m,c:c['files'].__setitem__('verification/stable-suites/escape-key-repeat.cjs','0'*64),'stable dependency missing or mismatched')
 for p,b in original.items():p.write_bytes(b)
 target=r/'verification/stable-suites/escape-key-repeat.cjs';backup=target.read_bytes();target.unlink();target.symlink_to(src/'verification/stable-suites/escape-key-repeat.cjs')
 p=subprocess.run(['node',str(r/'verify-current.cjs'),'--check-only'],capture_output=True,text=True);assert p.returncode==1 and 'symlink refused' in p.stderr;results.append({'name':'same-byte external symlink','passed':True,'reason':p.stderr.strip()})
 target.unlink();target.write_bytes(backup)
 # v1 remains accepted on identical source, with its historical runner.
 m=json.loads(mpath.read_text());m.update(schemaVersion=1,runner='verification/run-tests-v316.cjs',runnerSha256=sha((r/'verification/run-tests-v316.cjs').read_bytes()));mpath.write_text(json.dumps(m,indent=2)+'\n');sums.write_text('\n'.join(sha((r/n).read_bytes())+'  '+n for _,n in (line.split('  ',1) for line in original[sums].decode().splitlines()))+'\n')
 p=subprocess.run(['node',str(r/'verify-current.cjs'),'--check-only'],capture_output=True,text=True);assert p.returncode==0 and 'not executed' in p.stdout;results.append({'name':'v1 compatibility identity-only labeled','passed':True})
print(json.dumps({'passed':len(results),'results':results},indent=2))
