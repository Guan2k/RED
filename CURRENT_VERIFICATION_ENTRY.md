# 稳定默认验证入口：v0.311

开发／发布运行 `node verify-development.cjs`。八阶段依次检查包完整性、当前文档契约、文档契约单测、权威src装配一致性、构建器测试、建筑数据、车辆数据和游戏聚合。`node verify-development.cjs --check-only` 只执行前七阶段，不运行游戏。

当前runner为verification/run-tests-v311.cjs，与current-verification.json及README一致。v311补充耗尽矿点地表残迹，正数矿点绘制及所有世界规则不变。`node verify-current.cjs` 是既有游戏入口，本身不检查当前文档或editable source。

专项与集成验证已完成。首次尝试在包完整性预检因当前派生证据校验过期停止，未运行游戏测试；完成重封后，本轮完整隔离gate于2026-10-19T10:05:06.140311+00:00至2026-10-19T10:24:26.681374+00:00通过，退出0且stderr为空；3657个原包／隔离副本输入逐SHA不变。通过101构建器、56建筑数据、180车辆数据、959继承行为／标记、10源码检查、15历史身份检查及91专项入口。历史结果不是当前完整验收；原生浏览器像素、读屏、真实存储尚未验收。

编辑流程见DEVELOPING.md和DOCUMENT_CONTRACT_DEVELOPMENT.md。编辑后需经审查更新当前身份和根校验表，历史身份不得重钉。完整状态见[QA状态](QA_STATUS.md)。
