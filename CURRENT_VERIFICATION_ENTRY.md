# 当前验证入口 v0.291

默认命令：`node verify-current.cjs`。只检查本包：`node verify-current.cjs --check-only`。稳定入口不变，读取current-verification.json并检查全部SHA清单，在临时副本内运行当前v291聚合，原包不作运行目录。离线完整性不等于来源认证或远端最新证明。

历史v290验证说明保留在[历史入口](verification/release-v290-docs/CURRENT_VERIFICATION_ENTRY.md)。本轮结果及真实限制见[QA状态](QA_STATUS.md)。
