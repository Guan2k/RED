# v289 三目标自然证据补充

本补充保留游戏 v0.289、原默认验证入口、README 和玩家 ZIP。三项都是固定策略下的敌胜／玩家战败；测试通过表示实际目标判定与独立观察相符，不表示玩家获胜，也不代表难度或胜率评测。

## 可携带入口

在本包根目录用 Node.js 执行：

```sh
node verification/run-goal-evidence-v289.cjs
node verification/run-goal-evidence-v289.cjs --family harvest
node verification/run-goal-evidence-v289.cjs --family control
node verification/run-goal-evidence-v289.cjs --family annihilation
```

独立入口默认只执行这三个扩展族，不加入原默认聚合。结果只输出 stdout；不会写回历史结果。每族现场生成完整记录，原主脚本运行全部逐步断言和共享 oracle，再将完整记录送入原离线负控。退出、信号、stderr 或摘要不匹配都失败。临时记录在子进程正常返回或抛错后清理；宿主突然中止无法保证清理。

## 三个真实场景

- 采矿 seed28941：10187 个 1/60 秒步，169.783333 秒。实际卸载己方5940、敌方10080，双 HQ 均1800；敌先交满10000。每步以原矿车身份仍存活、货载减少到零、步前同队完工精炼厂几何距离独立核卸载量，再与累计统计对照。采到但未交回不计。没有把死亡消失当卸载；同帧卸载后死亡无法满足本证人条件时 oracle 会拒绝，本例没有覆盖该边界。
- 控制 seed28951：12014 步，200.233333 秒。敌方累计5400有效步即90秒，双 HQ 均1800；己方最终归零。曾有己方5178有效步（86.3秒）、480非零暂停步（8秒）及一次非零归零。每步从观察到的 owner 和实际活战车位置，以严格车心距<65重建驻圈，再独立累计/暂停/归零；owner 是观察输入，没有重新实现夺点过程。不能称独立核验全部占领算法。
- 歼灭 seed28961：21587 步，359.783333 秒。己方原 HQ 对象 HP=-19并移出实体集合；敌方原 HQ 仍在，HP1549。依据每步原对象身份、HP、实体成员和活 HQ ID 集合判定首次战败。1/60 秒观察不描述同一步内部写入顺序；本例只有单 HQ 死亡，没有自然双 HQ 同帧死亡证据。

三例仅正常菜单/UI购买、建造、集结、坐标与修理操作及自然步进；canPlace/power 查询只读，未注入资源、HP、位置、AI或胜负。各例终局后另核2秒完整 state 冻结。采矿双队同帧达标、HQ与目标同帧优先等仅沿用已有静态/fixture证据，不算这三场自然覆盖。没有运行浏览器、存档或游戏导出。

## 大记录、负控与复现

包内每族 summary.json 保留原结果除 stepTrace 外全部字段，以及完整 raw报告字节数/hash、JSON.stringify 全报告 hash、JSON.stringify(stepTrace) hash和行数。完整原始记录保留在开发证据目录，未装入本包。摘要不能替代 full trace 输入给 oracle。总入口必须现场生成完整 trace并核上述 hash，随后运行7/6/6项离线记录篡改（共19项）；这些是证据 oracle 负控，不是产品源码变异或19场游戏。

可再生成完整报告（选择尚不存在的输出路径；shell重定向会覆盖同名文件）：

```sh
node verification/goal-evidence/harvest/verify.cjs > /tmp/RED-v289-harvest-full.json
node verification/goal-evidence/harvest/check-oracle.cjs /tmp/RED-v289-harvest-full.json
```

control、annihilation同理替换族名与文件名。原REPORT.md、oracle-result.json与启动层迁移清单均随包保留，旧报告的包外路径是历史出处，不是运行依赖。迁移清单逐脚本记录原/便携 hash及唯一逆替换，证明业务断言逐字节未改。

歼灭首次最终复跑因 VM/宿主 Array 原型不同，deepStrictEqual 同值数组失败；保留 history 中原 oracle 和实际失败 stderr。仅两处 live 用 Array.from 转为宿主数组后，原相同 ID/顺序断言及真实主脚本重新通过。这是证据脚本修正，不是游戏缺陷；旧失败不计通过。

本轮仅移位实跑扩展入口和静态完整性检查，没有重跑无关默认聚合。VM/模拟 DOM 证据不代表真实浏览器、读屏、帧率或通用胜率验收。
