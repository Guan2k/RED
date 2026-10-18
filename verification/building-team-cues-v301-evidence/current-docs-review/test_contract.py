from pathlib import Path
import json,sys
from contract import inspect
base=Path(__file__).resolve().parent.parent/'v300-in-game-guide/RED'
readme=(base/'README.md').read_text().replace('verification/run-tests-v297.cjs','verification/run-tests-v300.cjs');guide=(base/'CURRENT_PLAYER_GUIDE.md').read_text().replace('本指南对应 v0.274','本指南对应 v0.300');fixed={'README.md':readme,'CURRENT_PLAYER_GUIDE.md':guide}
rows=[]
def test(name,over,expect):
 r=inspect(base,over);assert expect(r),name;rows.append({'name':name,'passed':True,'issues':r['issues']})
test('corrected in-memory baseline',fixed,lambda r:r['failed']==0)
test('old actual baseline caught',{},lambda r:set(r['issues'])=={'current-runner-command','current-runner-link','current-guide-identity'})
test('wrong current command',dict(fixed,**{'README.md':readme.replace('node verification/run-tests-v300.cjs','node verification/run-tests-v299.cjs')}),lambda r:'current-runner-command'in r['issues'])
test('wrong current link',dict(fixed,**{'README.md':readme.replace('](verification/run-tests-v300.cjs)','](verification/run-tests-v299.cjs)')}),lambda r:'current-runner-link'in r['issues'])
test('wrong general guide claim',dict(fixed,**{'CURRENT_PLAYER_GUIDE.md':guide.replace('本指南对应 v0.300','本指南对应 v0.274')}),lambda r:'current-guide-identity'in r['issues'])
test('historical guide claim retained',dict(fixed,**{'CURRENT_PLAYER_GUIDE.md':guide+'\n## v0.278 历史\n本指南对应 v0.278。\n'}),lambda r:r['failed']==0)
test('historical current-command quote excluded',dict(fixed,**{'README.md':readme+'\n## v0.278 历史\n本版命令 node verification/run-tests-v278.cjs，见[历史](verification/run-tests-v278.cjs)。\n'}),lambda r:r['failed']==0)
test('heading version prefix is not accepted',dict(fixed,**{'README.md':readme.replace('# RED v0.300：','# RED v0.3000：',1)}),lambda r:'title-README.md' in r['issues'])
test('missing target caught',dict(fixed,**{'README.md':readme+'\n[broken](verification/DOES_NOT_EXIST.cjs)\n'}),lambda r:any('DOES_NOT_EXIST'in x for x in r['issues']))
print(json.dumps({'passed':len(rows),'failed':0,'results':rows,'scope':'In-memory document mutations only; no package writes or game execution.'},ensure_ascii=False,indent=2))
