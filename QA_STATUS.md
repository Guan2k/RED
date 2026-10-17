# 赤色前线 v0.289：验证状态

当前游戏：[index.html](index.html)，SHA-256 `ea0becbe2c9ff381512b92cbe6e6713d461f20ae20707584b43d3f462f0ed9fb`。本页是证据导航，不是所有环境、地图或策略的质量保证；历史版本的结果保留其原版本含义，不合并算作当前 v289 实测。

## 玩家与开发包

- **玩家离线包**仅4个文件：原字节游戏、玩家README、整理后的玩家指南、SHA清单；解压后打开游戏，玩家无需Python或Node。打包工具与可复现边界见[玩家包说明](PLAYER_PACKAGE_BUILD_V289.md)。
- **本开发包**包含同一游戏、完整指南、历次源码边界与验证证据、开发工具；体积与文件数更多，不是另一套玩法。玩家操作见[当前指南](CURRENT_PLAYER_GUIDE.md)。

## 当前默认验证

在开发包根目录运行 `node verify-current.cjs`。它先静态核包清单、声明版本与精确源/runner，再复制已核文件到私有临时目录运行本版底层聚合，避免改写原包历史结果。

只查本包一致性：`node verify-current.cjs --check-only`，不执行游戏或创建运行副本。离线完整性不证明远端最新版本或发布者真实性。具体行为及最近真实默认运行见[入口说明](CURRENT_VERIFICATION_ENTRY.md)与[隔离运行证据](tools/stable-verification/default-isolated-results.json)。扩展自然长局是另外的可选入口，不自动加入默认聚合。

## 当前源的主要自然场景（正常UI＋固定步进，VM执行）

- **可选开局练习**：真实出厂约4.05秒、实际交矿约5.85秒、本局曾占点约11秒；全部完成后战局继续。逐步与v288参考世界配对，暂停不推进，新局归零。[专项与边界](verification/OPENING_PRACTICE_V289.md)
- **守卫**：360秒玩家胜利，双方HQ均存活；固定策略单场景。[完整范围](verification/extended-gameplay/survival/REPORT.md)／[结果摘要](verification/extended-gameplay/survival/summary.json)
- **采矿**：169.783333秒玩家战败，己方实际卸载5940、敌方10080，双HQ存活。独立核货载减少、存活原对象和卸载前精炼厂距离。[范围](verification/goal-evidence/harvest/REPORT.md)／[摘要](verification/goal-evidence/harvest/summary.json)
- **控制**：200.233333秒玩家战败，敌方完成90秒有效控制。己方曾有86.3秒进度、8秒非零暂停及一次归零；owner是观测输入，独立核圈内活车几何与有效计时，没有重实现夺点过程。[范围](verification/goal-evidence/control/REPORT.md)／[摘要](verification/goal-evidence/control/summary.json)
- **歼灭**：359.783333秒玩家战败，己方原HQ死亡并移出实体集合，敌HQ仍存活。按固定步边界核对象身份/HP/成员关系，不声称观察同一步内部写入顺序。[范围](verification/goal-evidence/annihilation/REPORT.md)／[摘要](verification/goal-evidence/annihilation/summary.json)

这些胜败结果不用于推断通用胜率或难度平衡。伤害、维修、往返路线与守卫见[四族扩展证据](EXTENDED_GAMEPLAY_V289.md)；三个目标的完整trace再生成及离线记录负控见[三目标入口](GOAL_EVIDENCE_V289.md)。摘要不替代现场完整逐步断言。采矿同帧双达标、交矿后同帧死亡、双HQ同帧毁灭等不属于上述自然场景覆盖。

## 其他证据与未验收项

- **Synthetic／fixture**：人为设置的伤害、维修及统计/显示边界明确单列；它们不是正常UI形成的自然战局。离线记录篡改检验证据oracle，也不是产品源码变异或额外游戏局。[四族说明](EXTENDED_GAMEPLAY_V289.md)与[练习专项](verification/OPENING_PRACTICE_V289.md)列明区别。
- **静态／工具**：源码差异围栏、包哈希、路径/链接与打包复现核对只支持各自限定结论；旧源参考/历史报告不算当前源实跑。静态存档审查尚无可复现问题输入，不能据此称存在已确认bug或已修复。
- **仍未原生验收**：真实浏览器布局与交互、IME组合输入、读屏、真实浏览器堆/性能、原生保存及导入导出/下载完成。VM与模拟DOM不能替代这些验收，也不提供FPS提升结论。保存前仍应阅读[当前指南](CURRENT_PLAYER_GUIDE.md)中的覆盖、快照及路径迁移风险。

本次仅新增本页并更新清单；只运行静态check-only，不重复游戏回归。游戏源码、README、既有测试与结果、玩家包均未改变。
