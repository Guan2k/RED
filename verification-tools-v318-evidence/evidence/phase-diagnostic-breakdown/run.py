import subprocess,json,time,os
from pathlib import Path
p=Path(__file__).resolve().parent;r=p.parent/'RED'
program="const p=require('node:child_process').spawnSync(process.execPath,['--require',process.argv[1],'verification/command-allocation-feedback-v318.cjs'],{encoding:'utf8',timeout:120000,maxBuffer:4e6});console.log(JSON.stringify({status:p.status,signal:p.signal,errorCode:p.error?.code??null,stdout:p.stdout,stderr:p.stderr}));"
t=time.monotonic();x=subprocess.run(['node','-e',program,str(p/'hook.cjs')],cwd=r,capture_output=True);(p/'result.json').write_bytes(x.stdout);(p/'outer-stderr').write_bytes(x.stderr);(p/'summary.json').write_text(json.dumps({'diagnosticOnly':True,'wallSeconds':time.monotonic()-t,'outerExit':x.returncode})+'\n');print((p/'summary.json').read_text())
