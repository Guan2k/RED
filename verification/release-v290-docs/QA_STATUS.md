# 赤色前线 v0.290：验证状态

当前源 `index.html` SHA-256：`85c7c33f0ae8022294c6392df37b52525cd97367dd9aaad82475c4825a3ac8e3`。

本轮有意统一编队保存的空选保护与存活成员过滤，召回不变；详见 [专项范围](verification/GROUP_PROTECTION_V290.md)。

## 已执行

- 新编队保护：94项／384断言通过；10个精确行为变异与1个v289行为对照通过。
- 独立检查：189项通过。基线69通过／120拒绝是保护行为差异敏感度，不算当前通过项。
- 两族稳定参数化测试：8项／229断言、7项／110断言，18个原始行为变异全部检测。

- 最终完整当前聚合：25个继承程序、959项行为／markup与10项源码检查通过；15项历史身份检查分列；48条专项结果（44个直接专项程序＋稳定族4条结果）。见 [当前聚合](verification/v290-aggregate-results.json)。没有启用legacy或long。
- 稳定入口独立检查：167项通过，包含真包check-only与synthetic边界／退出／隔离检查；stub不算游戏覆盖。见 [工具结果](tools/stable-verification/entry-results-v290.json)。
- 最终 `node verify-current.cjs` 隔离聚合于2026-10-18 01:29:40 UTC成功退出，stderr为空；执行前后全部580个当时包内文件SHA一致，没有新增临时目录遗留，运行后check-only通过。见 [实际隔离证据](tools/stable-verification/default-isolated-v290-results.json)。新增结果文件与本页最终说明后仅重算清单和执行静态核验，不改变已测游戏或测试代码。

首轮聚合也通过，证据保存在verification/aggregate-initial-v290-results.json；其新专项为94项／372断言＋10负控。随后增加“其他组不变”的明确断言与一个对应源码变异，最终隔离聚合已完整重跑，当前结果为94项／384断言＋11负控。历史或首轮数字不冒充最终覆盖。

## 维护与限制

历史文件／测试／结果保留，当前聚合核v289原验证文件SHA、精确恢复原源后继续旧身份门禁。稳定入口 `node verify-current.cjs`，只核完整性 `node verify-current.cjs --check-only`；其隔离执行设计保持原字节。离线完整性不是发布者认证或远端最新证明。

本轮仅Node全源码VM／模拟DOM；没有原生浏览器验收，也没有执行游戏存档／载入／导入／导出或原生存储操作。手动fixture和自然地图选择链分列。既有v289长局、三目标证据和精简玩家ZIP未重跑或重建，不视为v290实测；原v289状态原文见 [历史状态](verification/release-v289-docs/QA_STATUS.md)。
