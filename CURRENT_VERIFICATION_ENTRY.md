# 稳定默认验证入口：v0.290

运行 `node verify-current.cjs`，或只核文件与身份 `node verify-current.cjs --check-only`。本版 manifest 绑定 v290 源及 `verification/run-tests-v290.cjs`。wrapper 字节不变：清单白名单快照复制、临时副本复验、只在副本运行聚合、退出清理；原包不写回测试结果。不附加 legacy 或 long。

清单哈希只验证离线一致性，不能证明发布者身份或远端最新。不能抵御同时改入口、manifest、清单。SIGKILL／宿主中断可能留下临时目录。此前 v289 入口设计、独立测试与撤回尝试的原文保存在 verification/release-v289-docs/CURRENT_VERIFICATION_ENTRY.md，旧报告不算本版实测。

本版独立工具检查：`node tools/stable-verification/test-entry-v290.cjs`。仅将冻结 v289 专项的版本身份迁移到290，保留原断言；synthetic stub不是游戏行为覆盖。本版实际结果见 QA_STATUS.md 与 verification/GROUP_PROTECTION_V290.md。

本轮不运行旧玩家包 builder、文档迁移验证或原生浏览器；旧v289工具继续严格拒绝变更输入，不放宽旧门禁。
