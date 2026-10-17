# v289 扩展玩法验证补充

游戏仍为v0.289。此包汇集已经独审的伤害结算、维修、双闸回廊往返及自然守卫成功证据，原默认聚合、游戏、玩家指南和玩家ZIP均不变。它们是独立可选验证，未加入 `verify-current.cjs` 所执行的原默认聚合。

## 可携带入口

在完整包目录运行全部四族（Node.js 18+，无第三方依赖）：

```sh
node verification/run-extended-gameplay-v289.cjs
```

只运行一族：

```sh
node verification/run-extended-gameplay-v289.cjs --family damage
node verification/run-extended-gameplay-v289.cjs --family repair
node verification/run-extended-gameplay-v289.cjs --family switchback
node verification/run-extended-gameplay-v289.cjs --family survival
```

入口只输出stdout，不改包内历史结果；survival会在私有临时目录写现场完整记录供离线负控读取，并在finally清理。各进程须exit0、无信号/启动错误且stderr为空，随后再比对结果；即使脚本在最后断言前打印了JSON，也不能绕过退出状态门禁。入口自身被强制终止时不保证finally清理。

启动前核固定源/VM及7份批准脚本的hash，逐份反向还原唯一启动层改动并核原脚本hash，所有行为断言保留。伤害/往返输出中的实际源绝对路径先核为本包index.html，再规范为index.html比较及展示；其余结果无字段删改地核JSON.stringify摘要。原报告中的旧工作目录是历史出处，不是运行依赖。仅当前verify/natural/boundary及check-oracle脚本可按下文使用，history里的首轮失败脚本不作为便携入口。

## 自然玩法、明确夹具与记录负控

- **伤害自然场景**：正常UI付费4坦克、真实出厂后单目标进攻，1077固定步内观察4次死亡。每步独立比较活实体消失与kills/losses及资金账本。另5个明确fixture注入弹丸/生命/位置，验证同帧重复伤害、溅射、双HQ平局及死亡后命令，不能称自然AI生成。
- **维修自然场景**：正常付费500购买维修车，侦察车真实受敌火后UI撤回，逐次核min(6,剩余缺血)、ceil(修复量/3)、实际活车及最终满血；修复观察期无来袭弹丸，避免把受击净差当治疗量。另6个合成场景核两车同帧、余额、暂停、目标死亡及终局冻结。
- **双闸回廊**：真实初始侦察车按明确路点出/返程，实际接受队列依次消费，每段距离<5，逐固定步线段岩石净距、两柱穿越顺序与最终坚守都核。返程受真实敌火但生还。只含已批准往返，不含未独审单远点脚本，不证明任意远点自动寻路或路线安全。
- **自然守卫正例**：classic/easy/standard/survival、seed28931，以固定合法UI购买/建设/主动维修策略自然达到360秒，双方HQ仍活，21600个1/60秒记录逐步核独立时间与终态，随后2秒状态冻结。只证明此种子/策略，不泛化难度或其它目标。六类离线记录篡改由同一固定oracle拒绝，属于记录oracle负控，不是产品代码变异或额外自然战局。

各族原报告、原小结果和批准hash在verification/extended-gameplay下；迁移映射见migration-manifest.json。伤害首轮把坦克放在重叠距离20导致原分离逻辑改变预期，修为无重叠40后保持独立公式；守卫首轮矿车价格误写600而实际400，0秒首次购买断言即停，随后同种子策略纠正常量。原失败说明和档案保留，不删去或称产品缺陷。

## 完整守卫记录与摘要

原完整守卫JSON为2078651字节，含21600步记录，保留在包外审查证据中；包内survival/summary.json保留所有非stepTrace字段、列名、行数及完整原始JSON和逐步数组摘要hash，不复制2MB原始记录。

- 完整原JSON SHA-256：3badaa2370f7160f300c5c082668f6232c4298e266de8373c2ff02adce967bed
- JSON.stringify(stepTrace) UTF-8 SHA-256：c540456bcdfe69bb687a64183d8c6edf94cfaf43ba5931869c1ed62309668103

总入口每次运行survival都实际重新生成完整记录，先执行逐步oracle，核完整结果/trace hash，再把现场完整JSON传给六项离线负控。不会用摘要冒充原始记录。要另存可复核full JSON，可将脚本stdout重定向到自己选择的包外路径（以下示例会覆盖该输出文件，请先确认路径）：

```sh
node verification/extended-gameplay/survival/verify.cjs > /tmp/RED-v289-survival-full.json
node verification/extended-gameplay/survival/check-oracle.cjs /tmp/RED-v289-survival-full.json
```

该导出只是开发验证日志的shell重定向，不是运行游戏存档/下载功能。摘要文件不能传给check-oracle。所有逐步断言仍在脚本中执行，没有因减小包体删减。

## 本轮验证边界

在/tmp移位的完整副本运行独立总入口，将现场各族完整结果与各自批准记录的语义摘要逐一比较；完整守卫原始JSON和21600行trace摘要也比较。所有原包文件保持，只有最终SHA清单更新。现有默认聚合未扩大，本轮不跑无关全套或legacy/long；全部为Node全源码VM／模拟DOM，不宣称浏览器、存档、读屏或原生输入已验收。

本轮实际总入口结果见verification/extended-gameplay/results.json，便携和文件保全证明见portability-results.json。移位副本当时507个文件前后逐项hash一致、stderr为空，四族完整结果与批准记录均一致；6项记录负控读取的是真正现场full记录。汇总中的source字段规范化不改变游戏源身份门槛。非法family参数在执行前拒绝。独立审查另在自己的/tmp副本按族运行repair验证启动路径。
