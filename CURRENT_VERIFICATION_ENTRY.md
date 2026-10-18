# 稳定默认验证入口：v0.292

运行 `node verify-current.cjs`；只核文件与身份使用 `node verify-current.cjs --check-only`。本版manifest固定v292源和 `verification/run-tests-v292.cjs`。原wrapper字节保持不变：白名单字节快照复制，临时副本复验，只在副本运行聚合并清理，原包不写回结果。不附加legacy或long。

独立门禁工具：`node tools/stable-verification/test-entry-v292.cjs`。它只运行真包check-only和受控synthetic stub，不启动真正游戏聚合；这些检查不计为游戏覆盖。

当前实测结果见QA_STATUS.md。旧版本工具、测试、报告以及v291入口说明保留于verification/release-v291-docs，不冒充v292实测。v292版本化继承测试仅更新身份／恢复链及一项与本版规则明确冲突的重复保存期望，并增加首次重新按键仍有效的断言。

离线清单仅证明包内一致性，不能证明来源或远端最新；同时篡改入口、manifest和清单不在自检防护范围。SIGKILL或宿主中断可能留下临时目录。本轮不运行原生浏览器、存档／载入／导入导出或真实存储操作。旧v289玩家ZIP和builder保持历史严格门禁；v292精简玩家包另行打包与校验，不在本次游戏回归范围内。
